import * as _ from 'underscore'
import { Model, tools } from 'type-r'

export const ModelMixin = {
    pick( ...args : any[] ){
        return _.pick( this, args );
    },

    values( this : Model ){
        return this.keys().map( name => this[ name ] );
    },

    each: Model.prototype.forEach,

    escape( attr ){
        return _.escape( this[ attr ] );
    },

    matches( attrs ){
        return !!_.iteratee( attrs, this )( this );
    },

    omit( ...keys : string[] ) : {} {
        return this.mapObject( ( value, key ) => {
            if( keys.indexOf( key ) < 0 ){
                return value;
            }
        });
    },

    invert(){
        const inverted = {};
        this.each( ( value, key ) => inverted[ value ] = key );
        return inverted;
    },

    pairs(){
        return this.map( ( value, key ) => [ key, value ] );
    },

    isEmpty(){
        return !this.values().length;
    },

    chain(){
        return _.chain( this.mapObject( x => x ) );
    }
};

export const CollectionMixin = {
    where(attrs, first) {
        return this[first ? 'find' : 'filter'](attrs);
    },

    findWhere(attrs) {
        return this.where(attrs, true);
    }
};

addUnderscoreMethods( CollectionMixin, 'models', {
    forEach  : 3, each : 3, map : 3, collect : 3, reduce : 4,
    foldl    : 4, inject : 4, reduceRight : 4, foldr : 4, find : 3, findIndex : 3, findLastIndex : 3, detect : 3, filter : 3,
    select   : 3, reject : 3, every : 3, all : 3, some : 3, any : 3, include : 3, includes : 3,
    contains : 3, invoke : 0, max : 3, min : 3, toArray : 1, size : 1, first : 3,
    head     : 3, take : 3, initial : 3, rest : 3, tail : 3, drop : 3, last : 3,
    without  : 0, difference : 0, indexOf : 3, shuffle : 1, lastIndexOf : 3,
    isEmpty  : 1, chain : 1, sample : 3, partition : 3, groupBy : 3, countBy : 3,
    sortBy   : 3, indexBy : 3
});

function addUnderscoreMethods(Mixin, attribute, methods ) {
    _.each(methods, function(length, method) {
        if (_[method]) Mixin[method] = addMethod(length, method, attribute);
    });
}

// Proxy Backbone class methods to Underscore functions, wrapping the model's
// `attributes` object or collection's `models` array behind the scenes.
//
// collection.filter(function(model) { return model.get('age') > 10 });
// collection.each(this.addView);
//
// `Function#apply` can be slow so we use the method's arg count, if we know it.
function addMethod(length, method, attribute) {
    switch (length) {
        case 1: return function() {
            return _[method](this[attribute]);
        };
        case 2: return function(value) {
            return _[method](this[attribute], value);
        };
        case 3: return function(iteratee, context) {
            var value = this[ attribute ],
                callback = cb(iteratee, this);

            return arguments.length > 1 ?
                _[method]( value, callback, context)
                : _[method]( value, callback );
        };
        case 4: return function(iteratee, defaultVal, context) {
            var value = this[ attribute ],
                callback = cb(iteratee, this);

            return arguments.length > 1 ?
                _[method]( value, callback, defaultVal, context )
                : _[method](value, callback );
        };
        default: return function( ...args : any[] ) {
            args.unshift(this[attribute]);
            return _[method].apply(_, args);
        };
    }
}

// Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
function cb(iteratee, instance) {
    switch( typeof iteratee ){
        case 'function' : return iteratee;
        case 'string' : return model => model.get( iteratee );
        case 'object' :
            if( !(iteratee instanceof instance.model )) return _.matches( iteratee ); 
    }

    return iteratee;
}