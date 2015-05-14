
Object.xevery = function( obj, fun, context ){
    if( obj.every ) return obj.every( fun, context );

    for( var name in obj ){
        if( obj.hasOwnProperty( name ) ){
            if( !fun.call( context, obj[ name ] ) ) return false;
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
