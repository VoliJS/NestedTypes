import { IOEndpoint, IOOptions, IOPromise, createIOPromise, Record } from 'type-r'

export function proxyIO( record : typeof Record ){
    return new ProxyEndpoint( record );
}

export class ProxyEndpoint implements IOEndpoint {
    Record : typeof Record
    
    get endpoint(){
        return this.Record.prototype._endpoint;
    }

    constructor( record : typeof Record ){
        this.Record = record;

        // Create proxy methods...
        const source = Object.getPrototypeOf( this.endpoint );

        Object.keys( source ).forEach( key => {
            if( !this[ key ] && typeof source[ key ] === 'function' ){
                this[ key ] = function(){
                    return source[ key ].apply( this.endpoint, arguments );
                }
            }
        });
    }

    async subscribe( events, target ){
        return this.endpoint.subscribe( events, target );
    }

    unsubscribe( events, target ){
        this.endpoint.unsubscribe( events, target );
    }

    async list( options ){
        const coll = new this.Record.Collection();
        await coll.fetch( options );
        return coll.toJSON();
    }

    async update( id, json, options ){
        json.id = id;
        const doc : any = new this.Record( json, { parse : true });
        await doc.save( options );
        return { _cas : doc._cas };
    }

    async create( json, options ){
        const doc : any = new this.Record( json, { parse : true });
        await doc.save( options );
        return { id : doc.id, _cas : doc._cas, _type : doc._type };
    }

    async read( id, options : object ){
        const doc = new this.Record({ id });
        await doc.fetch( options );
        return doc.toJSON();
    }

    async destroy( id : string, options : object ){
        await this.endpoint.destroy( id, options );
        return {};
    }
}
