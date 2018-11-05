 /** Similar to underscore `_.defaults` */
export function defaults< T >( dest : T, ...sources : Object[] ) : T
export function defaults< T >( dest : T, source : Object ) : T {
    for( var name in source ) {
        if( source.hasOwnProperty( name ) && !dest.hasOwnProperty( name ) ) {
            dest[ name ] = source[ name ];
        }
    }

    if( arguments.length > 2 ){
        for( let i = 2; i < arguments.length; i++ ){
            const other = arguments[ i ];
            other && defaults( dest, other );
        }
    }

    return dest;
}

/** Check if value is raw JSON */
export function isValidJSON( value : any ) : boolean {
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
            return every( value, isValidJSON );
        }
    }

    return false;
}

/** Get the base class constructor function.
 * @param Class Subclass constructor function.
 * @returns Base class constructor function.
 */
export function getBaseClass( Class : Function ) {
    return Object.getPrototypeOf( Class.prototype ).constructor
}

export function assignToClassProto<T, K extends keyof T>( Class, definition : T, ...names : K[] ) : void {
    for( let name of names ){
        const value = definition[ name ];
        value === void 0 || ( Class.prototype[ name ] = value );
    }
}

/** Checks whenever given object is an empty hash `{}` */
export function isEmpty( obj : {} ) : boolean {
    if( obj ){
        for( let key in obj ){
            if( obj.hasOwnProperty( key ) ){
                return false;
            }
        }
    }

    return true;
}

export type Iteratee = ( value : any, key? : string | number ) => any;

/** @hidden */
function someArray( arr : any[], fun : Iteratee ) : any {
    let result;

    for( let i = 0; i < arr.length; i++ ){
        if( result = fun( arr[ i ], i ) ){
            return result;
        }
    }
}

/** @hidden */
function someObject( obj : {}, fun : Iteratee ) : any {
    let result;

    for( let key in obj ){
        if( obj.hasOwnProperty( key ) ){
            if( result = fun( obj[ key ], key ) ){
                return result;
            }
        }
    }
}

/** Similar to underscore `_.some` */
export function some( obj, fun : Iteratee ) : any {
    if( Object.getPrototypeOf( obj ) === ArrayProto ){
        return someArray( obj, fun );
    }
    else{
        return someObject( obj, fun );
    }
}

/** Similar to underscore `_.every` */
export function every( obj : { }, predicate : Iteratee ) : boolean {
    return !some( obj, x => !predicate( x ) );
}

/** Similar to `getOwnPropertyDescriptor`, but traverse the whole prototype chain. */
export function getPropertyDescriptor( obj : {}, prop : string ) : PropertyDescriptor {
    let desc : PropertyDescriptor;

    for( let proto = obj; !desc && proto; proto = Object.getPrototypeOf( proto ) ) {
        desc = Object.getOwnPropertyDescriptor( proto, prop );
    }

    return desc;
}

/** Similar to underscore `_.omit` */
export function omit( source : {}, ...rest : string[] ) : {}
export function omit( source ) : {} {
    const dest = {}, discard = {};

    for( let i = 1; i < arguments.length; i ++ ){
        discard[ arguments[ i ] ] = true;
    }

    for( var name in source ) {
        if( !discard.hasOwnProperty( name ) && source.hasOwnProperty( name ) ) {
            dest[ name ] = source[ name ];
        }
    }

    return dest;
}

/** map `source` object properties with a given function, and assign the result to the `dest` object.
 * When `fun` returns `undefined`, skip this value. 
 */
export function transform< A, B >( dest : { [ key : string ] : A }, source : { [ key : string ] : B }, fun : ( value : B, key : string ) => A | void ) : { [ key : string ] : A } {
    for( var name in source ) {
        if( source.hasOwnProperty( name ) ) {
            var value = fun( source[ name ], name );
            value === void 0 || ( dest[ name ] = < A >value );
        }
    }

    return dest;
}

/** @hidden */
export function fastAssign< A >( dest : A, source : {} ) : A {
    for( var name in source ) {
        dest[ name ] = source[ name ];
    }

    return dest;
}

/** @hidden */
export function fastDefaults< A >( dest : A, source : {} ) : A {
    for( var name in source ) {
        if( dest[ name ] === void 0 ){
            dest[ name ] = source[ name ];
        }
    }

    return dest;
}

/** Similar to underscore `_.extend` and `Object.assign` */
export function assign< T >( dest : T, ...sources : Object[] ) : T
export function assign< T >( dest : T, source : Object ) : T {
    for( var name in source ) {
        if( source.hasOwnProperty( name ) ) {
            dest[ name ] = source[ name ];
        }
    }

    if( arguments.length > 2 ){
        for( let i = 2; i < arguments.length; i++ ){
            const other = arguments[ i ];
            other && assign( dest, other );
        }
    }

    return dest;
}

/** Similar to underscore `_.keys` */
export function keys( o : any ) : string[]{
    return o ? Object.keys( o ) : [];
}

/** Similar to underscore `_.once` */
export function once( func : Function ) : Function {
    var memo, first = true;
    return function() {
        if ( first ) {
            first = false;
            memo = func.apply(this, arguments);
            func = null;
        }
        return memo;
    };
}

/** @hidden */
const ArrayProto = Array.prototype,
      DateProto = Date.prototype,
      ObjectProto = Object.prototype;

/**
 * Determine whenever two values are not equal, deeply traversing 
 * arrays and plain JS objects (hashes). Dates are compared by enclosed timestamps, all other
 * values are compared with strict comparison.
 */
export function notEqual( a : any, b : any) : boolean {
    if( a === b ) return false;

    if( a && b && typeof a == 'object' && typeof b == 'object' ) {
        const protoA = Object.getPrototypeOf( a );

        if( protoA !== Object.getPrototypeOf( b ) ) return true;

        switch( protoA ){
            case DateProto   : return +a !== +b;
            case ArrayProto  : return arraysNotEqual( a, b );
            case ObjectProto :
            case null:
                return objectsNotEqual( a, b );
        }
    }

    return true;
}

/** @hidden */
function objectsNotEqual( a, b ) {
    const keysA = Object.keys( a );

    if( keysA.length !== Object.keys( b ).length ) return true;

    for( let i = 0; i < keysA.length; i++ ) {
        const key = keysA[ i ];

        if( !b.hasOwnProperty( key ) || notEqual( a[ key ], b[ key ] ) ) {
            return true;
        }
    }

    return false;
}

/** @hidden */
function arraysNotEqual( a, b ) {
    if( a.length !== b.length ) return true;

    for( let i = 0; i < a.length; i++ ) {
        if( notEqual( a[ i ], b[ i ] ) ) return true;
    }

    return false;
}

/**
 * Create an object without Object prototype members except hasOwnProperty.
 * @param obj - optional parameter to populate the hash map from.
 */
const HashProto = Object.create( null );
HashProto.hasOwnProperty = ObjectProto.hasOwnProperty;

export function hashMap( obj? ){
    const hash = Object.create( HashProto );
    return obj ? assign( hash, obj ) : hash;
}