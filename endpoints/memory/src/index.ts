import { IOEndpoint, IOPromise, createIOPromise } from 'type-r'

export type Index = ( number | string )[];

export function create( init = [], delay = 50 ){
    return new MemoryEndpoint( init, delay );
}

export { create as memoryIO };

export class MemoryEndpoint implements IOEndpoint {
    resolve( value ){
        return createIOPromise( ( resolve, reject ) => {
            setTimeout( () => resolve( value ), this.delay );
        });
    }
    
    reject( value ){
        return createIOPromise( ( resolve, reject ) => {
            setTimeout( () => reject( value ), this.delay );
        });
    }

    constructor( init : object[], public delay : number ){
        for( let obj of init ){
            this.create( obj, {} );
        }
    }

    index : Index = [ 0 ];
    items = {};

    generateId( a_id ){
        // Update index counter...
        const id = Number( a_id );
        if( !isNaN( id ) ){
            this.index[ 0 ] = Math.max( this.index[ 0 ] as number, id );
        }

        // Return id...
        return a_id || String( ( this.index[ 0 ] as number ) ++ );
    }

    create( json, options ) {
        const id = json.id = this.generateId( json.id );
        this.index.push( id );
        this.items[ id ] = json;
        return this.resolve({ id });
    }

    update( id, json, options ) {
        this.items[ id ] = json;
        return this.resolve( {} );
    }

    read( id, options ){
        const existing = this.items[ id ];
        return existing ?
            this.resolve( existing ) : 
            this.reject( "Not found" );
    }

    destroy( id, options ){
        const existing = this.items[ id ];
        if( existing ){
            delete this.items[ id ];
            this.index = this.index.filter( x => x !== id );
            return this.resolve( {} );
        }
        else{
            return this.reject( "Not found" );
        }
    }

    list( options? : object ) {
        return this.resolve( this.index.slice( 1 ).map( id => this.items[ id ]) );
    }

    subscribe( events ) : any {}
    unsubscribe( events) : any {}
}