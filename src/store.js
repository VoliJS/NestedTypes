var Backbone   = require( './backbone+' ),
    $          = Backbone.$;
    Model      = require( './model' ),
    Collection = require( './collection' ),
    _          = require( 'underscore' );

var _store = null;

var Store = exports.Model = Model.extend({
  // end store lookup sequence on this class
  getStore : function(){ return this; },

  sync : Backbone.sync,
  // delegate item lookup to global store if undefined
  get : function( name ){ return this[ name ] || _store[ name ]; }
});

var RestStore = exports.Lazy = Model.extend( {
    _resolved  : {},

    initialize   : function(){
        this._resolved = {};
        var self = this;

        _.each( this.attributes, function( element, name ){
            if( !element ) return;

            element.store = this;

            var fetch = element.fetch;

            if( fetch ){
                element.fetch = function(){
                    self._resolved[ name ] = true;
                    return fetch.apply( this, arguments );
                }
            }

            if( element instanceof Collection && element.length ){
                this._resolved[name] = true;
            }
        }, this );
    },

    // fetch specified items, or all items if called without arguments.
    // returns jquery promise
    fetch : function(){
        var xhr         = [],
            objsToFetch = arguments.length ? arguments : _.keys( this.attributes );

        _.each( objsToFetch, function( name ){
            var attr = this.attributes[name];
            attr && attr.fetch && xhr.push( attr.fetch() );
        }, this );

        return $ && $.when && $.when.apply( Backbone.$, xhr );
    },

    clear : function(){
        var objsToClear = arguments.length ? arguments : _.keys( this.attributes );

        _.each( objsToClear, function( name ){
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
        }, this );

        return this;
    }
}, {
    extend : function( props, staticProps ){
        var spec = props.defaults || props.attributes;

        // add automatic fetching on first element's access
        _.each( spec, function( Type, name ){
            Type.options && ( spec[name] = Type.options( {
                get : function( value ){
                    if( !this._resolved[name] ){
                        value.fetch && value.fetch();
                        this._resolved[name] = true;
                    }

                    return value;
                },

                set : function( value ){
                    value.length || ( this._resolved[name] = false );
                    return value;
                }
            } ) );
        } );

        var This = Model.extend.call( this, props, staticProps ),
            instance = null;

        Object.defineProperty( This, 'self', {
            enumerable : false,
            get : function(){
                return instance || ( instance = new This() );
            }
        });

        return This;
    }
});

// Exports native property spec for model store
exports.globalProp = {
    get : function(){ return _store; },

    set : function( store ){
        if( _store ){
          _store.stopListening();
          delete _store.get;
        }

        Collection.prototype._defaultStore = Model.prototype._defaultStore = _store = store;
        _store.get = Model.prototype.get;
    }
}
