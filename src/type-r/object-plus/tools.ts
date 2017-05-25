/**
 * Simple overridable logging stubs, writing to `console` by default.
 * Node.js users might want to redirect logging somewhere.
 * 
 * This is the singleton avaliable globally through `Object.log` or 
 * exported [[log]] variable.
 */
export class Log {
    /** Logging level.
     * - *0* - turn off everything.
     * - *1* - `log.error()` only;
     * - *2* - (_default_) `log.error()` and `log.warn()`;
     * - *3* - `error()`, `warn()`, and `info()`;
     * - *4* - all of above + `debug()`.
     */
    level : number

    /** Stop in debugger on specified logging events. 
     * 
     *      Object.log.stops.error = true;
     */
    stops : LogOptions = {}

    /** Throw exceptions for specified logging events.
     *  
     *      Object.log.throws.error = true;
     */
    throws : LogOptions = {}

    /** Logging events counter. Can be used for test assertions. */
    counts : { error : number, warn : number, info : number, debug : number }

    /** Overridable logger API. Defaults to `window.console` */
    logger : Logger

    private doLogging( type, args : any[] ){
        const { logger } = this,
              logMethod = logger && logger[ type ];

        if( logMethod ) logMethod.apply( logger, args );

        if( this.stops[ type ] )  debugger;
        if( this.throws[ type ] ) throw new Error( `[${ type }] ${ args[ 0 ] }` );

        this.counts[ type ]++;
    }

    /** Reset logger to default settings. */
    reset() : this {
        this.level = 2;
        this.counts = { error : 0, warn : 0, info : 0, debug : 0 };
        this.stops = {};
        return this;
    }

    /** Show info, stop on errors.
     * @param trueDeveloper Stop on warnings as well.
     */
    developer( trueDeveloper? : boolean ) : this {
        this.level = 3;
        this.stops = { error : true, warn : Boolean( trueDeveloper ) };
        return this;
    }

    /** @hidden */
    constructor(){
        this.logger = typeof console !== 'undefined' ? console : null;
        this.reset();
    }

    /** Similar to the `console.error`. Logging level 1. */
    error( ...args : any[] ) : void {
        if( this.level > 0 ) this.doLogging( 'error', args );
    }

    /** Similar to the `console.warn`. Logging level 2 (default). */
    warn( ...args : any[] ) : void {
        if( this.level > 1 ) this.doLogging( 'warn', args );
    }

    /** Similar to the `console.info`. Logging level 3. */
    info( ...args : any[] ){
        if( this.level > 2 ) this.doLogging( 'info', args );
    }

    /** Similar to the `console.debug`. Logging level 4. */
    debug( ...args : any[] ){
        if( this.level > 3 ) this.doLogging( 'debug', args );
    }

    /** `Object.log.state` - can be used to inspect logger state in the console. */
    get state() : string {
        return (`
Object.log - Object+ Logging and Debugging Utility
--------------------------------------------------
Object.log.counts: Number of logged events by type
    { errors : ${ this.counts.error }, warns : ${ this.counts.warn }, info : ${ this.counts.info }, debug : ${ this.counts.debug } }

Object.log.level == ${ this.level } : Ignore events which are above specified level 
    - 0 - logging is off;
    - 1 - Object.log.error(...) only;
    - 2 - .error() and .warn();
    - 3 - .error(), .warn(), and .info();
    - 4 - all of above plus .debug().

Object.log.stops: Stops in debugger for some certain event types
     { error : ${ this.stops.error || false }, warn  : ${ this.stops.warn || false }, info  : ${ this.stops.info || false }, debug : ${ this.stops.debug || false } } 

Object.log.throws: Throws expection on some certain event types
     { error : ${ this.throws.error || false }, warn  : ${ this.throws.warn || false }, info  : ${ this.throws.info || false }, debug : ${ this.throws.debug || false } }
`);
    }
}

/** Interface [[Log.logger]] must implement. */
export interface Logger {
    error( ...args : any[] ) : void
    warn( ...args : any[] ) : void
    info( ...args : any[] ) : void
    debug( ...args : any[] ) : void
}

/** Logger options used by [[Log.stop]] and [[Log.throws]]. */
export interface LogOptions {
    error? : boolean
    warn? : boolean
    info? : boolean
    debug? : boolean
}

/** Logger singleton.
 * @see [[Log]] for API.
 */
export let log = new Log();

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

/** Get a hash of static (constructor) properties which have not been inherited.
 * @param Ctor class constructor function.
 * @param names comma-separated list of static property names to compare.
 * @returns hash of listed statics which are added or overriden in the class.
 */
export function getChangedStatics( Ctor : Function, ...names : string[] ) : {}{
    const Base = getBaseClass( Ctor ),
          props = {};

    for( let name of names ){
        const value = Ctor[ name ];
        if( value !== void 0 && value !== Base[ name ] ){
            props[ name ] = value;
        }
    }

    return props;
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

// Polyfill for IE10. Should fix problems with babel and statics inheritance.
declare global {
    interface ObjectConstructor {
        setPrototypeOf( target : Object, proto : Object );
    }
}

Object.setPrototypeOf || ( Object.setPrototypeOf = defaults ); 

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