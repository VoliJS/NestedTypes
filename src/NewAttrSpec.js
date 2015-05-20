


var Attribute = Object.extend({
    type : null,
    value : undefined,
    name : null,

    create : function(){
        return new this.type();
    },
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

    isChanged : genericIsChanged,

    transform : function( x ){ return x; },

    createPropertySpec : function(){
        var self = this, name = this.name, get = this.get;

        return {
            set : function( value ){ setSingleAttr( this, name, value, self ); },

            get : get ?
                function(){ return get.call( this, this.attributes[ name ], name ); } :
                function(){ return this.attributes[ name ]; },

            enumerable : false
        };
    },

    options : function( spec ){
        if( spec.get && this.get ){
            spec.get = chainHooks( this.get, spec.get );
        }
        if( spec.set && this.set ){
            spec.set = chainHooks( this.set, spec.set );
        }
        _.extend( this, spec );
        return this;
    },

    initialize : function( spec ){
        this.options( spec );

        if( this.set ){
            if( this.cast ){
                this.cast = createCastWithHook( this.cast, this.set );
            }
            else{
                this.cast = createCast( this.set );
            }
        }
    }
},{
    bind : ( function(){
        var attributeMethods = {
            options : function( spec ){
                spec.type || ( spec.type = this );
                return new this.NestedType( spec );
            },

            value : function( value ){
                return new this.NestedType({ type : this, value : value });
            }
        };

        return function(){
            _.each( arguments, function( Type ){
                _.extend( Type, attributeMethods, { NestedType : this } );
            }, this );
        };
    })()
});





Nested.options = ( function(){
    function chainHooks( first, second ){
        return function( value, name ){
            return second.call( this, first.call( this, value, name ), name );
        };
    }

    function transform( val, options, model, name ){
        var value = this.cast ? this.cast( value, options, model ) : val,
            prev  = model.attributes[ name ];

        if( this.isChanged( value, prev ) ){
            value = this.set.call( model, value, name );
            if( value === undefined ) return prev;
            this.cast && ( value = this.cast( value, options, model ) );
        }

        return value;
    }

    var Attribute = Object.extend({
        type : null,

        create : function(){
            return new this.type();
        },

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

        isChanged : genericIsChanged,

        transform : function( x ){ return x; },

        property : function( name ){
            var self = this;

            var spec = {
                    set : function( value ){
                        setSingleAttr( this, name, value, self );
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

        options : function( spec ){
            if( spec.get && this.get ){
                spec.get = chainHooks( this.get, spec.get );
            }
            if( spec.set && this.set ){
                spec.set = chainHooks( this.set, spec.set );
            }
            _.extend( this, spec );
            return this;
        },

        initialize : function( spec ){
            this.options( spec );

            if( this.set ){
                if( this.cast ){
                    this.cast = createCastWithHook( this.cast, this.set );
                }
                else{
                    this.cast = createCast( this.set );
                }
            }
        }
    },{
        bind : ( function(){
            var attributeMethods = {
                options : function( spec ){
                    spec.type || ( spec.type = this );
                    return new this.NestedType( spec );
                },

                value : function( value ){
                    return new this.NestedType({ type : this, value : value });
                }
            };

            return function(){
                _.each( arguments, function( Type ){
                    _.extend( Type, attributeMethods, { NestedType : this } );
                }, this );
            };
        })()
    });

    Attribute.extend({
        cast : function( value ){
            return value == null || value instanceof this.type ? value : new this.type( value );
        },
        clone : function( value ){
            return this.cast( JSON.parse( JSON.stringify( value ) ) );
        }
    }).bind( Function.prototype );

    var primitiveTypes = {
        string : String,
        number : Number,
        boolean : Boolean
    };

    function createAttribute( spec ){
        if( arguments.length >= 2 ){
            spec = {
                type : arguments[ 0 ],
                value : arguments[ 1 ]
            };

            if( arguments.length >= 3 ){
                _.extend( spec, arguments[ 2 ] );
            }
        }
        else if( 'typeOrValue' in spec ){
            var typeOrValue = spec.typeOrValue,
                primitiveType = primitiveTypes[ typeof typeOrValue ];

            if( primitiveType ){
                spec = { type : primitiveType, value : typeOrValue };
            }
            else{
                spec = _.isFunction( typeOrValue ) ? { type : typeOrValue } : { value : typeOrValue };
            }
        }

        if( spec.type ){
            return spec.type.options( spec );
        }
        else{
            return new Attribute( spec );
        }
    }

    createAttribute.Type = Attribute;
    return createAttribute;
})();