import { IOEndpoint, IOOptions, IOPromise, createIOPromise } from 'type-r'

export type Index = number[];

export function create( key : string ){
    return new LocalStorageEndpoint( key );
}

export { create as localStorageIO }

export class LocalStorageEndpoint implements IOEndpoint {
    constructor( public key : string ){
    }

    resolve( value ){
        return createIOPromise( ( resolve, reject ) => {
            setTimeout( () =>{
                resolve( value )
            }, 0 );
        });
    }
    
    reject( value ){
        return createIOPromise( ( resolve, reject ) => {
            setTimeout( () => reject( value ), 0 );
        });
    }

    create( json, options : IOOptions ) {
        const { index } = this;
        index.push( json.id = String( ( index[ 0 ] as number )++ ) );
        this.index = index;
        this.set( json );
        return this.resolve({ id : json.id });
    }

    set( json ){
        localStorage.setItem( this.key + '#' + json.id, JSON.stringify( json ) );
    }

    get( id ){
        return JSON.parse( localStorage.getItem( this.key + '#' + id ) );
    }

    update( id, json, options : IOOptions ) {
        json.id = id;
        this.set( json );
        return this.resolve( {} );
    }

    read( id, options : IOOptions ){
        const existing = this.get( id );
        return existing ?
            this.resolve( existing ) : 
            this.reject( "Not found" );
    }

    destroy( id, options : IOOptions ){
        const existing = this.get( id );
        if( existing ){
            localStorage.removeItem( this.key + '#' + id );
            this.index = this.index.filter( x => x !== id );
            return this.resolve( {} );
        }
        else{
            return this.reject( "Not found" );
        }
    }

    get index() : ( string | number )[]{
        return JSON.parse( localStorage.getItem( this.key ) ) || [ 0 ];
    }

    set index( x ){
        localStorage.setItem( this.key, JSON.stringify( x ) );
    }

    list( options? : IOOptions ) {
        const { index } = this; 
        return this.resolve( this.index.slice( 1 ).map( id => this.get( id ) ) );
    }

    subscribe( events ) : any {}
    unsubscribe( events) : any {}
}