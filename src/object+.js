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

Object.xcopy = function( dest ){
    for( var i = 1; i < arguments.length; i++ ){
        var source = arguments[ i ];

        for( var name in source ){
            source.hasOwnProperty( name ) && ( dest[ name ] = source[ name ] );
        }
    }

    return dest;
};

Object.xevery = function( obj, fun, context ){
    if( obj.every ) return obj.every( fun, context );

    for( var name in source ){
        if( source.hasOwnProperty( name ) ){
            if( !fun.call( context, source[ name ] ) ) return false;
        }
    }

    return true;
};

Object.xIsLiteral = function( value ){
    return value && typeof value === 'object' &&  Object.getPrototypeOf( value ) === Object.prototype;
};

Object.xmerge = function( destination, source ){
    Object.xmap( destination, source, function( value, name ){
        if( !destination.hasOwnProperty( name ) ){
            return value;
        }
        else if( Object.isLiteral( destination[ name ] ) && Object.isLiteral( value ) ){
            return Object.xmerge( destination[ name ], value );
        }
    });

    return destination;
};

Object.extend = ( function(){
    function Class(){
        this.initialize.apply( this, arguments );
    }

    Class.prototype.initialize = function(){};

    // Backbone-style extend with native properties and late definition support
    Class.extend = function( protoProps, staticProps ) {
        var Parent = this === Object ? Class : this,
            Child;

        if( typeof protoProps === 'function' ){
            Child = protoProps;
        }
        else if( protoProps && protoProps.hasOwnProperty( 'constructor' ) ){
            Child = protoProps.constructor;
        }
        else{
            Child = function Constructor(){ return Parent.apply( this, arguments ); };
        }

        Object.xcopy( Child, Parent );

        Child.prototype = Object.create( Parent.prototype );
        Child.prototype.constructor = Child;
        Child.__super__ = Parent.prototype;

        protoProps && Child.define( protoProps, staticProps );

        return Child;
    };

    Class.define = Class.extend.define = function( protoProps, staticProps ) {
        Object.xcopy( this.prototype, protoProps );
        Object.xcopy( this, staticProps );

        Object.defineProperies( this.prototype,
            Object.xmap( {}, protoProps.properties, function( spec ){
                return spec instanceof Function ? { get : spec } : spec;
            })
        );

        return this;
    };

    return Class.extend;
}() );
