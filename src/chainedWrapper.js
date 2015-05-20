Nested.options = ( function(){
    // Options wrapper for chained and safe type specs...
    // --------------------------------------------------

    var primitiveTypes = {
        string : String,
        number : Number,
        boolean : Boolean
    };

    // list of simple accessor methods available in options
    var availableOptions = [ 'triggerWhenChanged', 'parse', 'toJSON', 'value', 'cast', 'create' ];

    var Options = Object.extend({
        _options : {},

        constructor : function( spec ){
            // special option used to guess types of primitive values and to distinguish value from type
            if( 'typeOrValue' in spec ){
                var typeOrValue = spec.typeOrValue,
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
                this[ i ]( options[ i ]);
            }

            return this;
        },

        // construct attribute with a given name and proper type.
        createAttribute : function( name ){
            var options = this._options,
                Type = options.type ? options.type.NestedType : Attribute;

            return new Type( name, options );
        }
    });

    availableOptions.forEach( function( name ){
        Options.prototype[ name ] = function( value ){
            this._options[ name ] = value;
            return this;
        };
    });

    function chainHooks( array ){
        var l = array.length;

        return l === 1 ? array[ 0 ] : function( value, name ){
            var res = value;
            for( var i = 0; i < l; i++ ) res = array[ i ].call( this, res, name );
            return res;
        };
    }

    var transform = {
        hookAndCast : function( val, options, model ){
            var name = this.name,
                value = this.cast( val, options, model ),
                prev = model.attributes[ name ];

            if( value === prev ) return prev;

            value = this.set.call( model, value, name );
            return value === undefined ? prev : this.cast( value, options, model );
        },

        hook : function( value, options, model ){
            var name = this.name;
            var prev = model.attributes[ name ];
            return value === prev ? prev : this.set.call( model, value, name );
        },

        delegateAndMore : function ( val, options, model, attr ){
            return this.delegateEvents( this._transform( val, options, model ), options, model, attr );
        },

        delegate : function( value, options, model, attr ){
            var prev = model.attributes[ attr ];

            if( prev !== value ){
                prev && model.stopListening( prev );
                value && model.listenTo( value, this.events );
                model.trigger( 'replace:' + attr, model, prev, value );
            }

            return value;
        }
    };

    // Base class for Attribute metatype
    // ---------------------------------

    var Attribute = Object.extend({
        name : null,
        type : null,
        value : undefined,

        // cast function
        // may be overriden in subclass
        cast : null, // function( value, options, model ),

        // get and set hooks...
        get : null,
        set : null,

        // custom events subscription event map...
        events : null, // { event : handler, ... }

        // create empty object passing backbone options to constructor...
        // must be overriden for backbone types only
        create : function( options ){ return new this.type(); },

        // optimized general purpose isEqual function for typeless attributes
        // must be overriden in subclass
        isChanged : function( a, b ){
            return !( a === b || ( a && b && typeof a == 'object' && typeof b == 'object' && _.isEqual( a, b ) ) );
        },

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

        // must be overriden for backbone types...
        createPropertySpec : function(){
            ( function( self, name, get ){
                return {
                    // call to optimized set function for single argument. Doesn't work for backbone types.
                    set : function( value ){ setSingleAttr( this, name, value, self ); },

                    // attach get hook to the getter function, if present
                    get : get ? function(){ return get.call( this, this.attributes[ name ], name ); } :
                                function(){ return this.attributes[ name ]; }
                }
            } )( this, this.name, this.get );
        },

        // automatically generated optimized transform function
        // do not touch.
        _transform : null,
        transform : function( value ){ return value; },

        constructor : function( name, spec ){
            this.name = name;

            Object.xmap( this, spec, function( value, name ){
                if( name === 'events' && this.events ){
                    return Object.assign( this.events, value );
                }

                if( name === 'get' ){
                    if( this.get ) value.unshift( this.get );
                    return chainHooks( value );
                }

                if( name === 'set' ){
                    if( this.set ) value.push( this.set );
                    return chainHooks( value );
                }

                return value;
            }, this );

            // assemble optimized transform function...
            if( this.cast )   this.transform = this._transform = this.cast;
            if( this.set )    this.transform = this._transform = this.cast ? transform.hookAndCast : transform.hook;
            if( this.events ) this.transform = this._transform ? transform.delegate : transform.delegateAndMore;
        }
    },{
        bind : ( function(){
            function options( spec ){
                spec || ( spec = {} );
                spec.type || ( spec.type = this );
                return new Options( spec );
            }

            function value( value ){
                return new Options({ type : this, value : value });
            }

            return function(){
                for( var i = 0; i < arguments.length; i++ ){
                    var Type = arguments[ i ];
                    Type.options    = options;
                    Type.value      = value;
                    Type.NestedType = this;
                    Object.defineProperty( Type, 'has', { get : options } );
                }
            };
        })()
    });

    function createOptions( spec ){
        return new Options( spec );
    }

    createOptions.Type = Attribute;
    return createOptions;
})();

// Constructors Attribute
// ----------------
Nested.options.Type.extend({
    cast : function( value ){
        return value == null || value instanceof this.type ? value : new this.type( value );
    },

    clone : function( value, options ){
        // delegate to clone function or deep clone through serialization
        return value.clone ? value.clone( value, options ) : this.cast( JSON.parse( JSON.stringify( value ) ) );
    }
}).bind( Function.prototype );

// Date Attribute
// ----------------------
( function(){
    var numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ],
        msDatePattern = /\/Date\(([0-9]+)\)\//,
        isoDatePattern = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;

    function parseDate( date ){
        var msDate, timestamp, struct, minutesOffset = 0;

        if( msDate = msDatePattern.exec( date ) ){
            timestamp = Number( msDate[ 1 ] );
        }
        else if(( struct = isoDatePattern.exec( date ))) {
            // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
            for( var i = 0, k; ( k = numericKeys[i] ); ++i ) {
                struct[ k ] = +struct[ k ] || 0;
            }

            // allow undefined days and months
            struct[ 2 ] = (+struct[ 2 ] || 1) - 1;
            struct[ 3 ] = +struct[ 3 ] || 1;

            if (struct[ 8 ] !== 'Z' && struct[ 9 ] !== undefined) {
                minutesOffset = struct[ 10 ] * 60 + struct[ 11 ];

                if (struct[ 9 ] === '+') {
                    minutesOffset = 0 - minutesOffset;
                }
            }

            timestamp = Date.UTC(struct[ 1 ], struct[ 2 ], struct[ 3 ], struct[ 4 ], struct[ 5 ] + minutesOffset, struct[ 6 ], struct[ 7 ]);
        }
        else {
            timestamp = Date.parse( date );
        }

        return timestamp;
    }

    Nested.options.Type.extend({
        cast : function( value ){
            return value == null || value instanceof Date ? value :
                new Date( typeof value === 'string' ? parseDate( value ) : value )
        },

        isChanged : function( a, b ){ return ( a && +a ) !== ( b && +b ); },
        clone : function( value ){ return new Date( +value ); }
    }).bind( Date );
})();

// Fix incompatible constructor behaviour of primitive types...
Nested.options.Type.extend({
    create : function(){ return this.type(); },

    cast : function( value ){ return value == null ? null : this.type( value ); },

    isChanged : function( a, b ){ return a !== b; },

    clone : function( value ){ return value; }
}).bind( Number, Boolean, String, Integer );

// Fix incompatible constructor behaviour of Array...
Nested.options.Type.extend({
    cast : function( value ){
        return value == null || value instanceof Array ? value : [ value ];
    }
}).bind( Array );