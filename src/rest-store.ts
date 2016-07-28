var Backbone   = require( './backbone+' ),
    $          = Backbone.$;
    Model      = require( './model' ),
    Collection = require( './collection' ),
    RestMixin  = require( './rest-mixin' ),
    _          = require( 'underscore' );

export class RestStore extends Store{
    _resolved  : {}

    initialize(){
        this._resolved = {};
        var self = this;

        this.each( this.attributes, ( element, name ) => {
            if( !element ) return;

            element.store = this;

            var fetch = element.fetch;

            if( fetch ){
                element.fetch = function() {
                    return self._resolved[ name ] = fetch.apply( this, arguments );
                }
            }

            if( element instanceof Collection && element.length ){
                this._resolved[name] = true;
            }
        });
    }

    // fetch specified items, or all items if called without arguments.
    // returns jquery promise
    fetch(){
        var xhr         = [],
            objsToFetch = arguments.length ? arguments : this.keys();

        for( let name of objsToFetch ){
            var attr = this.attributes[name];
            attr && attr.fetch && xhr.push( attr.fetch() );
        }

        return $ && $.when && $.when.apply( Backbone.$, xhr );
    }

    // fetch specified items, or all items if called without arguments.
    // returns first jquery promise.
    fetchOnce(){
        var xhr         = [],
            self        = this,
            objsToFetch = arguments.length ? arguments : this.keys();

        for( let name of objsToFetch ){
            var attr = self.attributes[ name ];
            xhr.push( self._resolved[ name ] || attr && attr.fetch && attr.fetch());
        }

        return $ && $.when && $.when.apply( Backbone.$, xhr );
    }

    clear(){
        var objsToClear = arguments.length ? arguments : this.keys();

        for( let name of objsToClear ){
            var element = this.attributes[ name ];

            if( element instanceof Collection ){
                element.reset();
            }
            else if( element instanceof Store ){
                element.clear();
            }
            else if( element instanceof Model ){
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

        return Model.extend.call( this, props, staticProps )
    }
} 
    