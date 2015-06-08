(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require('underscore'), require('backbone'));
    }
    else if(typeof define === 'function' && define.amd) {
        define(['underscore', 'backbone', 'chaplin'], function( _, Backbone, Chaplin ){
            Chaplin.Events || ( Chaplin.Events = Backbone.Events );
            Chaplin.History || ( Chaplin.History = Backbone.History );
	        return factory( _, Chaplin );
	    });
    }
    else {
        root.Nested = factory(root._, root.Backbone);
    }
}(this, function( _, Backbone ) {
    var require = function(name) {
        return { underscore: _, backbone : Backbone }[name];
    };
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Options wrapper for chained and safe type specs...
// --------------------------------------------------
require( './object+' );

var trigger3         = require( './backbone+' ).Events.trigger3,
    modelSet         = require( './modelset' ),
    genericIsChanged = modelSet.isChanged,
    setSingleAttr    = modelSet.setSingleAttr;

var primitiveTypes = {
    string  : String,
    number  : Number,
    boolean : Boolean
};

// list of simple accessor methods available in options
var availableOptions = [ 'triggerWhenChanged', 'parse', 'clone', 'toJSON', 'value', 'cast', 'create', 'name', 'value',
                         'type' ];

var Options = Object.extend( {
    _options : {}, // attribute options

    Attribute : null, // default attribute spec when no type is given, is set to Attribute below

    properties : {
        has : function(){ return this; }
    },

    constructor : function( spec ){
        // special option used to guess types of primitive values and to distinguish value from type
        if( 'typeOrValue' in spec ){
            var typeOrValue   = spec.typeOrValue,
                primitiveType = primitiveTypes[ typeof typeOrValue ];

            if( primitiveType ){
                spec = { type : primitiveType, value : typeOrValue };
            }
            else{
                spec = typeof typeOrValue == 'function' ? { type : typeOrValue } : { value : typeOrValue };
            }
        }

        this._options = {};
        this.options( spec );
    },

    // get hooks stored as an array
    get : function( getter ){
        var options = this._options;
        options.get = options.get ? options.get.unshift( getter ) : [ getter ];
        return this;
    },

    // set hooks stored as an array
    set : function( setter ){
        var options = this._options;
        options.set = options.set ? options.set.push( setter ) : [ setter ];
        return this;
    },

    // events must be merged
    events : function( events ){
        this._options.events = Object.assign( this._options.events || {}, events );
        return this;
    },

    // options must be merged using rules for individual accessors
    options : function( options ){
        for( var i in options ){
            this[ i ]( options[ i ] );
        }

        return this;
    },

    // construct attribute with a given name and proper type.
    createAttribute : function( name ){
        var options = this._options,
            Type    = options.type ? options.type.Attribute : this.Attribute;

        return new Type( name, options );
    }
} );

availableOptions.forEach( function( name ){
    Options.prototype[ name ] = function( value ){
        this._options[ name ] = value;
        return this;
    };
} );

function chainHooks( array ){
    var l = array.length;

    return l === 1 ? array[ 0 ] : function( value, name ){
        var res = value;
        for( var i = 0; i < l; i++ ){
            res = array[ i ].call( this, res, name );
        }
        return res;
    };
}

var transform = {
    hookAndCast : function( val, options, model, name ){
        var value = this.cast( val, options, model, name ),
            prev  = model.attributes[ name ];

        if( this.isChanged( value, prev ) ){
            value = this.set.call( model, value, name );
            return value === undefined ? prev : this.cast( value, options, model );
        }

        return value;
    },

    hook : function( value, options, model, name ){
        var prev = model.attributes[ name ];

        if( this.isChanged( value, prev ) ){
            var changed = this.set.call( model, value, name );
            return changed === undefined ? prev : changed;
        }

        return value;
    },

    delegateAndMore : function( val, options, model, attr ){
        return this.delegateEvents( this._transform( val, options, model, attr ), options, model, attr );
    }
};

// Base class for Attribute metatype
// ---------------------------------

var Attribute = Object.extend( {
    name  : null,
    type  : null,
    value : undefined,

    // cast function
    // may be overriden in subclass
    cast : null, // function( value, options, model ),

    // get and set hooks...
    get : null,
    set : null,

    // user events
    events : null, // { event : handler, ... }

    // system events
    __events : null, // { event : handler, ... }

    // create empty object passing backbone options to constructor...
    // must be overriden for backbone types only
    create : function( options ){ return new this.type(); },

    // optimized general purpose isEqual function for typeless attributes
    // must be overriden in subclass
    isChanged : genericIsChanged,

    // generic clone function for typeless attributes
    // Must be overriden in sublass
    clone : function( value, options ){
        if( value && typeof value === 'object' ){
            var proto = Object.getPrototypeOf( value );

            if( proto.clone ){
                // delegate to object's clone if it exist
                return value.clone( options );
            }

            if( options && options.deep && proto === Object.prototype || proto === Array.prototype ){
                // attempt to deep copy raw objects, assuming they are JSON
                return JSON.parse( JSON.stringify( value ) );
            }
        }

        return value;
    },

    toJSON : function( value, key ){
        return value && value.toJSON ? value.toJSON() : value;
    },

    // must be overriden for backbone types...
    createPropertySpec : function(){
        return (function( self, name, get ){
            return {
                // call to optimized set function for single argument. Doesn't work for backbone types.
                set : function( value ){ setSingleAttr( this, name, value, self ); },

                // attach get hook to the getter function, if present
                get : get ? function(){ return get.call( this, this.attributes[ name ], name ); } :
                      function(){ return this.attributes[ name ]; }
            }
        })( this, this.name, this.get );
    },

    // automatically generated optimized transform function
    // do not touch.
    _transform : null,
    transform  : function( value ){ return value; },

    // delegate user and system events on attribute transform
    delegateEvents : function( value, options, model, name ){
        var prev = model.attributes[ name ];

        if( this.isChanged( prev, value ) ){ //should be changed only when attr is really replaced.
            prev && prev.trigger && model.stopListening( prev );

            if( value && value.trigger ){
                if( this.events ){
                    model.listenTo( value, this.events );
                }
                if( this.__events ){
                    model.listenTo( value, this.__events );
                }
            }

            trigger3( model, 'replace:' + name, model, value, prev );
        }

        return value;
    },

    constructor : function( name, spec ){
        this.name = name;

        Object.transform( this, spec, function( value, name ){
            if( name === 'events' && this.events ){
                return Object.assign( this.events, value );
            }

            if( name === 'get' ){
                if( this.get ){
                    value.unshift( this.get );
                }
                return chainHooks( value );
            }

            if( name === 'set' ){
                if( this.set ){
                    value.push( this.set );
                }
                return chainHooks( value );
            }

            return value;
        }, this );

        this.initialize( spec );

        // assemble optimized transform function...
        if( this.cast ){
            this.transform = this._transform = this.cast;
        }
        if( this.set ){
            this.transform = this._transform = this.cast ? transform.hookAndCast : transform.hook;
        }
        if( this.events || this.__events ){
            this.transform =
                this._transform ? transform.delegateAndMore : this.delegateEvents;
        }
    }
}, {
    attach : (function(){
        function options( spec ){
            spec || ( spec = {} );
            spec.type || ( spec.type = this );
            return new Options( spec );
        }

        function value( value ){
            return new Options( { type : this, value : value } );
        }

        return function(){
            for( var i = 0; i < arguments.length; i++ ){
                var Type = arguments[ i ];
                Type.attribute = Type.options = options;
                Type.value = value;
                Type.Attribute = this;
                Object.defineProperty( Type, 'has', {
                    get : function(){
                        // workaround for sinon.js and other libraries overriding 'has'
                        return this._has || this.options();
                    },
                    set : function( value ){ this._has = value; }
                } );
            }
        };
    })()
} );

Options.prototype.Attribute = Attribute;

function createOptions( spec ){
    return new Options( spec );
}

createOptions.Type = Attribute;
createOptions.create = function( options, name ){
    if( !( options && options instanceof Options ) ){
        options = new Options( { typeOrValue : options } );
    }

    return options.createAttribute( name );
};

module.exports = createOptions;
},{"./backbone+":2,"./modelset":7,"./object+":8}],2:[function(require,module,exports){
/* Backbone core extensions: bug fixes and optimizations
    - Use Object+ for all backbone objects
    - Fix for Events.listenTo to support message maps
    - optimized trigger functions

 * (c) Vlad Balin & Volicon, 2015
 * ------------------------------------------------------------- */

var Class = require( './object+' ),
    Backbone = require( 'backbone' );

module.exports = Backbone;

// Workaround for backbone 1.2.0 listenTo event maps bug
var Events = Backbone.Events,
    bbListenTo = Events.listenTo;

Events.listenTo = function( obj, events ){
    if( typeof events === 'object' ){
        for( var event in events ) bbListenTo.call( this, obj, event, events[ event ] );
        return this;
    }

    return bbListenTo.apply( this, arguments );
};

// Update Backbone objects to use event patches and Object+
[ 'Model', 'Collection', 'View', 'Router', 'History' ].forEach( function( name ){
    var Type = Backbone[ name ];
    Type.prototype.listenTo = Events.listenTo;
    Object.extend.attach( Type );
});

// Make Object.extend classes capable of sending and receiving Backbone Events...
Object.assign( Class.prototype, Events );

// So hard to believe :) You won't. Optimized JIT-friendly event trigger functions to be used from model.set
// Two specialized functions for event triggering...
Events.trigger2 = function( self, name, a, b ){
    var _events = self._events;
    if( _events ){
        _fireEvent2( _events[ name ], a, b );
        _fireEvent3( _events.all, name, a, b );
    }
};

Events.trigger3 = function( self, name, a, b, c ){
    var _events = self._events;
    if( _events ){
        _fireEvent3( _events[ name ], a, b, c );
        _fireEvent4( _events.all, name, a, b, c );
    }
};

// ...and specialized functions with triggering loops. Crappy JS JIT loves these small functions and code duplication.
function _fireEvent2( events, a, b ){
    if( events )
        for( var i = 0, l = events.length, ev; i < l; i ++ )
            (ev = events[i]).callback.call(ev.ctx, a, b);
}

function _fireEvent3( events, a, b, c ){
    if( events )
        for( var i = 0, l = events.length, ev; i < l; i ++ )
            (ev = events[i]).callback.call(ev.ctx, a, b, c);
}

function _fireEvent4( events, a, b, c, d ){
    if( events )
        for( var i = 0, l = events.length, ev; i < l; i ++ )
            (ev = events[i]).callback.call(ev.ctx, a, b, c, d);
}
},{"./object+":8,"backbone":"backbone"}],3:[function(require,module,exports){
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

},{"./backbone+":2,"./errors":4,"./model":6,"underscore":"underscore"}],4:[function(require,module,exports){
require( './object+' );

function format( value ){
    return typeof value === 'string' ? '"' + value + '"' : value;
}

Object.assign( Object.extend.error, {
    argumentIsNotAnObject : function( context, value ){
        //throw new TypeError( 'Attribute hash is not an object in ' + context.__class + '.set(', value, ')' );
        console.error( '[Type Error] Attribute hash is not an object in ' +
                       context.__class + '.set(', format( value ), '); this =', context );
    },

    unknownAttribute : function( context, name, value ){
        if( context.suppressTypeErrors ) return;

        console.warn( '[Type Error] Attribute has no default value in ' +
                        context.__class + '.set( "' + name + '",', format( value ), '); this =', context );
    },

    wrongCollectionSetArg : function( context, value ){
        //throw new TypeError( 'Wrong argument type in ' + context.__class + '.set(' + value + ')' );
        console.error( '[Type Error] Wrong argument type in ' +
                       context.__class + '.set(', format( value ), '); this =', context );
    }
});

module.exports = Object.extend.error;
},{"./object+":8}],5:[function(require,module,exports){
// Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
// © 2011 Colin Snover <http://zetafleet.com>
// Released under MIT license.

// Attribute Type definitions for core JS types
// ============================================
var attribute  = require( './attribute' ),
    modelSet   = require( './modelset' ),
    Model      = require( './model' ),
    Collection = require( './collection' );

// Constructors Attribute
// ----------------
attribute.Type.extend( {
    cast : function( value ){
        return value == null || value instanceof this.type ? value : new this.type( value );
    },

    clone : function( value, options ){
        // delegate to clone function or deep clone through serialization
        return value.clone ? value.clone( value, options ) : this.cast( JSON.parse( JSON.stringify( value ) ) );
    }
} ).attach( Function.prototype );

// Date Attribute
// ----------------------
var numericKeys    = [ 1, 4, 5, 6, 7, 10, 11 ],
    msDatePattern  = /\/Date\(([0-9]+)\)\//,
    isoDatePattern = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;

function parseDate( date ){
    var msDate, timestamp, struct, minutesOffset = 0;

    if( msDate = msDatePattern.exec( date ) ){
        timestamp = Number( msDate[ 1 ] );
    }
    else if( ( struct = isoDatePattern.exec( date )) ){
        // avoid NaN timestamps caused by �undefined� values being passed to Date.UTC
        for( var i = 0, k; ( k = numericKeys[ i ] ); ++i ){
            struct[ k ] = +struct[ k ] || 0;
        }

        // allow undefined days and months
        struct[ 2 ] = (+struct[ 2 ] || 1) - 1;
        struct[ 3 ] = +struct[ 3 ] || 1;

        if( struct[ 8 ] !== 'Z' && struct[ 9 ] !== undefined ){
            minutesOffset = struct[ 10 ] * 60 + struct[ 11 ];

            if( struct[ 9 ] === '+' ){
                minutesOffset = 0 - minutesOffset;
            }
        }

        timestamp =
            Date.UTC( struct[ 1 ], struct[ 2 ], struct[ 3 ], struct[ 4 ], struct[ 5 ] + minutesOffset, struct[ 6 ],
                struct[ 7 ] );
    }
    else{
        timestamp = Date.parse( date );
    }

    return timestamp;
}

attribute.Type.extend( {
    cast : function( value ){
        return value == null || value instanceof Date ? value :
               new Date( typeof value === 'string' ? parseDate( value ) : value )
    },

    toJSON : function( value ){ return value && value.toJSON(); },

    isChanged : function( a, b ){ return ( a && +a ) !== ( b && +b ); },
    clone     : function( value ){ return new Date( +value ); }
} ).attach( Date );

// Primitive Types
// ----------------
// Global Mock for missing Integer data type...
// -------------------------------------
Integer = function( x ){ return x ? Math.round( x ) : 0; };

attribute.Type.extend( {
    create : function(){ return this.type(); },

    toJSON : function( value ){ return value; },
    cast   : function( value ){ return value == null ? null : this.type( value ); },

    isChanged : function( a, b ){ return a !== b; },

    clone : function( value ){ return value; }
} ).attach( Number, Boolean, String, Integer );

// Array Type
// ---------------
attribute.Type.extend( {
    toJSON : function( value ){ return value; },
    cast   : function( value ){
        // Fix incompatible constructor behaviour of Array...
        return value == null || value instanceof Array ? value : [ value ];
    }
} ).attach( Array );

// Backbone Attribute
// ----------------

// helper attrSpec mock to force attribute update
var bbForceUpdateAttr = new ( attribute.Type.extend( {
    isChanged : function(){ return true; }
} ) );

var setAttrs      = modelSet.setAttrs,
    setSingleAttr = modelSet.setSingleAttr;

attribute.Type.extend( {
    create : function( options ){ return new this.type( null, options ); },
    clone  : function( value, options ){ return value && value.clone( options ); },
    toJSON : function( value ){ return value && value.toJSON(); },

    isChanged : function( a, b ){ return a !== b; },

    isBackboneType : true,
    isModel        : true,

    createPropertySpec : function(){
        // if there are nested changes detection enabled, disable optimized setter
        if( this.__events ){
            return (function( self, name, get ){
                return {
                    set : function( value ){
                        var attrs = {};
                        attrs[ name ] = value;
                        setAttrs( this, attrs );
                    },

                    get : get ? function(){ return get.call( this, this.attributes[ name ], name ); } :
                          function(){ return this.attributes[ name ]; }
                }
            })( this, this.name, this.get );
        }
        else{
            return attribute.Type.prototype.createPropertySpec.call( this );
        }
    },

    cast : function( value, options, model, name ){
        var incompatibleType          = value != null && !( value instanceof this.type ),
            existingModelOrCollection = model.attributes[ name ];

        if( incompatibleType ){
            if( existingModelOrCollection ){ // ...delegate update for existing object 'set' method
                if( options && options.parse && this.isModel ){ // handle inconsistent backbone's parse implementation
                    value = existingModelOrCollection.parse( value );
                }

                existingModelOrCollection.set( value, options );
                value = existingModelOrCollection;
            }
            else{ // ...or create a new object, if it's not exist
                value = new this.type( value, options );
            }
        }

        return value;
    },

    initialize : function( spec ){
        var name               = this.name,
            triggerWhenChanged = this.triggerWhenChanged || spec.type.prototype.triggerWhenChanged;

        this.isModel = this.type.prototype instanceof Model;

        if( triggerWhenChanged ){
            // for collection, add transactional methods to join change events on bubbling
            this.__events = this.isModel ? {} : {
                'before:change' : modelSet.__begin,
                'after:change'  : modelSet.__commit
            };

            this.__events[ triggerWhenChanged ] = function handleNestedChange(){
                var attr = this.attributes[ name ];

                if( this.__duringSet ){
                    this.__nestedChanges[ name ] = attr;
                }
                else{
                    setSingleAttr( this, name, attr, bbForceUpdateAttr );
                }
            };
        }
    }
} ).attach( Model, Collection );

},{"./attribute":1,"./collection":3,"./model":6,"./modelset":7}],6:[function(require,module,exports){
var BaseModel   = require( './backbone+' ).Model,
    modelSet    = require( './modelset' ),
    attrOptions = require( './attribute' ),
    error       = require( './errors' ),
    _           = require( 'underscore' ),
    ModelProto  = BaseModel.prototype;

var setSingleAttr = modelSet.setSingleAttr,
    setAttrs        = modelSet.setAttrs,
    applyTransform  = modelSet.transform;

function cloneAttrs( attrSpecs, attrs, options ){
    for( var name in attrs ){
        attrs[ name ] = attrSpecs[ name ].clone( attrs[ name ], options );
    }

    return attrs;
}

var Model = BaseModel.extend( {
    triggerWhenChanged : 'change',

    properties : {
        id : {
            get : function(){
                var name = this.idAttribute;

                // TODO: get hook doesn't work for idAttribute === 'id'
                return name === 'id' ? this.attributes.id : this[ name ];
            },

            set : function( value ){
                var name = this.idAttribute;
                setSingleAttr( this, name, value, this.__attributes[ name ] );
            }
        }
    },

    __attributes : { id : attrOptions( { value : undefined } ).createAttribute( 'id' ) },
    __class      : 'Model',

    __duringSet : 0,

    defaults : function(){ return {}; },

    __begin  : modelSet.__begin,
    __commit : modelSet.__commit,

    set : function( a, b, c ){
        switch( typeof a ){
        case 'string' :
            var attrSpec = this.__attributes[ a ];

            if( attrSpec && !attrSpec.isBackboneType && !c ){
                return setSingleAttr( this, a, b, attrSpec );
            }

            var attrs = {};
            attrs[ a ] = b;
            return setAttrs( this, attrs, c );

        case 'object' :
            if( a && Object.getPrototypeOf( a ) === Object.prototype ){
                return setAttrs( this, a, b );
            }

        default :
            error.argumentIsNotAnObject( this, a );
        }
    },

    // Return model's value for dot-separated 'deep reference'.
    // Model id and cid are allowed for collection elements.
    // If path is not exist, 'undefined' is returned.
    // model.deepGet( 'a.b.c123.x' )
    deepGet : function( name ){
        var path = name.split( '.' ), value = this;

        for( var i = 0, l = path.length; value && i < l; i++ ){
            value = value.get ? value.get( path[ i ] ) : value[ path[ i ] ];
        }

        return value;
    },

    // Set model's value for dot separated 'deep reference'.
    // If model doesn't exist at some path, create default models
    // if options.nullify is given, assign attributes with nulls
    deepSet : function( name, value, options ){
        var path  = name.split( '.' ),
            l     = path.length - 1,
            model = this,
            attr  = path[ l ];

        for( var i = 0; i < l; i++ ){
            var current = path[ i ],
                next    = model.get ? model.get( current ) : model[ current ];

            // Create models in path, if they are not exist.
            if( !next ){
                var attrSpecs = model.__attributes;

                if( attrSpecs ){
                    // If current object is model, create default attribute
                    var newModel = attrSpecs[ current ].create( options );

                    // If created object is model, nullify attributes when requested
                    if( options && options.nullify && newModel.__attributes ){
                        var nulls = new newModel.Attributes( {} );
                        for( var key in nulls ){
                            nulls[ key ] = null;
                        }
                        newModel.set( nulls );
                    }

                    model[ current ] = next = newModel;
                }
                else{
                    return;
                } // silently fail in other case
            }
            model = next;
        }

        return model.set ? model.set( attr, value, options ) : model[ attr ] = value;
    },

    constructor : function( attributes, options ){
        var attrSpecs = this.__attributes,
            attrs     = attributes || {};

        options || (options = {});
        this.cid = _.uniqueId( 'c' );
        this.attributes = {};
        if( options.collection ){
            this.collection = options.collection;
        }
        if( options.parse ){
            attrs = this.parse( attrs, options ) || {};
        }

        if( typeof attrs !== 'object' || Object.getPrototypeOf( attrs ) !== Object.prototype ){
            error.argumentIsNotAnObject( this, attrs );
            attrs = {};
        }

        attrs = options.deep ?
                cloneAttrs( attrSpecs, new this.Attributes( attrs ), options ) :
                this.defaults( attrs, options );

        // Execute attributes transform function instead of this.set
        applyTransform( this, attrs, attrSpecs, options );

        this.attributes = attrs;
        this.changed = {};
        this.initialize.apply( this, arguments );
    },
    // override get to invoke native getter...
    get         : function( name ){ return this[ name ]; },

    // override clone to pass options to constructor
    clone : function( options ){
        return new this.constructor( this.attributes, options );
    },

    // Create deep copy for all nested objects...
    deepClone : function(){ return this.clone( { deep : true } ); },

    // Support for nested models and objects.
    // Apply toJSON recursively to produce correct JSON.
    toJSON : function(){
        var res   = {},
            attrs = this.attributes, attrSpecs = this.__attributes;

        for( var key in attrs ){
            var value  = attrs[ key ], attrSpec = attrSpecs[ key ],
                toJSON = attrSpec && attrSpec.toJSON;

            if( toJSON ){
                res[ key ] = toJSON.call( this, value, key );
            }
        }

        return res;
    },

    isValid : function( options ){
        // todo: need to do something smart with validation logic
        // something declarative on attributes level, may be
        return ModelProto.isValid.call( this, options ) && _.every( this.attributes, function( attr ){
                if( attr && attr.isValid ){
                    return attr.isValid( options );
                }

                return attr instanceof Date ? !_.isNaN( attr.getTime() ) : !_.isNaN( attr );
            } );
    },

    _ : _ // add underscore to be accessible in templates
}, {
    // shorthand for inline nested model definitions
    defaults : function( attrs ){ return this.extend( { defaults : attrs } ); },

    // extend Model and its Collection
    extend : function( protoProps, staticProps ){
        var This = Object.extend.call( this );
        This.Collection = this.Collection.extend();
        return protoProps ? This.define( protoProps, staticProps ) : This;
    },

    // define Model and its Collection. All the magic starts here.
    define : function( protoProps, staticProps ){
        var Base = Object.getPrototypeOf( this.prototype ).constructor,
            spec = createDefinition( protoProps, Base ),
            This = this;

        Object.extend.Class.define.call( This, spec, staticProps );

        // define Collection
        var collectionSpec = { model : This };
        spec.urlRoot && ( collectionSpec.url = spec.urlRoot );
        This.Collection.define( _.defaults( protoProps.collection || {}, collectionSpec ) );

        return This;
    }
} );

// Create model definition from protoProps spec.
function createDefinition( protoProps, Base ){
    var defaults           = protoProps.defaults || protoProps.attributes || {},
        defaultsAsFunction = typeof defaults == 'function' && defaults,
        baseAttrSpecs      = Base.prototype.__attributes;

    // Support for legacy backbone defaults as functions.
    if( defaultsAsFunction ){
        defaults = defaults();
    }

    var attrSpecs = Object.transform( {}, defaults, attrOptions.create );

    // Create attribute for idAttribute, if it's not declared explicitly
    var idAttribute = protoProps.idAttribute;
    if( idAttribute && !attrSpecs[ idAttribute ] ){
        attrSpecs[ idAttribute ] = attrOptions( { value : undefined } ).createAttribute( idAttribute );
    }

    // Prevent conflict with backbone model's 'id' property
    if( attrSpecs[ 'id' ] ){
        attrSpecs[ 'id' ].createPropertySpec = false;
    }

    var allAttrSpecs = _.defaults( {}, attrSpecs, baseAttrSpecs ),
        Attributes   = createCloneCtor( allAttrSpecs );

    return _.extend( _.omit( protoProps, 'collection', 'attributes' ), {
        __attributes : new Attributes( allAttrSpecs ),
        defaults     : defaultsAsFunction || createDefaults( allAttrSpecs ),
        properties   : createAttrsNativeProps( protoProps.properties, attrSpecs ),
        Attributes   : Attributes
    } );
}

// Create constructor for efficient attributes clone operation.
function createCloneCtor( attrSpecs ){
    var statements = [];

    for( var name in attrSpecs ){
        statements.push( "this." + name + "=x." + name + ";" );
    }

    var Attributes = new Function( "x", statements.join( '' ) );

    // attributes hash must look like vanilla object, otherwise Model.set will trigger an exception
    Attributes.prototype = Object.prototype;

    return Attributes;
}

// Check if value is valid JSON.
function isValidJSON( value ){
    if( value === null ){
        return true;
    }

    switch( typeof value ){
    case 'number' :
    case 'string' :
    case 'boolean' :
        return true;

    case 'object':
        var proto = Object.getPrototypeOf( value );

        if( proto === Object.prototype || proto === Array.prototype ){
            return _.every( value, isValidJSON );
        }
    }

    return false;
}

// Create optimized model.defaults( attrs, options ) function
function createDefaults( attrSpecs ){
    var statements = [], init = {}, refs = {};

    // Compile optimized constructor function for efficient deep copy of JSON literals in defaults.
    _.each( attrSpecs, function( attrSpec, name ){
        if( attrSpec.value === undefined && attrSpec.type ){
            // if type with no value is given, create an empty object
            init[ name ] = attrSpec;
            statements.push( 'this.' + name + '=i.' + name + '.create( o );' );
        }
        else{
            // If value is given, type casting logic will do the job later, converting value to the proper type.
            if( isValidJSON( attrSpec.value ) ){
                // JSON literals must be deep copied.
                statements.push( 'this.' + name + '=' + JSON.stringify( attrSpec.value ) + ';' );
            }
            else if( attrSpec.value === undefined ){
                // handle undefined value separately. Usual case for model ids.
                statements.push( 'this.' + name + '=undefined;' );
            }
            else{
                // otherwise, copy value by reference.
                refs[ name ] = attrSpec.value;
                statements.push( 'this.' + name + '=r.' + name + ';' );
            }

        }
    } );

    var Defaults = new Function( 'r', 'i', 'o', statements.join( '' ) );
    Defaults.prototype = Object.prototype;

    // Create model.defaults( attrs, options ) function
    // 'attrs' will override default values, options will be passed to nested backbone types
    return function( attrs, options ){
        var opts = options, name;

        // 'collection' and 'parse' options must not be passed down to default nested models and collections
        if( options && ( options.collection || options.parse ) ){
            opts = {};
            for( name in options ){
                if( name !== 'collection' && name !== 'parse' ){
                    opts[ name ] = options[ name ];
                }
            }
        }

        var defaults = new Defaults( refs, init, opts );

        // assign attrs, overriding defaults
        for( var name in attrs ){
            defaults[ name ] = attrs[ name ];
        }

        return defaults;
    }
}

// Create native properties for model's attributes
function createAttrsNativeProps( properties, attrSpecs ){
    if( properties === false ){
        return {};
    }

    properties || ( properties = {} );

    return Object.transform( properties, attrSpecs, function( attrSpec, name ){
        if( !properties[ name ] && attrSpec.createPropertySpec ){
            return attrSpec.createPropertySpec();
        }
    } );
}

module.exports = Model;

},{"./attribute":1,"./backbone+":2,"./errors":4,"./modelset":7,"underscore":"underscore"}],7:[function(require,module,exports){
// Optimized Model.set functions
//---------------------------------
/*
 Does two main things:
 1) Invoke model-specific constructor for attributes cloning. It improves performance on large model updates.
 2) Invoke attribute-specific comparison function. Improves performance for everything, especially nested stuff.

 attrSpec is required to provide two methods:
 transform( value, options, model, name ) -> value
 to transform value before assignment

 isChanged( value1, value2 ) -> bool
 to detect whenever attribute must be assigned and counted as changed

 Model is required to implement Attributes constructor for attributes cloning.
 */

// Special case set: used from model's native properties.
// Single attribute change, no options, _no_ _nested_ _changes_ detection on deep update.
// 1) Code is stripped for this special case
// 2) attribute-specific transform function invoked internally

var _        = require( 'underscore' ),
    Events   = require( './backbone+' ).Events,
    error    = require( './errors' ),
    trigger2 = Events.trigger2,
    trigger3 = Events.trigger3;

module.exports = {
    isChanged     : genericIsChanged,
    setSingleAttr : setSingleAttr,
    setAttrs      : setAttrs,
    transform     : applyTransform,
    __begin         : __begin,
    __commit        : __commit
};

function genericIsChanged( a, b ){
    return !( a === b || ( a && b && typeof a == 'object' && typeof b == 'object' && _.isEqual( a, b ) ) );
}

function setSingleAttr( model, key, value, attrSpec ){
    'use strict';
    var changing = model._changing,
        current  = model.attributes;

    model._changing = true;

    if( !changing ){
        model._previousAttributes = new model.Attributes( current );
        model.changed = {};
    }

    var prev      = model._previousAttributes,
        options   = {},
        val       = attrSpec.transform( value, options, model, key ),
        isChanged = attrSpec.isChanged;

    isChanged( prev[ key ], val ) ? model.changed[ key ] = val : delete model.changed[ key ];

    if( isChanged( current[ key ], val ) ){
        current[ key ] = val;
        model._pending = options;
        trigger3( model, 'change:' + key, model, val, options );
    }

    if( changing ){
        return model;
    }

    while( model._pending ){
        options = model._pending;
        model._pending = false;
        trigger2( model, 'change', model, options );
    }

    model._pending = false;
    model._changing = false;
    return model;
};

// General case set: used for multiple and nested model/collection attributes.
// Does _not_ invoke attribute transform! It must be done at the the top level,
// due to the problems with current nested changes detection algorithm. See 'setAttrs' function below.
function bbSetAttrs( model, attrs, options ){
    'use strict';

    options || (options = {});

    // Run validation.
    if( !model._validate( attrs, options ) ){
        return false;
    }

    // Extract attributes and options.
    var unset     = options.unset,
        silent    = options.silent,
        changes   = [],
        changing  = model._changing,
        current   = model.attributes,
        attrSpecs = model.__attributes;

    model._changing = true;

    if( !changing ){
        model._previousAttributes = new model.Attributes( current );
        model.changed = {};
    }

    var prev = model._previousAttributes;

    // For each `set` attribute, update or delete the current value.
    for( var attr in attrs ){
        var attrSpec  = attrSpecs[ attr ],
            isChanged = attrSpec ? attrSpec.isChanged : genericIsChanged,
            val       = attrs[ attr ];

        if( isChanged( current[ attr ], val ) ){
            changes.push( attr );
        }

        if( isChanged( prev[ attr ], val ) ){
            model.changed[ attr ] = val;
        }
        else{
            delete model.changed[ attr ];
        }

        unset ? delete current[ attr ] : current[ attr ] = val;
    }

    // Trigger all relevant attribute changes.
    if( !silent ){
        if( changes.length ){
            model._pending = options;
        }
        for( var i = 0, l = changes.length; i < l; i++ ){
            attr = changes[ i ];
            trigger3( model, 'change:' + attr, model, current[ attr ], options );
        }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if( changing ){
        return model;
    }
    if( !silent ){
        while( model._pending ){
            options = model._pending;
            model._pending = false;
            trigger2( model, 'change', model, options );
        }
    }

    model._pending = false;
    model._changing = false;

    return model;
};

// Optimized Backbone Core functions
// =================================
// Deep set model attributes, catching nested attributes changes
function setAttrs( model, attrs, options ){
    model.__begin();

    applyTransform( model, attrs, model.__attributes, options );

    model.__commit( attrs, options );

    return model;
}

// transform attributes hash
function applyTransform( model, attrs, attrSpecs, options ){
    for( var name in attrs ){
        var attrSpec = attrSpecs[ name ], value = attrs[ name ];
        if( attrSpec ){
            attrs[ name ] = attrSpec.transform( value, options, model, name );
        }
        else{
            error.unknownAttribute( model, name, value );
        }
    }
}

function __begin(){
    this.__duringSet++ || ( this.__nestedChanges = {} );
}

function __commit( attrs, options ){
    if( !--this.__duringSet ){
        var nestedChanges = this.__nestedChanges,
            attributes    = this.attributes;

        attrs || ( attrs = {} );

        // Catch nested changes.
        for( var name in nestedChanges ){
            var value = name in attrs ? attrs[ name ] : attrs[ name ] = nestedChanges[ name ];

            if( value === attributes[ name ] ){
                // patch attributes to force change:name event
                attributes[ name ] = null;
            }
        }

        this.__nestedChanges = {};
    }

    if( attrs ){
        bbSetAttrs( this, attrs, options );
    }
}
},{"./backbone+":2,"./errors":4,"underscore":"underscore"}],8:[function(require,module,exports){
/* Object extensions: backbone-style OO functions and helpers...
 * (c) Vlad Balin & Volicon, 2015
 * ------------------------------------------------------------- */

(function( spec ){
    for( var name in spec ){
        Object[ name ] || Object.defineProperty( Object, name, {
            enumerable   : false,
            configurable : true,
            writable     : true,
            value        : spec[ name ]
        } );
    }
})( {
    // Object.assign polyfill from MDN.
    assign : function( target, firstSource ){
        if( target == null ){
            throw new TypeError( 'Cannot convert first argument to object' );
        }

        var to = Object( target );
        for( var i = 1; i < arguments.length; i++ ){
            var nextSource = arguments[ i ];
            if( nextSource == null ){
                continue;
            }

            var keysArray = Object.keys( Object( nextSource ) );
            for( var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++ ){
                var nextKey = keysArray[ nextIndex ];
                var desc = Object.getOwnPropertyDescriptor( nextSource, nextKey );
                if( desc !== void 0 && desc.enumerable ){
                    to[ nextKey ] = nextSource[ nextKey ];
                }
            }
        }
        return to;
    },

    // Object.transform function, similar to _.mapObject
    transform : function( dest, source, fun, context ){
        for( var name in source ){
            if( source.hasOwnProperty( name ) ){
                var value = fun.call( context, source[ name ], name );
                typeof value === 'undefined' || ( dest[ name ] = value );
            }
        }

        return dest;
    },

    // get property descriptor looking through all prototype chain
    getPropertyDescriptor : function( obj, prop ){
        for( var desc; !desc && obj; obj = Object.getPrototypeOf( obj ) ){
            desc = Object.getOwnPropertyDescriptor( obj, prop );
        }

        return desc;
    },

    // extend function in the fashion of Backbone, with extended features required by NestedTypes
    // - supports native properties definitions
    // - supports forward declarations
    // - warn in case if base class method is overriden with value. It's popular mistake when working with Backbone.
    extend : (function(){
        var error = {
            overrideMethodWithValue : function( Ctor, name, value ){
                console.warn( '[Type Warning] Base class method overriden with value in Object.extend({ ' + name +
                              ' : ' + value + ' }); Object =', Ctor.prototype );
            }
        };

        function Class(){
            this.initialize.apply( this, arguments );
        }

        // Backbone-style extend with native properties and late definition support
        function extend( protoProps, staticProps ){
            var Parent = this === Object ? Class : this,
                Child;

            if( typeof protoProps === 'function' ){
                Child = protoProps;
                protoProps = null;
            }
            else if( protoProps && protoProps.hasOwnProperty( 'constructor' ) ){
                Child = protoProps.constructor;
            }
            else{
                Child = function Constructor(){ return Parent.apply( this, arguments ); };
            }

            Object.assign( Child, Parent );

            Child.prototype = Object.create( Parent.prototype );
            Child.prototype.constructor = Child;
            Child.__super__ = Parent.prototype;

            protoProps && Child.define( protoProps, staticProps );

            return Child;
        }

        function warnOnError( value, name ){
            var prop = Object.getPropertyDescriptor( this.prototype, name );

            if( prop ){
                var baseIsFunction  = typeof prop.value === 'function',
                    valueIsFunction = typeof value === 'function';

                if( baseIsFunction && !valueIsFunction ){
                    error.overrideMethodWithValue( this, name, prop );
                }
            }

            return value;
        }

        function preparePropSpec( spec, name ){
            var prop = Object.getPropertyDescriptor( this.prototype, name );

            if( prop && typeof prop.value === 'function' ){
                error.overrideMethodWithValue( this, name, prop );
            }

            return spec instanceof Function ? { get : spec } : spec;
        }

        function define( protoProps, staticProps ){
            Object.transform( this.prototype, protoProps, warnOnError, this );
            Object.transform( this, staticProps, warnOnError, this );

            protoProps && Object.defineProperties( this.prototype,
                Object.transform( {}, protoProps.properties, preparePropSpec, this ) );

            return this;
        }

        extend.attach = function(){
            for( var i = 0; i < arguments.length; i++ ){
                var Ctor = arguments[ i ];

                Ctor.extend = extend;
                Ctor.define = define;
                Ctor.prototype.initialize || ( Ctor.prototype.initialize = function(){} );
            }
        };

        extend.attach( Class );
        extend.Class = Class;
        extend.error = error;

        return extend;
    })()
} );

module.exports = Object.extend.Class;
},{}],9:[function(require,module,exports){
// Nested Relations
//=================

var bbVersion  = require( 'backbone' ).VERSION,
    attribute  = require( './attribute' ),
    Collection = require( './collection' ),
    _          = require( 'underscore' );

function parseReference( collectionRef ){
    switch( typeof collectionRef ){
    case 'function' :
        return collectionRef;
    case 'object'   :
        return function(){ return collectionRef; };
    case 'string'   :
        return new Function( 'return this.' + collectionRef );
    }
}

exports.from = function( masterCollection ){
    var getMaster = parseReference( masterCollection );

    function clone( value ){
        return value && typeof value === 'object' ? value.id : value;
    }

    var ModelRefAttribute = attribute.Type.extend( {
        toJSON : clone,
        clone  : clone,

        isChanged : function( a, b ){
            // refs are equal when their id is equal.
            var aId = a && typeof a == 'object' ? a.id : a,
                bId = b && typeof b == 'object' ? b.id : b;

            return aId !== bId;
        },

        get : function( objOrId, name ){
            if( typeof objOrId !== 'object' ){
                // Resolve reference.
                var master = getMaster.call( this );

                if( master && master.length ){
                    // Silently update attribute with object form master.
                    objOrId = master.get( objOrId ) || null;
                    this.attributes[ name ] = objOrId;

                    // Subscribe for events manually. delegateEvents won't be invoked.
                    var attrSpec = this.__attributes[ name ];
                    objOrId && attrSpec.events && this.listenTo( objOrId, attrSpec.events );
                }
                else{
                    objOrId = null;
                }
            }

            return objOrId;
        }
    } );

    var options = attribute( { value : null } );
    options.Attribute = ModelRefAttribute; //todo: consider moving this to the attrSpec
    return options;
};

var CollectionProto = Collection.prototype;

var refsCollectionSpec = {
    triggerWhenChanged : bbVersion >= '1.2.0' ? 'update reset' : 'add remove reset', // don't bubble changes from models
    __class            : 'Collection.SubsetOf',

    resolvedWith : null,
    refs         : null,

    toJSON : function(){
        return this.refs || _.pluck( this.models, 'id' );
    },

    clone : function( options ){
        var copy = CollectionProto.clone.call( this, _.omit( options, 'deep' ) );
        copy.resolvedWith = this.resolvedWith;
        copy.refs = this.refs;

        return copy;
    },

    parse : function( raw ){
        var models = [];

        if( this.resolvedWith ){
            models = _.compact( _.map( raw, function( id ){
                return this.resolvedWith.get( id );
            }, this ) );
        }
        else{
            this.refs = raw;
        }

        return models;
    },

    toggle : function( modelOrId ){
        var model = this.resolvedWith.get( modelOrId );

        if( this.get( model ) ){
            this.remove( model );
        }
        else{
            this.add( model );
        }
    },

    addAll    : function(){
        this.reset( this.resolvedWith.models );
    },
    removeAll : function(){
        this.reset();
    },
    justOne   : function( arg ){
        var model = arg instanceof Backbone.Model ? arg : this.resolvedWith.get( arg );
        this.set( [ model ] );
    },
    set       : function( models, upperOptions ){
        var options = { merge : false };

        if( models ){
            if( models instanceof Array && models.length && typeof models[ 0 ] !== 'object' ){
                options.merge = options.parse = true;
            }
        }

        CollectionProto.set.call( this, models, _.defaults( options, upperOptions ) );
    },

    resolve : function( collection ){
        if( collection && collection.length ){
            this.resolvedWith = collection;

            if( this.refs ){
                this.reset( this.refs, { silent : true } );
                this.refs = null;
            }
        }

        return this;
    }
};

exports.subsetOf = function( masterCollection ){
    var SubsetOf = this.__subsetOf || ( this.__subsetOf = this.extend( refsCollectionSpec ) );
    var getMaster = parseReference( masterCollection );

    return attribute( {
        type : SubsetOf,

        get : function( refs ){
            !refs || refs.resolvedWith || refs.resolve( getMaster.call( this ) );
            return refs;
        }
    } );
};

},{"./attribute":1,"./collection":3,"backbone":"backbone","underscore":"underscore"}],10:[function(require,module,exports){
var Backbone   = require( './backbone+' ),
    Model      = require( './model' ),
    Collection = require( './collection' ),
    _          = require( 'underscore' );

var _store = null;

// Exports native property spec for model store
exports.get = function(){ return _store; };

exports.set = function( spec ){
    _.each( spec, function( Type, name ){
        Type.options && ( spec[name] = Type.options( {
            get : function( value ){
                if( !this.resolved[name] ){
                    value.fetch && value.fetch();
                    this.resolved[name] = true;
                }

                return value;
            },

            set : function( value ){
                value.length || ( this.resolved[name] = false );
                return value;
            }
        } ) );
    } );

    var $ = Backbone.$;

    var Cache = Model.extend( {
        attributes : spec,
        resolved   : {},

        initialize   : function(){
            this.resolved = {};
            this.installHooks();
        },
        installHooks : function(){
            var self = this;

            _.each( this.attributes, function( element, name ){
                if( !element ){
                    return;
                }
                var fetch = element.fetch;
                if( fetch ){
                    element.fetch = function(){
                        self.resolved[name] = true;
                        return fetch.apply( this, arguments );
                    }
                }

                if( element instanceof Collection && element.length ){
                    this.resolved[name] = true;
                }
            }, this );
        },

        fetch : function(){
            var xhr         = [],
                objsToFetch = arguments.length ? arguments : _.keys( this.resolved );

            _.each( objsToFetch, function( name ){
                var attr = this.attributes[name];
                attr.fetch && xhr.push( attr.fetch() );
            }, this );

            return $ && $.when && $.when.apply( Backbone.$, xhr );
        },

        clear : function(){
            var attrs = this.defaults();
            arguments.length && ( attrs = _.pick( attrs, _.toArray( arguments ) ) );
            this.set( attrs );
            this.installHooks();
            return this;
        }
    } );

    Model.prototype.store = _store = new Cache();
};


},{"./backbone+":2,"./collection":3,"./model":6,"underscore":"underscore"}],"nestedtypes":[function(require,module,exports){
// Backbone.nestedTypes 0.10.0 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin & Volicon, may be freely distributed under the MIT license

var Model       = require( './model' ),
    Collection  = require( './collection' ),
    relations   = require( './relations' ),
    attribute   = require( './attribute' );

require( './metatypes' );

Collection.subsetOf = relations.subsetOf;
Model.from          = relations.from;
Model.Collection    = Collection;

Object.defineProperty( exports, 'store', require( './store' ) );

Object.assign( exports, {
    Class : require( './object+' ),
    error : require( './errors' ),
    attribute : attribute,

    value : function( value ){
        return attribute({ value: value });
    },

    Collection : Collection,
    Model      : Model,

    defaults   : function( x ){
        return Model.defaults( x );
    }
});
},{"./attribute":1,"./collection":3,"./errors":4,"./metatypes":5,"./model":6,"./object+":8,"./relations":9,"./store":10}]},{},[]);
    return require('nestedtypes');
}))