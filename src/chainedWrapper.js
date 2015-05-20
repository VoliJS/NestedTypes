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

        cast : null, // untyped attribute cannot be casted

        // get and set hooks...
        get : null,
        set : null,

        // custom events subscription...
        events : null,

        // don't copy typeless values...
        create : function(){ return this.value; },

        clone : function( value, options ){
            if( value && typeof value === 'object' ){
                var proto = Object.getPrototypeOf( value );

                if( proto === Object.prototype || proto === Array.prototype ){
                    return JSON.parse( JSON.stringify( value ) );
                }
                else if( value.clone ){
                    return value.clone( options );
                }
            }

            return value;
        },

        property : function( name ){
            var spec = {
                    set : function( value ){
                        this.set( name, value );
                        return value;
                    },

                    enumerable : false
                },
                get = this.get;

            spec.get = get ? function(){
                return get.call( this, this.attributes[ name ], name );
            } : function(){
                return this.attributes[ name ];
            };

            return spec;
        },

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

            // deep copy typeless JSON values on creation...
            if( !this.type && JSON.isValid( this.value ) ){
                this.create = new Function( "return " + JSON.stringify( this.value ) + ";" );
            }

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

Nested.options.Type.extend({
    create : function(){ return new this.type(); },

    cast : function( value ){
        return value == null || value instanceof this.type ? value : new this.type( value );
    },

    clone : function( value ){
        return this.cast( JSON.parse( JSON.stringify( value ) ) );
    }
}).bind( Function.prototype );