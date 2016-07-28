import * as Backbone from './backbone'
import * as _ from 'underscore'
import { Store } from 'type-r/src'

import { RestModel, RestCollection } from './rest'

const { $ } = Backbone;

export default class RestStore extends Store {
    _resolved  : {}

    initialize(){
        this._resolved = {};
        var self = this;

        this.each( ( element, name ) => {
            if( !element ) return;

            element.store = this;

            var fetch = element.fetch;

            if( fetch ){
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
    fetch( ...args : string[] ) : {} {
        var xhr         = [],
            objsToFetch = args.length ? args : this.keys();

        for( let name of objsToFetch ){
            var attr = this.attributes[name];
            attr && attr.fetch && xhr.push( attr.fetch() );
        }

        return $ && $.when && $.when.apply( Backbone.$, xhr );
    }

    // fetch specified items, or all items if called without arguments.
    // returns first jquery promise.
    fetchOnce( ...args : string[] ) : {} {
        var xhr         = [],
            self        = this,
            objsToFetch = args.length ? args : this.keys();

        for( let name of objsToFetch ){
            var attr = self.attributes[ name ];
            xhr.push( self._resolved[ name ] || attr && attr.fetch && attr.fetch());
        }

        return $ && $.when && $.when.apply( Backbone.$, xhr );
    }

    clear( ...args : string[] ) : {} {
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

    static extend( props, staticProps ){
        var spec = props.defaults || props.attributes;

        // add automatic fetching on first element's access
        _.each( spec, function( Type, name ){
            Type.options && ( spec[name] = Type.options( {
                get : function( value ){
                    if( !this._resolved[name] ) {
                        value.fetch && value.fetch();
                    }

                    return value;
                },

                set : function( value ){
                    value.length || ( this._resolved[name] = false );
                    return value;
                }
            } ) );
        } );

        return RestModel.extend.call( this, props, staticProps );
    }
} 
    