if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target, firstSource) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

Object.xmap = function( dest, source, fun, context ){
    context || ( context = null );

    for( var name in source ){
        if( source.hasOwnProperty( name ) ){
            value = fun.call( context, source[ name ], name );
            typeof value === 'undefined' || ( dest[ name ] = value );
        }
    }

    return dest;
};

Object.xgetPropertyDescriptor = function( obj, prop ){
    for( var desc; !desc && obj; obj = Object.getPrototypeOf( obj ) ){
        desc = Object.getOwnPropertyDescriptor( obj, prop );
    }

    return desc;
}

Object.xevery = function( obj, fun, context ){
    if( obj.every ) return obj.every( fun, context );

    for( var name in source ){
        if( source.hasOwnProperty( name ) ){
            if( !fun.call( context, source[ name ] ) ) return false;
        }
    }

    return true;
};

Object.xisLiteral = function( value ){
    return value && typeof value === 'object' && Object.getPrototypeOf( value ) === Object.prototype;
};

Object.xmerge = function( destination, source ){
    Object.xmap( destination, source, function( value, name ){
        if( !destination.hasOwnProperty( name ) ){
            return value;
        }
        else if( Object.xisLiteral( destination[ name ] ) && Object.isLiteral( value ) ){
            return Object.xmerge( destination[ name ], value );
        }
    });

    return destination;
};

Object.xwarnings = {
    overrideMethodWithValue : function( Ctor, name, value ){
        console.warn( '[Type Warning] Base class method overriden with value in Object.extend({ ' + name + ' : ' + value + ' }); Object =', Ctor.prototype );
    }
};

Object.extend = ( function(){
    function Class(){
        this.initialize.apply( this, arguments );
    }

    // Backbone-style extend with native properties and late definition support
    function extend( protoProps, staticProps ) {
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
        var prop = Object.xgetPropertyDescriptor( this.prototype, name );

        if( prop ){
            var baseIsFunction = typeof prop.value === 'function',
                valueIsFunction = typeof value === 'function';

            if( baseIsFunction && !valueIsFunction ){
                Object.xwarnings.overrideMethodWithValue( this, name, prop );
            }
        }

        return value;
    }

    function preparePropSpec( spec, name ){
        var prop = Object.xgetPropertyDescriptor( this.prototype, name );

        if( prop && typeof prop.value === 'function' ){
            Object.xwarnings.overrideMethodWithValue( this, name, prop );
        }

        return spec instanceof Function ? { get : spec } : spec;
    }

    function define( protoProps, staticProps, mixinProps ) {
        Object.xmap( this.prototype, protoProps, warnOnError, this );
        Object.xmap( this, staticProps, warnOnError, this );

        mixinProps && Object.defineProperties( this.prototype, Object.xmap( {}, mixinProps, preparePropSpec, this ) );
        Object.defineProperties( this.prototype, Object.xmap( {}, protoProps.properties, preparePropSpec, this ) );

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
})();
