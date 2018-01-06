/**
 * Some sketches for reference resolution.
 *
 * 
 * a : Model.from( '~collection' )
 * 
 * We need two functions. One for get, and one for compile. 
 */
export interface Traversable {
    getStore() : Traversable
    getOwner() : Traversable
    get( key : string ) : any 
}

const referenceMask =  /\^|(store\.[^.]+)|([^.]+)/g;

// Compile reference to function
export type ResolveReference = ( root : Traversable ) => any;  

export class CompiledReference {
    resolve : ResolveReference
    tail : string
    local : boolean

    constructor( reference : string, splitTail : boolean = false ){
        const path = reference
                        .match( referenceMask )
                        .map( key => {
                            if( key === '^' || key === 'owner' ) return 'getOwner()';

                            if( key[ 0 ] === '~' ) return `getStore().get("${ key.substr( 1 ) }")`;

                            if( key.indexOf( 'store.' ) === 0 ) return `getStore().get("${ key.substr( 6 ) }")`;
                            
                            return key;
                        } );
               
        this.tail = splitTail && path.pop();
        this.local = !path.length;
        
        this.resolve = <any> new Function( 'self', `
            var v = self.${ path.shift() };
                           
            ${ path.map( x => `
                v = v && v.${ x };
            `).join('')}

            return v;
        ` );
    }
}

export function resolveReference( root : Traversable, reference : string, action : ( object, key : string ) => any ) : any {
    const path = reference.match( referenceMask ),
          skip = path.length - 1;
    
    let self = root;

    for( var i = 0; i < skip; i++ ){
        const key = path[ i ];
        switch( key ){
            case '~' : self = self.getStore(); break;
            case '^' : self = self.getOwner(); break;
            default  : self = self.get( key );
        }

        // Do nothing if object on the path doesn't exist.
        if( !self ) return;
    }

    return action( self, path[ skip ] );
}