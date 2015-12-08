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

            var prepared = spec instanceof Function ? { get : spec } : spec;

            if( prepared.enumerable === void 0 ){
                prepared.enumerable = true;
            }

            return prepared;
        }

        function attachMixins( protoProps ){
            var mixins = protoProps.mixins,
                merged = {}, properties = {};

            for( var i = mixins.length -1; i >= 0; i-- ){
                var mixin = mixins[ i ];
                Object.assign( properties, mixin.properties );
                Object.assign( merged, mixin );
            }

            Object.assign( merged, protoProps );
            Object.assign( properties, protoProps.properties );

            merged.properties = properties;
            return merged;
        }

        function extractPropKeys( proto ){
            var allProps = {};

            // traverse prototype chain
            for( var p = proto; p; p = Object.getPrototypeOf( p ) ){
                Object.transform( allProps, p.properties, function( spec, name ){
                    if( !allProps[ name ] && spec.enumerable ){
                        return spec;
                    }
                });
            }

            return Object.keys( allProps );
        }

        function define( a_protoProps, a_staticProps ){
            var protoProps = a_protoProps || {};
                staticProps = a_staticProps || {};

            if( protoProps.mixins ){
                protoProps = attachMixins( protoProps );
            }

            Object.transform( this.prototype, protoProps, warnOnError, this );

            // do not inherit abstract class factory!
            if( !staticProps.create ) staticProps.create = null;
            Object.assign( this, staticProps ); // No override check here

            protoProps && Object.defineProperties( this.prototype,
                Object.transform( {}, protoProps.properties, preparePropSpec, this ) );

            this.prototype._propKeys = extractPropKeys( this.prototype );

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