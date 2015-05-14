/* Backbone-style OO functions and helpers
 * (c) Vlad Balin & Volicon, 2015
 */
( function( spec ){
    for( var name in spec ){
        Object[ name ] || Object.defineProperty( Object, name, {
            enumerable: false,
            configurable: true,
            writable: true,
            value: spec[ name ]
        });
    }
})( {
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
                var desc    = Object.getOwnPropertyDescriptor( nextSource, nextKey );
                if( desc !== void 0 && desc.enumerable ){
                    to[ nextKey ] = nextSource[ nextKey ];
                }
            }
        }
        return to;
    },

    transform : function( dest, source, fun, context ){
        for( var name in source ){
            if( source.hasOwnProperty( name ) ){
                var value = fun.call( context, source[ name ], name );
                typeof value === 'undefined' || ( dest[ name ] = value );
            }
        }

        return dest;
    },

    getPropertyDescriptor : function( obj, prop ){
        for( var desc; !desc && obj; obj = Object.getPrototypeOf( obj ) ){
            desc = Object.getOwnPropertyDescriptor( obj, prop );
        }

        return desc;
    },

    _typeErrors : {
        overrideMethodWithValue : function( Ctor, name, value ){
            console.warn( '[Type Warning] Base class method overriden with value in Object.extend({ ' + name + ' : ' + value + ' }); Object =', Ctor.prototype );
        }
    },

    extend : (function(){
        function Class(){
            this.initialize.apply( this, arguments );
        }

        // Backbone-style extend with native properties and late definition support
        function extend( protoProps, staticProps ){
            var Parent = this === Object ? Class : this,
                Child;

            if( typeof protoProps === 'function' ){
                Child      = protoProps;
                protoProps = null;
            }
            else if( protoProps && protoProps.hasOwnProperty( 'constructor' ) ){
                Child = protoProps.constructor;
            }
            else{
                Child = function Constructor(){ return Parent.apply( this, arguments ); };
            }

            Object.assign( Child, Parent );

            Child.prototype             = Object.create( Parent.prototype );
            Child.prototype.constructor = Child;
            Child.__super__             = Parent.prototype;

            protoProps && Child.define( protoProps, staticProps );

            return Child;
        }

        function warnOnError( value, name ){
            var prop = Object.getPropertyDescriptor( this.prototype, name );

            if( prop ){
                var baseIsFunction  = typeof prop.value === 'function',
                    valueIsFunction = typeof value === 'function';

                if( baseIsFunction && !valueIsFunction ){
                    Object._typeErrors.overrideMethodWithValue( this, name, prop );
                }
            }

            return value;
        }

        function preparePropSpec( spec, name ){
            var prop = Object.getPropertyDescriptor( this.prototype, name );

            if( prop && typeof prop.value === 'function' ){
                Object._typeErrors.overrideMethodWithValue( this, name, prop );
            }

            return spec instanceof Function ? { get : spec } : spec;
        }

        function define( protoProps, staticProps, mixinProps ){
            Object.transform( this.prototype, protoProps,  warnOnError, this );
            Object.transform( this,           staticProps, warnOnError, this );

            mixinProps && Object.defineProperties( this.prototype, Object.transform( {}, mixinProps, preparePropSpec, this ) );
            Object.defineProperties( this.prototype, Object.transform( {}, protoProps.properties, preparePropSpec, this ) );

            return this;
        }

        extend.attach = function(){
            for( var i = 0; i < arguments.length; i++ ){
                var Ctor = arguments[ i ];

                Ctor.extend || ( Ctor.extend = extend );
                Ctor.define || ( Ctor.define = define );
                Ctor.prototype.initialize || ( Ctor.prototype.initialize = function(){} );
            }
        };

        extend.attach( Class );

        return extend;
    })()
});