define( function( require, exports, module ){
    var Nested = require( 'nestedtypes' );

    function parseReference( masterCollection ){
        if( typeof masterCollection === 'function' ){
            return masterCollection;
        }
        else if(  typeof masterCollection, === 'object' ){
            return function(){ return masterCollection; };
        }
        else{
            return function(){ return this._relations[ masterCollection ]; }
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

            deepClone : function(){
                return CollectionProto.clone.apply( this, arguments );
            },

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
                this.resolvedWith = collection;

                if( this.refs ){
                    this.reset( this.refs, { silent : true } );
                    this.refs = null;
                }

                return this;
            }
        };

        return function( masterCollection ){
            var getMaster = parseReference( masterCollection );

            return Nested.options({
                type : this.extend( refsCollectionSpec ),
                property : function( name ){
                    return {
                        get : function(){
                            var refs = this.attributes[ name ];

                            if( !refs.resolvedWith ){
                                var master = getMaster.call( this );
                                master && master.length && refs.resolve( master );
                            }

                            return refs;
                        },

                        set : function( values ){
                            this.set( name, values );
                            return values;
                        },

                        enumerable : false
                    }
                }
            });
        };
    })();

    module.exports = function( spec ){
        _.each( spec, function( name ){
            spec[ name ].options && spec[ name ].options({
                get : function( value ){
                    if( !this.resolved[ name ] ){
                        value.fetch && value.fetch();
                        this.resolved[ name ] = true;
                    }

                    return value;
                },

                set : function( value ){
                    value.length || ( this.resolved.name = false );
                    return value;
                }
            });
        });

        var Cache = Nested.Model.extend({
            attributes : spec,
            resolved : {},

            initialize : function(){
                this.resolved = {};
            }

            fetch : function(){
                _.each( this.resolved, function( dontUse, name ){
                    var attr = this.attributes[ name ];
                    attr.fetch && attr.fetch();
                });
            }
        });

        return Nested.Model.prototype._relations = new Cache();
    }
})
