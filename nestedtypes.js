// Backbone.nestedTypes 0.9.11 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin & Volicon, may be freely distributed under the MIT license

// Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
// © 2011 Colin Snover <http://zetafleet.com>
// Released under MIT license.

( function( root, factory ){
    if( typeof define === 'function' && define.amd ) {
        define( [ 'exports', 'backbone', 'underscore' ], factory );
    }
    else if( typeof exports !== 'undefined' ){
        factory( exports, require( 'backbone' ), require( 'underscore' ) );
    }
    else{
        root.Nested = root.NestedTypes = {};
        factory( root.NestedTypes, root.Backbone, root._ );
    }
}( this, function( Nested, Backbone, _ ){
    Integer = function( x ){ return x ? Math.round( x ) : 0; };

    'use strict';
    var extend = Backbone.Model.extend;

    Nested.error = {
        propertyConflict : function( context, name ){
            console.error( '[Type error](' + context.__class + '.extend) Property ' + name + ' conflicts with base class members' );
        },

        argumentIsNotAnObject : function( context, value ){
            console.error( '[Type Error](' + context.__class + '.set) Attribute hash is not an object:', value, 'In model:', context );
        },

        unknownAttribute : function( context, name, value ){
            context.suppressTypeErrors || console.error( '[Type Error](' + context.__class + '.set) Attribute "' + name + '" has no default value.', value, 'In model:', context );
        }
    };

    function createExtendFor( Base ){
        return function( protoProps, staticProps ){
            var This = extend.call( this, protoProps, staticProps );

            _.each( protoProps.properties, function( propDesc, name ){
                var prop = _.isFunction( propDesc ) ? {
                    get: propDesc,
                    enumerable: false
                } : propDesc;

                if( name in Base.prototype ){
                    Nested.error.propertyConflict( This.prototype, name );
                }

                Object.defineProperty( This.prototype, name, prop );
            });

            return This;
        };
    }

    var listenTo = Backbone.Model.prototype.listenTo;

    Backbone.Events.listenTo = Backbone.Model.prototype.listenTo =
        Backbone.Collection.prototype.listenTo = Backbone.View.prototype.listenTo =
        function( source, events ){
            if( typeof events === 'object' ){
                _.each( events, function( handler, name ){
                    listenTo.call( this, source, name, handler );
                }, this );
            }
            else{
                listenTo.apply( this, arguments );
            }
        };

    /*************************************************
        NestedTypes.Class
        - can be extended as native Backbone objects
        - can send out and listen to backbone events
        - can have native properties
     **************************************************/
    Nested.Class = ( function(){
        function Class(){
            this.initialize.apply( this, arguments );
        }

        _.extend( Class.prototype, Backbone.Events, { __class: 'Class', initialize: function (){} } );
        Class.extend = createExtendFor( Class );

        return Class;
    })();

    /*************************************************
        NestedTypes.Model
        - extension of Backbone.Model
        - creates native properties for attributes
        - support optional type specs for attributes
        - perform dynamic types coercion and checks
        - support nested models and collections with 'change' events bubbling
        - transparent typed attributes serialization and deserialization
     **************************************************/

    Nested.options = ( function(){
        var Attribute = Nested.Class.extend({
            type : null,

            create : function(){
                return new this.type();
            },

            property : function( name ){
                var spec = {
                        set : function( value ){
                            this.set( name, value );
                            return value;
                        },

                        enumerable : false
                    },
                    get = this.get;

                spec.get = get ? function(){
                    return get.call( this, this.attributes[ name ] );
                } : function(){
                    return this.attributes[ name ];
                };

                return spec;
            },

            options : function( spec ){
                _.extend( this, spec );
                return this;
            },

            initialize : function( spec ){
                this.options( spec );
            }
        },{
            bind : ( function(){
                var attributeMethods = {
                    options : function( spec ){
                        spec.type || ( spec.type = this );
                        return new this.NestedType( spec );
                    },

                    value : function( value ){
                        return new this.NestedType({ type : this, value : value });
                    }
                };

                return function(){
                    _.each( arguments, function( Type ){
                        _.extend( Type, attributeMethods, { NestedType : this } );
                    }, this );
                };
            })()
        });

        Attribute.extend({
            cast : function( value ){
                return value == null || value instanceof this.type ? value : new this.type( value );
            }
        }).bind( Function.prototype );

        var primitiveTypes = {
            string : String,
            number : Number,
            boolean : Boolean
        };

        function createAttribute( spec ){
            if( arguments.length >= 2 ){
                spec = {
                    type : arguments[ 0 ],
                    value : arguments[ 1 ]
                };

                if( arguments.length >= 3 ){
                    _.extend( spec, arguments[ 2 ] );
                }
            }
            else if( 'typeOrValue' in spec ){
                var typeOrValue = spec.typeOrValue,
                    primitiveType = primitiveTypes[ typeof typeOrValue ];

                if( primitiveType ){
                    spec = { type : primitiveType, value : typeOrValue };
                }
                else{
                    spec = _.isFunction( typeOrValue ) ? { type : typeOrValue } : { value : typeOrValue };
                }
            }

            if( spec.type ){
                return spec.type.options( spec );
            }
            else{
                return new Attribute( spec );
            }
        }

        createAttribute.Type = Attribute;
        return createAttribute;
    })();

    Nested.defaults = function( x ){
        return Nested.Model.defaults( x );
    };
    Nested.value = function( value ){ return Nested.options({ value: value }); };

    ( function(){
        var numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ],
            msDatePattern = /\/Date\(([0-9]+)\)\//,
            isoDatePattern = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;

        function parseDate( date ){
            var msDate, timestamp, struct, minutesOffset = 0;

            if( msDate = msDatePattern.exec( date ) ){
                timestamp = Number( msDate[ 1 ] );
            }
            else if(( struct = isoDatePattern.exec( date ))) {
                // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
                for( var i = 0, k; ( k = numericKeys[i] ); ++i ) {
                    struct[ k ] = +struct[ k ] || 0;
                }

                // allow undefined days and months
                struct[ 2 ] = (+struct[ 2 ] || 1) - 1;
                struct[ 3 ] = +struct[ 3 ] || 1;

                if (struct[ 8 ] !== 'Z' && struct[ 9 ] !== undefined) {
                    minutesOffset = struct[ 10 ] * 60 + struct[ 11 ];

                    if (struct[ 9 ] === '+') {
                        minutesOffset = 0 - minutesOffset;
                    }
                }

                timestamp = Date.UTC(struct[ 1 ], struct[ 2 ], struct[ 3 ], struct[ 4 ], struct[ 5 ] + minutesOffset, struct[ 6 ], struct[ 7 ]);
            }
            else {
                timestamp = Date.parse( date );
            }

            return timestamp;
        }

        Nested.options.Type.extend({
            cast : function( value ){
                if( value == null || value instanceof Date ){
                    return value;
                }

                if( _.isString( value ) ){
                    value = parseDate( value );
                }

                return new Date( value );
            }
        }).bind( Date );
    })();

    // Fix incompatible constructor behaviour of primitive types...
    Nested.options.Type.extend({
        create : function(){
            return this.type();
        },

        cast : function( value ){
            return value == null ? null : this.type( value );
        }
    }).bind( Number, Boolean, String, Integer );

    // Fix incompatible constructor behaviour of Array...
    Nested.options.Type.extend({
        cast : function( value ){
            return value == null || value instanceof Array ? value : [ value ];
        }
    }).bind( Array );

    var baseModelSet =  Backbone.Model.prototype.set;

    Nested.Model = ( function(){
        var ModelProto = Backbone.Model.prototype;

        var Model = Backbone.Model.extend( {
            triggerWhenChanged: 'change',
            listening: {},

            __defaults: {},
            __attributes: { id : Nested.options({ name: 'id', value : undefined }) },
            __class : 'Model',

            __duringSet: 0,

            __beginChange : function(){
                this.__duringSet++ || ( this.__nestedChanges = {} );
            },

            __commitChange : function( attrs, options ){
                if( !--this.__duringSet ){
                    attrs || ( attrs =  {} );

                    for( var name in this.__nestedChanges ){
                        name in attrs || ( attrs[ name ] = this.__nestedChanges[ name ] );

                        if( attrs[ name ] === this.attributes[ name ] ){
                            this.attributes[ name ] = null;
                        }
                    }

                    this.__nestedChanges = {};
                }

                attrs && baseModelSet.call( this, attrs, options );
            },

            _bulkSet : function( attrs, options ){
                if( attrs.constructor !== Object ){
                    Nested.error.argumentIsNotAnObject( this, attrs );
                }

                var attrSpecs = this.__attributes;
                this.__beginChange();

                for( var name in attrs ){
                    var attrSpec = attrSpecs[ name ],
                        value = attrs[ name ];

                    if( attrSpec ){
                        attrSpec.cast && ( value = attrSpec.cast( value, options, this ) );

                        if( attrSpec.set && value !== this.attributes[ name ] ){
                            value = attrSpec.set.call( this, value, options );
                            if( value === undefined ) continue;
                            attrSpec.cast && ( value = attrSpec.cast( value, options, this ) );
                        }

                        attrSpec.delegateEvents && attrSpec.delegateEvents( this, this.attributes[ name ], value );
                        attrs[ name ] = value;
                    }
                    else{
                        Nested.error.unknownAttribute( this, name, value );
                    }
                }

                this.__commitChange( attrs, options );
                return this;
            },

            set : function( name, value, options ){
                if( typeof name === 'object' ){
                    return this._bulkSet( name, value );
                }

                var attrSpec = this.__attributes[ name ];

                if( attrSpec ){
                    if( attrSpec.isBackboneType ){
                        var attrs = {};
                        attrs[ name ] = value;
                        return this._bulkSet( attrs, options );
                    }

                    attrSpec.cast && ( value = attrSpec.cast( value, options, this ) );

                    if( attrSpec.set && value !== this.attributes[ name ] ){
                        value = attrSpec.set.call( this, value, options );
                        if( value === undefined ) return this;
                        attrSpec.cast && ( value = attrSpec.cast( value, options, this ) );
                    }
                }
                else{
                    Nested.error.unknownAttribute( this, name, value );
                }

                return baseModelSet.call( this, name, value, options );
            },

            deepGet : function( name ){
                var path = name.split( '.' ),
                    l = path.length,
                    value = this;

                for( var i = 0; i < l; i++ ){
                    value = value.get( path[ i ] );
                }

                return value;
            },

            deepSet : function( name, value, options ){
                var path = name.split( '.' ),
                    l = path.length - 1,
                    model = this,
                    attr = path[ l ];

                for( var i = 0; i < l; i++ ){
                    model = model.get( path[ i ] );
                }

                return model.set( attr, value, options );
            },

            // override get to invoke native getter...
            get : function( name ){ return this[ name ]; },

            // Create deep copy for all nested objects...
            deepClone: function(){
                var attrs = {};

                _.each( this.attributes, function( value, key ){
                    attrs[ key ] = value && value.deepClone ? value.deepClone() : value;
                });

                return new this.constructor( attrs );
            },

            // Support for nested models and objects.
            // Apply toJSON recursively to produce correct JSON.
            toJSON: function(){
                var res = {};

                _.each( this.attributes, function( value, key ){
                    var spec = this.__attributes[ key ],
                        toJSON = spec && spec.toJSON;

                    if( toJSON !== false ){
                        if( _.isFunction( toJSON ) ){
                            res[ key ] = toJSON.call( this, value, key );
                        }
                        else{
                            res[ key ] = value && value.toJSON ? value.toJSON() : value;
                        }
                    }
                }, this );

                return res;
            },

            parse : function( data ){
                var attrs = {},
                    parsed = false;

                _.each( data, function( value, name ){
                    var spec = this.__attributes[ name ];
                    if( spec && spec.parse ){
                        parsed = true;
                        attrs[ name ] = spec.parse.call( this, value, name );
                    }
                }, this );

                return parsed ? _.defaults( attrs, data ) : data;
            },

            isValid : function( options ){
                return ModelProto.isValid.call( this, options ) && _.every( this.attributes, function( attr ){
                    if( attr && attr.isValid ){
                        return attr.isValid( options );
                    }
                    else if( attr instanceof Date ){
                        return !_.isNaN( attr.getTime() );
                    }
                    else{
                        return !_.isNaN( attr );
                    }
                });
            },

            _: _ // add underscore to be accessible in templates
        } );

        function parseDefaults( spec, Base ){
            var defaultAttrs = _.isFunction( spec.defaults ) ? spec.defaults() : spec.defaults || spec.attributes || {},
                defaults    = _.defaults( defaultAttrs, Base.prototype.__defaults ),
                idAttrName      = spec.idAttribute || Base.prototype.idAttribute,
                attributes = {};

            _.each( defaults, function( attr, name ){
                attr instanceof Nested.options.Type || ( attr = Nested.options({ typeOrValue: attr }) );
                attr.name = name;

                name in defaultAttrs || ( attr.property = false );

                attributes[ name ] = attr;
            });

            // Handle id attribute, whenever it was defined or not...
            var idAttr = attributes[ idAttrName ] || ( attributes[ idAttrName ] = Nested.options({ value : undefined }) );
            'value' in idAttr || ( idAttr.value = undefined ); // id attribute must have no default value
            idAttr.name = idAttrName;

            if( idAttrName === 'id' ){
                idAttr.property = false; // to prevent conflict with backbone's model 'id'
            }

            return _.extend( _.omit( spec, 'collection', 'attributes' ), {
                __defaults  : defaults, // needed for attributes inheritance
                __attributes : attributes,
                defaults : _.isFunction( spec.defaults ) ? spec.defaults : createDefaults( attributes )
            });
        }

        function isJsonLiteral( value ){
            var type = typeof value,
                isJSON = value === null || type === 'number' || type === 'string' || type === 'boolean';

            if( !isJSON && type === 'object' ){
                var proto = Object.getPrototypeOf( value );

                if( proto === Object.prototype || proto === Array.prototype ){
                    isJSON = _.every( value, isJsonLiteral );
                }
            }

            return isJSON;
        }

        function createDefaults( attributes ){
            var json = [], init = {}, refs = {};

            _.each( attributes, function( attr, name ){
                if( attr.value !== undefined ){
                    if( isJsonLiteral( attr.value ) ){
                        json.push( name + ':' + JSON.stringify( attr.value ) ); // and make a deep copy
                    }
                    else{ // otherwise, copy it by reference.
                        refs[ name ] = attr.value;
                    }
                }
                else{
                    attr.type && ( init[ name ] = attr );
                }
            });

            var literals = new Function( 'return {' + json.join( ',' ) + '}' );

            return function(){
                var defaults = literals();

                _.extend( defaults, refs );

                for( var name in init ){
                    defaults[ name ] = init[ name ].create();
                }

                return defaults;
            }
        }

        function createNativeProperties( This, spec ){
            var properties = {};

            if( spec.properties !== false ){
                _.each( spec.__attributes, function( attr, name ){
                    attr.property && ( properties[ name ] = attr.property( name ) );
                } );

                _.each( spec.properties, function( propDesc, name ){
                    properties[ name ] = _.isFunction( propDesc ) ? {
                        get: propDesc,
                        enumerable: false
                    } : _.defaults( {}, propDesc, { enumerable : false } );
                });

                _.each( properties, function( prop, name ){
                    if( name in ModelProto ||
                        name === 'cid' || name === 'id' || name === 'attributes' ){
                        Nested.error.propertyConflict( This.prototype, name );
                    }

                    Object.defineProperty( This.prototype, name, prop );
                });
            }
        }

        Model.extend = function( protoProps, staticProps ){
            var spec = parseDefaults( protoProps, this );
            var This = extend.call( this, spec, staticProps );

            var collectionSpec = { model : This };
            spec.urlRoot && ( collectionSpec.url = spec.urlRoot );
            This.Collection = this.Collection.extend( _.defaults( protoProps.collection || {}, collectionSpec ));

            createNativeProperties( This, spec );

            return This;
        };

        Model.defaults = function( attrs ){ return this.extend({ defaults : attrs }); };
        return Model;
    })();

    Nested.Collection = Nested.Model.Collection = ( function(){
        var Collection,
            CollectionProto = Backbone.Collection.prototype;

        function wrapCall( func ){
            return function(){
                if( !this.__changing++ ){
                    this.trigger( 'before:change' );
                }

                var res = func.apply( this, arguments );

                if( !--this.__changing ){
                    this.trigger( 'after:change' );
                }

				return res;
            };
        }

        Collection = Backbone.Collection.extend({
            triggerWhenChanged: 'change add remove reset sort',
            __class : 'Collection',

			model : Nested.Model,

            isValid : function( options ){
                return this.every( function( model ){
                    return model.isValid( options );
                });
            },

            deepClone: function(){
                var copy = CollectionProto.clone.call( this );

                copy.reset( this.map( function( model ){
                    return model.deepClone();
                } ) );

                return copy;
            },

            __changing: 0,

            set: wrapCall( CollectionProto.set ),
            remove: wrapCall( CollectionProto.remove ),
            add: wrapCall( CollectionProto.add ),
            reset: wrapCall( CollectionProto.reset ),
            sort: wrapCall( CollectionProto.sort ),

            getModelIds : function(){
                return _.pluck( this.models, 'id' );
            }
        });

        Collection.extend = createExtendFor( Collection );
        Collection.defaults = function( attrs ){
            return this.prototype.model.extend({ defaults : attrs }).Collection;
        };

        return Collection;
    })();

    Nested.options.Type.extend({
        isBackboneType : true,
        isModel : true,

        _name : '',
        handleNestedChange : function(){},

        properties : {
            name : {
                set : function( name ){
                    this._name = name;

                    // (!) this handler will be called in the context of model
                    this.handleNestedChange = function(){
                        var value = this.attributes[ name ];

                        if( this.__duringSet ){
                            this.__nestedChanges[ name ] = value;
                        }
                        else{
                            this.attributes[ name ] = null;
                            baseModelSet.call( this, name, value );
                        }
                    }
                },

                get : function(){
                    return this._name;
                }
            }
        },

        delegateEvents : function( model, oldValue, newValue ){
            if( this.triggerWhenChanged && oldValue !== newValue ){
                var name = this.name;

                oldValue && model.stopListening( oldValue );

                if( newValue ){
                    model.listenTo( newValue, 'before:change', model.__beginChange );
                    model.listenTo( newValue, 'after:change', model.__commitChange );
                    model.listenTo( newValue, this.triggerWhenChanged, this.handleNestedChange );

                    _.each( model.listening[ name ], function( handler, events ){
                        var callback = typeof handler === 'string' ? this[handler] : handler;
                        this.listenTo( newValue, events, callback );
                    }, this );
                }

                model.trigger( 'replace:' + name, model, newValue, oldValue );
            }
        },

        create : function( value, options ){
            return arguments.length ? new this.type( value, options ) : new this.type();
        },

        cast : function( value, options, model ){
            var incompatibleType = value != null && !( value instanceof this.type ),
                existingModelOrCollection = model.attributes[ this.name ];

            if( incompatibleType ){
                if( existingModelOrCollection ){ // ...delegate update for existing object 'set' method
                    if( options && options.parse && this.isModel ){ // handle inconsistent backbone's parse implementation
                        value = existingModelOrCollection.parse( value );
                    }

                    existingModelOrCollection.set( value, options );
                    value = existingModelOrCollection;
                }
                else{ // ...or create a new object, if it's not exist
                    value = this.create( value, options );
                }
            }

            return value;
        },

        initialize : function( spec ){
            Nested.options.Type.prototype.initialize.apply( this, arguments );
            _.isUndefined( this.triggerWhenChanged ) && ( this.triggerWhenChanged = spec.type.prototype.triggerWhenChanged );

            this.isModel = this.type.prototype instanceof Nested.Model;
        }
    }).bind( Nested.Model, Nested.Collection );

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

    Nested.Model.from = Nested.Model.From = Nested.Model.RefTo = ( function(){
        return function( masterCollection ){
            var getMaster = parseReference( masterCollection );

            return Nested.options({
                value : null,

                toJSON : function( value ){
                    return value && typeof value === 'object' ? value.id : value;
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

    Object.defineProperty( Nested, 'store', {
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
                    this.resolved = {};
                    this.installHooks();
                },
                installHooks : function(){
                    var self = this;

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
                    this.installHooks();
                    return this;
                }
            });

            Nested.Model.prototype.store = _store = new Cache();
        },

        get : function(){
            return _store;
        }
    });
}));
