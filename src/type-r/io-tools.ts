export interface IONode {
    _endpoint : IOEndpoint
    _ioPromise : IOPromise< this >
}

export interface IOPromise<T> extends Promise<T> {
    abort? : () => void
}

export interface IOEndpoint {
    list( options : IOOptions, collection? ) : IOPromise<any>
    create( json : any, options : IOOptions, record? ) : IOPromise<any>
    update( id : string | number, json :any, options : IOOptions, record? ) : IOPromise<any>
    read( id : string | number, options : IOOptions, record? ) : IOPromise<any>
    destroy( id : string | number, options : IOOptions, record? ) : IOPromise<any>
    subscribe( events : IOEvents, collection? ) : IOPromise<any>
    unsubscribe( events : IOEvents, collection? ) : void
}

export interface IOOptions {
    ioUpdate? : boolean
}

export interface IOEvents {
    updated? : ( json : any ) => void
    removed? : ( json : any ) => void
}

export function getOwnerEndpoint( self ) : IOEndpoint {
    // Check if we are the member of the collection...
    const { collection } = self;
    if( collection ){
        return getOwnerEndpoint( collection );
    }

    // Now, if we're the member of the model...
    if( self._owner ){
        const { _endpoints } = self._owner;
        return _endpoints && _endpoints[ self._ownerKey ];
    }
}

/**
 * Create abortable promise.
 * Adds `promise.abort()` function which rejects the promise by default
 * initialize() function takes third optional argument `abort : ( resolve, reject ) => void`,
 * which can be used to add custom abort handling.
 */
declare var Promise: PromiseConstructorLike;

export function createIOPromise( initialize : InitIOPromise ) : IOPromise<any>{
    let resolve, reject, onAbort;

    function abort( fn ){
        onAbort = fn;
    }

    const promise : IOPromise<any> = new Promise( ( a_resolve, a_reject ) =>{
        reject = a_reject;
        resolve = a_resolve;
        initialize( resolve, reject, abort );
    }) as IOPromise<any>;

    promise.abort = () => {
        onAbort ? onAbort( resolve, reject ) : reject( new Error( "I/O Aborted" ) );
    }

    return promise;
}

export type InitIOPromise = ( resolve : ( x? : any ) => void, reject : ( x? : any ) => void, abort? : ( fn : Function ) => void ) => void;

export function startIO( self : IONode, promise : IOPromise<any>, options : IOOptions, thenDo : ( json : any ) => any ) : IOPromise<any> {
    // Stop pending I/O first...
    abortIO( self );

    // Mark future update transaction as IO transaction.
    options.ioUpdate = true;

    self._ioPromise = promise
        .then( resp => {
            self._ioPromise = null;
    
            const result = thenDo ? thenDo( resp ) : resp;
                
            triggerAndBubble( self, 'sync', self, resp, options );
                
            return result;
        } )  
        .catch( err => {
            self._ioPromise = null;

            console.error( err );
            
            triggerAndBubble( self, 'error', self, err, options );
            
            throw err;
        } ) as IOPromise<any>;

    self._ioPromise.abort = promise.abort;

    return self._ioPromise;
}

export function abortIO( self : IONode ){
    if( self._ioPromise && self._ioPromise.abort ){
        self._ioPromise.abort();
        self._ioPromise = null;
    }
}

export function triggerAndBubble( eventSource, ...args ){
    eventSource.trigger.apply( eventSource, args );
    const { collection } = eventSource;
    collection && collection.trigger.apply( collection, args ); 
}