import { define, Store } from 'type-r';
import "type-r/globals";
import * as _ from 'underscore';
import Backbone from './backbone';
import { RestCollection, RestModel } from './rest';

@define({
    getStore : Store.prototype.getStore,
    get : Store.prototype.get,
})
export class RestStore extends RestModel {}

@define
export class LazyStore extends RestStore {
    _resolved  : {} = {}

    initialize(){
        this.forEach( ( element, name ) => {
            if( !element ) return;

            element.store = this;

            var fetch = element.fetch;

            if( fetch ){
                const self = this;
                element.fetch = function() {
                    return self._resolved[ name ] = fetch.apply( this, arguments );
                }
            }

            if( element instanceof RestCollection && element.length ){
                this._resolved[name] = true;
            }
        });
    }

    // fetch specified items, or all items if called without arguments.
    // returns jquery promise
    fetch( ...args : any[] /* hack, inheritance here violates LSP */) : any {
        var xhr         = [],
            objsToFetch = args.length ? args : this.keys();

        for( let name of objsToFetch ){
            var attr = this.attributes[name];
            attr && attr.fetch && xhr.push( attr.fetch() );
        }

        const { $ } = Backbone;
        return $ && $.when && $.when.apply( $, xhr );
    }

    // fetch specified items, or all items if called without arguments.
    // returns first jquery promise.
    fetchOnce( ...args : string[] ) : JQueryXHR {
        var xhr         = [],
            self        = this,
            objsToFetch = args.length ? args : this.keys();

        for( let name of objsToFetch ){
            var attr = self.attributes[ name ];
            xhr.push( self._resolved[ name ] || attr && attr.fetch && attr.fetch());
        }

        const { $ } = Backbone;
        return $ && $.when && $.when.apply( $, xhr );
    }

    clear( ...args : string[] ) : this {
        var objsToClear = args.length ? args : this.keys();

        for( let name of objsToClear ){
            var element = this.attributes[ name ];

            if( element instanceof RestCollection ){
                element.reset();
            }
            else if( element instanceof Store ){
                element.clear();
            }
            else if( element instanceof RestModel ){
                element.set( element.defaults() )
            }

            this._resolved[ name ] = false;
        }

        return this;
    }

    static onDefine( definitions, BaseClass ){
        var attributes = definitions.defaults || definitions.attributes;

        // add automatic fetching on first element's access
        _.each( attributes, ( Type : Function, name ) => {
            if( Type.has ){
                attributes[name] = Type.has
                    .set( function( value ){
                        if( !value || !value.length ){
                            const resolved = this._resolved || ( this._resolved = {} ); 
                            resolved[name] = false;
                        }
                        
                        return value;
                    })
            }  
        });

        RestModel.onDefine.call( this, definitions, BaseClass );
    }
} 
    