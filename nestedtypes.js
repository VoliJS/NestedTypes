// Backbone.nestedTypes 0.10.0 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin & Volicon, may be freely distributed under the MIT license

// Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
// © 2011 Colin Snover <http://zetafleet.com>
// Released under MIT license.

var Backbone = require( 'backbone' ),
    _        = require( 'underscore' );

require( './src/object+' );

var Events = require( './src/events+' );

var modelSet = require( './src/modelset' ),
    
    bbSetSingleAttr = modelSet.setSingleAttr;

    // Wire up Backbone and customisations
    // ===================================

    // Make Object.extend classes capable of sending and receiving Backbone Events...
    Object.assign( Object.extend.Class.prototype, Events );

    // Override Backbone's objects .extend...
    [ 'Model', 'Collection', 'View', 'Router', 'History' ].forEach( function( name ){
        var BackboneType = Backbone[ name ];
        if( BackboneType ) Object.extend.attach( BackboneType );
    });

    exports.Class = Object.extend.Class;

    // Extend Object+ type errors with NestedTypes specific error types...
    exports.error = Object.assign( Object.extend.error, {
        argumentIsNotAnObject : function( context, value ){
            if( typeof value === 'string' ) value = '"' + value + '"';
            console.error( '[Type Error] Attribute hash is not an object in ' + context.__class + '.set(', value, '); this =', context );
            //throw new TypeError( 'Attribute hash is not an object in ' + context.__class + '.set(', value, ')' );
        },

        unknownAttribute : function( context, name, value ){
            if( typeof value === 'string' ) value = '"' + value + '"';
            context.suppressTypeErrors || console.warn( '[Type Error] Attribute has no default value in ' +
                                         context.__class + '.set( "' + name + '",', value, '); this =', context );
        },

        wrongCollectionSetArg : function( context, value ){
            if( typeof value === 'string' ) value = '"' + value + '"';
            console.error( '[Type Error] Wrong argument type in ' + context.__class + '.set(', value, '); this =', context );
            //throw new TypeError( 'Wrong argument type in ' + context.__class + '.set(' + value + ')' );
        }
    });

    // Nested Attribute and Options
    // ========================================
    exports.options = require( './src/attribute' );

    exports.defaults = function( x ){
        return exports.Model.defaults( x );
    };

    exports.value = function( value ){ return exports.options({ value: value }); };

    // Nested Backbone Types
    // =========================

    // Nested Model Definition
    // -----------------------
    exports.Model = require( './src/model' );

    // Nested Collection Definition
    // ----------------------------
    exports.Collection = exports.Model.Collection = ( function(){
        var Collection,
            CollectionProto = Backbone.Collection.prototype;

        function wrapCall( func ){
            return function(){
                if( !this.__changing++ ) this.trigger( 'before:change' );

                var res = func.apply( this, arguments );

                if( !--this.__changing ) this.trigger( 'after:change' );

				return res;
            };
        }

        Collection = Backbone.Collection.extend({
            triggerWhenChanged: Backbone.VERSION >= '1.2.0' ? 'update change reset' : 'add remove change reset',
            __class : 'Collection',

			model : exports.Model,

            isValid : function( options ){
                return this.every( function( model ){
                    return model.isValid( options );
                });
            },

            get: function(obj) {
                if (obj == null) return void 0;
                return typeof obj === 'object' ? this._byId[obj.id] || this._byId[obj.cid] : this._byId[ obj ];
            },

            deepClone : function(){ return this.clone({ deep : true }); },

            clone: function( options ){
                var models = options && options.deep ?
                    this.map( function( model ){
                        return model.clone( options );
                    } ) : this.models;

                return new this.constructor( models );
            },

            __changing: 0,

            set: wrapCall( function( models, options ){
                if( models ){
                    if( typeof models !== 'object' ||
                        !( models instanceof Array || models instanceof exports.Model || Object.getPrototypeOf( models ) === Object.prototype ) ){
                        exports.error.wrongCollectionSetArg( this, models );
                    }
                }

                return CollectionProto.set.call( this, models, options );
            }),

            remove : wrapCall( CollectionProto.remove ),
            add    : wrapCall( CollectionProto.add ),
            reset  : wrapCall( CollectionProto.reset ),
            sort   : wrapCall( CollectionProto.sort ),

            getModelIds : function(){ return _.pluck( this.models, 'id' ); }
        },{
            // Cache for subsetOf collection subclass.
            __subsetOf : null,
            defaults : function( attrs ){
                return this.prototype.model.extend({ defaults : attrs }).Collection;
            },
            extend : function(){
                // Need to subsetOf cache when extending the collection
                var This = Backbone.Collection.extend.apply( this, arguments );
                This.__subsetOf = null;
                return This;
            }
        });

        return Collection;
    })();

    // Backbone Attribute
    // ----------------

    // helper attrSpec mock to force attribute update
    var bbForceUpdateAttr = new ( exports.options.Type.extend({
        isChanged : function(){ return true; }
    }));

    exports.options.Type.extend({
        create : function( options ){ return new this.type( null, options ); },
        clone : function( value, options ){ return value && value.clone( options ); },
        toJSON : function( value ){ return value && value.toJSON(); },

        isChanged : function( a, b ){ return a !== b; },

        isBackboneType : true,
        isModel : true,

        createPropertySpec : function(){
            // if there are nested changes detection enabled, disable optimized setter
            if( this.__events ){
                return ( function( self, name, get ){
                    return {
                        set : function( value ){
                            var attrs = {};
                            attrs[ name ] = value;
                            setAttrs( this, attrs );
                        },

                        get : get ? function(){ return get.call( this, this.attributes[ name ], name ); } :
                            function(){ return this.attributes[ name ]; }
                    }
                } )( this, this.name, this.get );
            }
            else return exports.options.Type.prototype.createPropertySpec.call( this );
        },

        cast : function( value, options, model, name ){
            var incompatibleType = value != null && !( value instanceof this.type ),
                existingModelOrCollection = model.attributes[ name ];

            if( incompatibleType ){
                if( existingModelOrCollection ){ // ...delegate update for existing object 'set' method
                    if( options && options.parse && this.isModel ){ // handle inconsistent backbone's parse implementation
                        value = existingModelOrCollection.parse( value );
                    }

                    existingModelOrCollection.set( value, options );
                    value = existingModelOrCollection;
                }
                else{ // ...or create a new object, if it's not exist
                    value = new this.type( value, options );
                }
            }

            return value;
        },

        initialize : function( spec ){
            var name = this.name,
                triggerWhenChanged = this.triggerWhenChanged || spec.type.prototype.triggerWhenChanged;

            this.isModel = this.type.prototype instanceof exports.Model;

            if( triggerWhenChanged ){
                // for collection, add transactional methods to join change events on bubbling
                this.__events = this.isModel ? {} : {
                    'before:change' : exports.Model.prototype.__beginChange,
                    'after:change'  : exports.Model.prototype.__commitChange
                };

                this.__events[ triggerWhenChanged ] = function handleNestedChange(){
                    var attr = this.attributes[ name ];

                    if( this.__duringSet ){
                        this.__nestedChanges[ name ] = attr;
                    }
                    else{
                        bbSetSingleAttr( this, name, attr, bbForceUpdateAttr );
                    }
                };
            }
        }
    }).bind( exports.Model, exports.Collection );

    // Nested Relations
    //=================

    var _store = null;

    function parseReference( collectionRef ){
        switch( typeof collectionRef ){
            case 'function' : return collectionRef;
            case 'object'   : return function(){ return collectionRef; };
            case 'string'   : return new Function( 'return this.' + collectionRef );
        }
    }

    exports.Model.from = exports.Model.From = exports.Model.RefTo = ( function(){
        return function( masterCollection ){
            var getMaster = parseReference( masterCollection );

            function clone( value ){
                return value && typeof value === 'object' ? value.id : value;
            }

            var ModelRefAttribute = exports.options.Type.extend({
                toJSON : clone,
                clone  : clone,

                isChanged : function( a, b ){
                    // refs are equal when their id is equal.
                    var aId = a && typeof a == 'object' ? a.id : a,
                        bId = b && typeof b == 'object' ? b.id : b;

                    return aId !== bId;
                },

                get : function( objOrId, name ){
                    if( typeof objOrId !== 'object' ){
                        // Resolve reference.
                        var master = getMaster.call( this );

                        if( master && master.length ){
                            // Silently update attribute with object form master.
                            objOrId = master.get( objOrId ) || null;
                            this.attributes[ name ] = objOrId;

                            // Subscribe for events manually. delegateEvents won't be invoked.
                            var attrSpec = this.__attributes[ name ];
                            objOrId && attrSpec.events && this.listenTo( objOrId, attrSpec.events );
                        }
                        else{
                            objOrId = null;
                        }
                    }

                    return objOrId;
                }
            });

            var options = exports.options({ value : null });
            options.Attribute = ModelRefAttribute; //todo: consider moving this to the attrSpec
            return options;
        };
    })();

    exports.Collection.SubsetOf = exports.Collection.subsetOf = exports.Collection.RefsTo = ( function(){
        var CollectionProto = exports.Collection.prototype;

        var refsCollectionSpec = {
            triggerWhenChanged : Backbone.VERSION >= '1.2.0' ? 'update reset' : 'add remove reset', // don't bubble changes from models
            __class : 'Collection.SubsetOf',

            resolvedWith : null,
            refs : null,

            toJSON : function(){
                return this.refs || _.pluck( this.models, 'id' );
            },

            clone : function( options ){
                var copy = CollectionProto.clone.call( this, _.omit( options, 'deep' ) );
                copy.resolvedWith = this.resolvedWith;
                copy.refs = this.refs;

                return copy;
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

            addAll : function(){
                this.reset( this.resolvedWith.models );
            },
            removeAll : function(){
                this.reset();
            },
            justOne : function( arg ){
                var model = arg instanceof Backbone.Model ? arg : this.resolvedWith.get( arg );
                this.set( [ model ] );
            },
            set : function( models, upperOptions ){
                var options = { merge : false };

                if( models ){
                if( models instanceof Array && models.length && typeof models[ 0 ] !== 'object' ){
                        options.merge = options.parse = true;
                    }
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
            var SubsetOf = this.__subsetOf || ( this.__subsetOf = this.extend( refsCollectionSpec ) );
            var getMaster = parseReference( masterCollection );

            return exports.options({
                type : SubsetOf,

                get : function( refs ){
                    !refs || refs.resolvedWith || refs.resolve( getMaster.call( this ) );
                    return refs;
                }
            });
        };
    })();

    Object.defineProperty( exports, 'store', {
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

            var $ = Backbone.$;

            var Cache = exports.Model.extend({
                attributes : spec,
                resolved : {},

                initialize : function(){
                    this.resolved = {};
                    this.installHooks();
                },
                installHooks : function(){
                    var self = this;

                    _.each( this.attributes, function( element, name ){
                        if( !element ) return;
                        var fetch = element.fetch;
                        if( fetch ){
                            element.fetch = function(){
                                self.resolved[ name ] = true;
                                return fetch.apply( this, arguments );
                            }
                        }

                        if( element instanceof exports.Collection && element.length ){
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

                    return $ && $.when && $.when.apply( Backbone.$, xhr );
                },

                clear : function(){
                    var attrs = this.defaults();
                    arguments.length && ( attrs = _.pick( attrs, _.toArray( arguments ) ) );
                    this.set( attrs );
                    this.installHooks();
                    return this;
                }
            });

            exports.Model.prototype.store = _store = new Cache();
        },

        get : function(){
            return _store;
        }
    });
