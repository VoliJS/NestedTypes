var Backbone = require( './backbone+' ),
    Model    = require( './model' ),
    error    = require( './errors' ),
    _        = require( 'underscore' );

var CollectionProto = Backbone.Collection.prototype;

function wrapCall( func ){
    return function(){
        if( !this.__changing++ ){
            this.trigger( 'before:change' );
        }

        var res = func.apply( this, arguments );

        if( !--this.__changing ){
            this.trigger( 'after:change' );
        }

        return res;
    };
}

module.exports = Backbone.Collection.extend( {
    triggerWhenChanged : Backbone.VERSION >= '1.2.0' ? 'update change reset' : 'add remove change reset',
    __class            : 'Collection',

    model : Model,

    isValid : function( options ){
        return this.every( function( model ){
            return model.isValid( options );
        } );
    },

    get : function( obj ){
        if( obj == null ){
            return void 0;
        }
        return typeof obj === 'object' ? this._byId[ obj.id ] || this._byId[ obj.cid ] : this._byId[ obj ];
    },

    deepClone : function(){ return this.clone( { deep : true } ); },

    clone : function( options ){
        var models = options && options.deep ?
                     this.map( function( model ){
                         return model.clone( options );
                     } ) : this.models;

        return new this.constructor( models );
    },

    __changing : 0,

    set : wrapCall( function( models, options ){
        if( models ){
            if( typeof models !== 'object' || !( models instanceof Array || models instanceof Model ||
                Object.getPrototypeOf( models ) === Object.prototype ) ){
                error.wrongCollectionSetArg( this, models );
            }
        }

        return CollectionProto.set.call( this, models, options );
    } ),

    remove : wrapCall( CollectionProto.remove ),
    add    : wrapCall( CollectionProto.add ),
    reset  : wrapCall( CollectionProto.reset ),
    sort   : wrapCall( CollectionProto.sort ),

    getModelIds : function(){ return _.pluck( this.models, 'id' ); }
}, {
    // Cache for subsetOf collection subclass.
    __subsetOf : null,
    defaults   : function( attrs ){
        return this.prototype.model.extend( { defaults : attrs } ).Collection;
    },
    extend     : function(){
        // Need to subsetOf cache when extending the collection
        var This = Backbone.Collection.extend.apply( this, arguments );
        This.__subsetOf = null;
        return This;
    }
} );
