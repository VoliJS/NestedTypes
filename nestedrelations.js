// Backbone.NestedRelations 0.1.0 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin & Volicon, may be freely distributed under the MIT license

( function( root, factory ){
    if( typeof define === 'function' && define.amd ) {
        define( [ 'nestedtypes', 'underscore' ], factory );
    }
    else if( typeof module !== 'undefined' ){
        module.exports = factory( require( 'nestedtypes' ), require( 'underscore' ) );
    }
    else{
        factory( root.NestedTypes, root._ );
    }
}( this, function( Nested, _ ){
    'use strict';
    var _relations = null;

    function parseReference( masterCollection ){
        if( typeof masterCollection === 'function' ){
            return masterCollection;
        }
        else if(  typeof masterCollection === 'object' ){
            return function(){ return masterCollection; };
        }
        else{
            return function(){ return _relations[ masterCollection ]; }
        }
    }

    Nested.Model.from = Nested.Model.From = Nested.Model.RefTo = ( function(){
        return function( masterCollection ){
            var getMaster = parseReference( masterCollection );

            return Nested.options({
                value : null,

                toJSON : function( value ){
                    return typeof value === 'object' ? value.id : value;
                },

                property : function( name ){
                    return {
                        get : function(){
                            var objOrId = this.attributes[ name ];

                            if( typeof objOrId !== 'object' ){
                                var master = getMaster.call( this );

                                if( master && master.length ){
                                    objOrId = master.get( objOrId ) || null;
                                    this.set( name, objOrId, { silent: true });
                                }
                                else{
                                    objOrId = null;
                                }
                            }

                            return objOrId;
                        },

                        set : function( modelOrId ){
                            this.set( name, modelOrId );

                            return modelOrId;
                        }
                    }
                }
            });
        };
    })();

    Nested.Collection.SubsetOf = Nested.Collection.subsetOf = Nested.Collection.RefsTo = ( function(){
        var CollectionProto = Nested.Collection.prototype;

        var refsCollectionSpec = {
            triggerWhenChanged : "add remove reset sort",
            __class : 'Collection.SubsetOf',

            resolvedWith : null,
            refs : null,

            toJSON : function(){
                return this.refs || _.pluck( this.models, 'id' );
            },

            deepClone : CollectionProto.clone,

            parse : function( raw ){
                var models = [];

                if( this.resolvedWith ){
                    models = _.compact( _.map( raw, function( id ){
                        return this.resolvedWith.get( id );
                    }, this ) );
                }
                else{
                    this.refs = raw;
                }

                return models;
            },

            toggle : function( modelOrId ){
                var model = this.resolvedWith.get( modelOrId );

                if( this.get( model ) ){
                    this.remove( model );
                }
                else{
                    this.add( model );
                }
            },

            set : function( models, upperOptions ){
                var options = { merge : false };

                if( models instanceof Array && models.length && typeof models[ 0 ] !== 'object' ){
                    options.parse = true;
                }

                CollectionProto.set.call( this, models, _.defaults( options, upperOptions ) );
            },

            resolve : function( collection ){
                if( collection && collection.length ){
                    this.resolvedWith = collection;

                    if( this.refs ){
                        this.reset( this.refs, { silent : true } );
                        this.refs = null;
                    }
                }

                return this;
            }
        };

        return function( masterCollection ){
            var getMaster = parseReference( masterCollection );

            return Nested.options({
                type : this.extend( refsCollectionSpec ),

                get : function( refs ){
                    refs.resolvedWith || refs.resolve( getMaster.call( this ) );
                    return refs;
                }
            });
        };
    })();

    Object.defineProperty( Nested, 'relations', {
        set : function( spec ){
            _.each( spec, function( Type, name ){
                Type.options && ( spec[ name ] = Type.options({
                    get : function( value ){
                        if( !this.resolved[ name ] ){
                            value.fetch && value.fetch();
                            this.resolved[ name ] = true;
                        }

                        return value;
                    },

                    set : function( value ){
                        value.length || ( this.resolved[ name ] = false );
                        return value;
                    }
                }) );
            });

            var Cache = Nested.Model.extend({
                attributes : spec,
                resolved : {},

                initialize : function(){
                    var self = this;
                    this.resolved = {};

                    _.each( this.attributes, function( element, name ){
                        var fetch = element.fetch;
                        if( fetch ){
                            element.fetch = function(){
                                self.resolved[ name ] = true;
                                return fetch.apply( this, arguments );
                            }
                        }

                        if( element instanceof Nested.Collection && element.length ){
                            this.resolved[ name ] = true;
                        }
                    }, this );
                },

                fetch : function(){
                    var xhr = [],
                        objsToFetch = arguments.length ? arguments : _.keys( this.resolved );

                    _.each( objsToFetch, function( name ){
                        var attr = this.attributes[ name ];
                        attr.fetch && xhr.push( attr.fetch() );
                    }, this );

                    return $.when.apply( $, xhr );
                },

                clear : function(){
                    var attrs = this.defaults();
                    arguments.length && ( attrs = _.pick( attrs, _.toArray( arguments ) ) );
                    this.set( attrs );
                }
            });

            _relations = new Cache();
        },

        get : function(){
            return _relations;
        }
    });

    return Nested;
}));
