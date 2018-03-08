import { IOEndpoint, IOOptions, IOPromise, createIOPromise } from 'type-r'

export function create( url : string, fetchOptions? : Partial<RestfulFetchOptions> ){
    return new RestfulEndpoint( url, fetchOptions );
}

export { create as restfulIO }

export interface RestfulIOOptions extends IOOptions {
    params? : object,
    options? : RequestInit
}

export type RestfulFetchOptions = /* subset of RequestInit */{
    cache?: RequestCache;
    credentials?: RequestCredentials;
    mode?: RequestMode;
    redirect?: RequestRedirect;
    referrerPolicy?: ReferrerPolicy;
}

export class RestfulEndpoint implements IOEndpoint {

    constructor( public url : string, public fetchOptions? : Partial<RestfulFetchOptions> ) {
    }

    public static defaultFetchOptions : RestfulFetchOptions = {
        cache: "no-cache",
        credentials: "same-origin",
        mode: "cors",
        redirect: "error",
    }

    create( json, options : RestfulIOOptions, record ) {
        return this.request( 'POST', this.collectionUrl( record, options ), options, json );
    }

    update( id, json, options : RestfulIOOptions, record ) {
        return this.request( 'PUT', this.objectUrl( record, id, options ), options, json );
    }

    read( id, options : IOOptions, record ){
        return this.request( 'GET', this.objectUrl( record, id, options ), options );
    }

    destroy( id, options : RestfulIOOptions, record ){
        return this.request( 'DELETE', this.objectUrl( record, id, options ), options );
    }

    list( options : RestfulIOOptions, collection ) {
        return this.request( 'GET', this.collectionUrl( collection, options ), options );
    }

    subscribe( events ) : any {}
    unsubscribe( events ) : any {}


    protected isRelativeUrl( url ) {
        return url.indexOf( './' ) === 0;
    }

    protected removeTrailingSlash( url : string ) {
        const endsWithSlash = url.charAt( url.length - 1 ) === '/';
        return endsWithSlash ? url.substr( 0, url.length - 1 ) : url;
    }

    protected getRootUrl( recordOrCollection ) {
        const { url } = this
        if( this.isRelativeUrl( url ) ) {
            const owner         = recordOrCollection.getOwner(),
                  ownerUrl      = owner.getEndpoint().getUrl( owner );

            return this.removeTrailingSlash( ownerUrl ) + '/' + url.substr( 2 )
        } else {
            return url;
        }
    }

    protected getUrl( record ) {
        const url = this.getRootUrl( record );
        return record.isNew()
            ? url
            : this.removeTrailingSlash( url ) + '/' + record.id
    }

    protected objectUrl( record, id, options ){
        return appendParams( this.getUrl( record ), options.params );
    }

    protected collectionUrl( collection, options ){
        return appendParams( this.getRootUrl( collection ), options.params );
    }

    protected buildRequestOptions( method : string, options? : RequestInit, body? ) : RequestInit {
        const mergedOptions : RequestInit = Object.assign( {},
            RestfulEndpoint.defaultFetchOptions,
            this.fetchOptions,
            options
        );

        const {headers, ...rest}          = mergedOptions,
              resultOptions : RequestInit = {
                  method,
                  headers: {
                      'Content-Type': 'application/json',
                      ...headers
                  },
                  ...rest
              };

        if( body ) {
            resultOptions.body = JSON.stringify( body );
        }
        return resultOptions;
    }

    protected request( method : string, url : string, {options} : RestfulIOOptions, body? ) : Promise<any> {

        return fetch( url, this.buildRequestOptions( method, options, body ) )
            .then( response => {
                if( response.ok ) {
                    return response.json()
                } else {
                    throw new Error( response.statusText )
                }
            } );
    }
}

function appendParams( url, params? ) {
    var esc = encodeURIComponent;
    return params
        ? url + '?' + Object.keys( params )
                          .map( k => esc( k ) + '=' + esc( params[ k ] ) )
                          .join( '&' )
        : url;
}


