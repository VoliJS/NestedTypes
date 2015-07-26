// Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
// (c) 2011 Colin Snover <http://zetafleet.com>
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
        // avoid NaN timestamps caused by undefined values being passed to Date.UTC
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
    clone     : function( value ){ return value && new Date( +value ); }
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

        this.isModel = this.type === Model || this.type.prototype instanceof Model;

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
