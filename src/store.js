var Backbone   = require( './backbone+' ),
    Model      = require( './model' ),
    Collection = require( './collection' );

var _store = null;

// Exports native property spec for model store
exports.get = function(){ return _store; };

exports.set = function( spec ){
    _.each( spec, function( Type, name ){
        Type.options && ( spec[name] = Type.options( {
            get : function( value ){
                if( !this.resolved[name] ){
                    value.fetch && value.fetch();
                    this.resolved[name] = true;
                }

                return value;
            },

            set : function( value ){
                value.length || ( this.resolved[name] = false );
                return value;
            }
        } ) );
    } );

    var $ = Backbone.$;

    var Cache = Model.extend( {
        attributes : spec,
        resolved   : {},

        initialize   : function(){
            this.resolved = {};
            this.installHooks();
        },
        installHooks : function(){
            var self = this;

            _.each( this.attributes, function( element, name ){
                if( !element ){
                    return;
                }
                var fetch = element.fetch;
                if( fetch ){
                    element.fetch = function(){
                        self.resolved[name] = true;
                        return fetch.apply( this, arguments );
                    }
                }

                if( element instanceof Collection && element.length ){
                    this.resolved[name] = true;
                }
            }, this );
        },

        fetch : function(){
            var xhr         = [],
                objsToFetch = arguments.length ? arguments : _.keys( this.resolved );

            _.each( objsToFetch, function( name ){
                var attr = this.attributes[name];
                attr.fetch && xhr.push( attr.fetch() );
            }, this );

            return $ && $.when && $.when.apply( Backbone.$, xhr );
        },

        clear : function(){
            var attrs = this.defaults();
            arguments.length && ( attrs = _.pick( attrs, _.toArray( arguments ) ) );
            this.set( attrs );
            this.installHooks();
            return this;
        }
    } );

    Model.prototype.store = _store = new Cache();
};

