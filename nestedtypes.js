// Backbone.nestedTypes 0.7.1 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin & Volicon, may be freely distributed under the MIT license

( function( root, factory ){
    if( typeof define === 'function' && define.amd ) {
        define( [ 'exports', 'backbone', 'underscore' ], factory );
    }
    else if( typeof exports !== 'undefined' ){
        factory( exports, require( 'backbone' ), require( 'underscore' ) );
    }
    else{
        root.NestedTypes = {};
        factory( root.NestedTypes, root.Backbone, root._ );
    }
}( this, function( exports, Backbone, _ ){
    'use strict';
    var extend = Backbone.Model.extend;

    var error = {
        propertyConflict : function( context, name ){
            console.error( '[Type error](' + context.__class + '.extend) Property ' + name + ' conflicts with base class members' );
        },

        argumentIsNotAnObject : function( context, value ){
            console.error( '[Type Error](' + context.__class + '.set) Attribute hash is not an object:', value, 'In model:', context );
        },

        unknownAttribute : function( context, name, value ){
            console.error( '[Type Error](' + context.__class + '.set) Attribute "' + name + '" has no default value.', value, 'In model:', context );
        },

        defaultsIsFunction : function( context ){
            console.error( '[Type Error](' + context.__class + '.defaults] "defaults" must be an object, functions are not supported. In model:', context );
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
                    error.propertyConflict( This.prototype, name );
                }

                Object.defineProperty( This.prototype, name, prop );
            });

            return This;
        };
    }

    /*************************************************
        NestedTypes.Class
        - can be extended as native Backbone objects
        - can send out and listen to backbone events
        - can have native properties
     **************************************************/
    exports.Class = function(){
        function Class(){
            this.initialize.apply( this, arguments );
        }

        _.extend( Class.prototype, Backbone.Events, { __class: 'Class', initialize: function (){} } );
        Class.extend = createExtendFor( Class );

        return Class;
    }();

    /*************************************************
        NestedTypes.Model
        - extension of Backbone.Model
        - creates native properties for attributes
        - support optional type specs for attributes
        - perform dynamic types coercion and checks
        - support nested models and collections with 'change' events bubbling
        - transparent typed attributes serialization and deserialization
     **************************************************/

    exports.Attribute = function(){
        var baseModelSet =  Backbone.Model.prototype.set;

        var Attribute = exports.Class.extend({
            isBackboneType : false,
            type : null,

            property : function( name ){
                return {
                    get : function(){
                        return this.attributes[ name ];
                    },

                    set : function( value ){
                        this.set( name, value );
                        return value;
                    },

                    enumerable : false
                };
            },

            initialize : function( spec ){
                _.extend( this, spec );

                if( spec.get || spec.set ){
                    // inline property override...
                    this.property = function( name ){
                        return {
                            get : spec.get || function(){
                                return this.attributes[ name ];
                            },

                            set : spec.set || function( value ){
                                this.set( name, value );
                                return value;
                            },

                            enumerable : false
                        };
                    };
                }
            }
        });

        var PrimitiveType = Attribute.extend({
            cast : function( value ){
                return value == null ? null : this.type( value );
            }
        });

        var DateType = Attribute.extend({
            cast : function( value ){
                if( value == null || value instanceof Date ){
                    return value;
                }

                if( _.isString( value ) ){
                    value = value
                        .replace( /\.\d\d\d+/, '' )
                        .replace( /-/g, '/' )
                        .replace( 'T', ' ' )
                        .replace( /(Z)?$/, ' UTC' );
                }

                return new Date( value );
            }
        });

        var CtorType = Attribute.extend({
            cast : function( value ){
                return value == null || value instanceof this.type ? value : new this.type( value );
            }
        });

        var BackboneType = Attribute.extend({
            isBackboneType : true,

            delegateEvents : function( model, oldValue, newValue ){
                var name = this.name;

                function handleNestedChange(){
                    var value = this.attributes[ name ];

                    if( this.__duringSet ){
                        this.__nestedChanges[ name ] = value;
                    }
                    else{
                        this.attributes[ name ] = null;
                        baseModelSet.call( this, name, value );
                    }
                }

                oldValue && model.stopListening( oldValue );

                if( newValue ){
                    model.listenTo( newValue, 'before:change', model.__beforeChange );
                    model.listenTo( newValue, 'after:change', model.__afterChange );
                    model.listenTo( newValue, this.triggerWhenChanged, handleNestedChange );

                    _.each( model.listening[ name ], function( handler, events ){
                        var callback = typeof handler === 'string' ? this[ handler ] : handler;
                        this.listenTo( newValue, events, callback );
                    }, this );
                }

                model.trigger( 'replace:' + name, model, newValue, oldValue );
            },

            cast : function( value, options, model ){
                var incompatibleType = value != null && !( value instanceof this.type ),
                    existingModelOrCollection = model.attributes[ this.name ];

                if( incompatibleType ){
                    if( existingModelOrCollection ){ // ...delegate update for existing object 'set' method
                        existingModelOrCollection.set( value, options );
                        value = existingModelOrCollection;
                    }
                    else{ // ...or create a new object, if it's not exist
                        value = new this.type( value, options );
                    }
                }

                if( this.triggerWhenChanged && value !== existingModelOrCollection ){
                    this.delegateEvents( model, existingModelOrCollection, value );
                }

                return value;
            }
        });

        Attribute.create = function( spec ){
            if( arguments.length == 2 ){
                spec = {
                    type : arguments[ 0 ],
                    value : arguments[ 1 ]
                };
            }
            else if( 'typeOrValue' in spec ){
                var typeOrValue = spec.typeOrValue;
                spec = _.isFunction( typeOrValue ) ? { type : typeOrValue } : { value : typeOrValue };
            }

            if( spec.type === String || spec.type === Number || spec.type === Boolean ){
                return new PrimitiveType( spec );
            }
            else if( spec.type.prototype.triggerWhenChanged ){
                return new BackboneType( spec );
            }
            else if( spec.type === Date ){
                return new DateType( spec );
            }
            else if( _.isFunction( spec.type ) ){
                return new CtorType( spec );
            }
            else{
                return new Attribute( spec );
            }
        };

        return Attribute.create;
    }();

    exports.Model = function(){
        var ModelProto = Backbone.Model.prototype,
            originalSet = ModelProto.set,
            primitiveTypes = [String, Number, Boolean];

        var Model = Backbone.Model.extend( {
            triggerWhenChanged: 'change',
            listening: {},

            __defaults: {},
            __types: { id: null },
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

                attrs && originalSet.call( this, attrs, options );
            },

            __setMany : function( attrs, options ){
                var attrSpecs = this.__attributes;

                if( attrs.constructor !== Object ){
                    error.argumentIsNotAnObject( this, attrs );
                }

                this.__beginChange();

                for( var name in attrs ){
                    var attrSpec = attrSpecs[ name ];

                    if( attrSpec ){
                        if( attrSpec.cast ){
                            attrs[ name ] = attrSpec.cast( attrs[ name ], options, this );
                        }
                    }
                    else{
                        error.unknownAttribute( this, name, attrs[ name ] );
                    }
                }

                this.__commitChange( attrs, options );
                return this;
            },

            set: function( name, value, options ){
                if( typeof name !== 'string' ){
                    return this.__setMany( name, value );
                }

                // optimized set version for single argument
                var attrSpec = this.__attributes[ name ];

                if( attrSpec ){
                    if( attrSpec.cast ){
                        if( attrSpec.isBackboneType ){
                            var attrs = {};

                            this.__beginChange();
                            attrs[ name ] = attrSpec.cast( value, options, this );
                            this.__commitChange( attrs, options );

                            return this;
                        }
                        else{
                            value = attrSpec.cast( value );
                        }
                    }
                }
                else{
                    error.unknownAttribute( this, name, value );
                }

                return originalSet.call( this, name, value, options );
            },

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
                    res[ key ] = value && value.toJSON ? value.toJSON() : value;
                });

                return res;
            },

            isValid : function( options ){
                return ModelProto.isValid( options ) && _.every( this.attribute, function( attr ){
                    if( attr && attr.isValid ){
                        return attr.isValid( options );
                    }
                    else if( attr instanceof Date ){
                        return attr.getTime() !== NaN;
                    }
                    else{
                        return attr !== NaN;
                    }
                });
            },

            _: _ // add underscore to be accessible in templates
        } );

        function parseDefaults( spec, Base ){
            if( _.isFunction( spec.defaults ) ){
                error.defaultsIsFunction( spec );
            }

            var defaults    = _.defaults( spec.defaults || {}, Base.prototype.__defaults ),
                idAttr      = spec.idAttribute || Base.prototype.idAttribute,
                attributes = {};

            attributes[ idAttr ] = exports.Attribute( { value : undefined } );
            attributes[ idAttr ].name = idAttr;

            if( idAttr === 'id' ){
                attributes[ idAttr ].property = false;
            }

            _.each( defaults, function( attr, name ){
                attr instanceof Attribute || ( attr = exports.Attribute({ typeOrValue: attr }) );
                attr.name = name;
                if( name in Base.prototype.__defaults ){
                    attr.property = false;
                }

                attributes[ name ] = attr;
            });

            return _.extend( {}, spec, {
                __defaults  : defaults, // needed for attributes inheritance
                __attributes : attributes
            });
        }

        function createDefaults( attributes ){
            var json = [], init = {}, cast = {}, refs = {};

            _.each( attributes, function( attr, name ){
                if( attr.value !== undefined ){
                    if( attr.type ){ // when type is specified...
                        if( attr.value === null ){ // null should be directly assigned
                            json.push( name + ':' + JSON.stringify( attr.value ) );
                        }
                        else{
                            refs[ name ] = attr.value; //otherwise, it's assigned by reference

                            if( !( attr.value instanceof attr.type ) ){ // and if value has incompatible type...
                                cast[ name ] = attr.type; // it must be type-casted
                            }
                        }
                    }
                    else{ // if no type information available...
                        // ...guess if value is literal
                        if( !attr.value || typeof attr.value !== 'object' || attr.value.constructor === Object || attr.value.constructor === Array ){
                            json.push( name + ':' + JSON.stringify( attr.value ) ); // and make a deep copy
                        }
                        else{ // otherwise, copy it by reference.
                            refs[ name ] = attr.value;
                        }
                    }
                }
                else{
                    attr.type && ( init[ name ] = attr.type );
                }
            });

            var literals = new Function( 'return {' + json.join( ',' ) + '}' );

            return function(){
                var defaults = literals();

                _.extend( defaults, refs );

                for( var name in init ){
                    defaults[ name ] = new init[ name ]();
                }

                for( var name in cast ){
                    defaults[ name ] = new cast[ name ]( defaults[ name ] );
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
                        error.propertyConflict( This.prototype, name );
                    }

                    Object.defineProperty( This.prototype, name, prop );
                });
            }
        }

        function extractTypes( attributes ){
            var types = {};

            _.each( attributes, function( attr, name ){
                types[ name ] = attr.type;
            });

            return types;
        }

        Model.extend = function( protoProps, staticProps ){
            var spec = parseDefaults( protoProps, this );
            spec.defaults = createDefaults( spec.__attributes );
            spec.__types = extractTypes( spec.__attributes );

            var This = extend.call( this, spec, staticProps );

            createNativeProperties( This, spec );

            return This;
        };

        var ModelReference = Model.extend({
            __class : 'Model.RefTo',

            model : null,

            toJSON : function(){
                return this.id;
            },

            parse : function( id ){
                return { id : id };
            }
        });

        Model.RefTo = function( collectionOrFunc ){
            return Model.Attribute({
                type : ModelReference,
                property : function( name ){
                    return {
                        get : function(){
                            var ref = this.attributes[ name ];

                            if( !ref.model ){
                                var master = _.isFunction( collectionOrFunc ) ? collectionOrFunc.call( this ) : collectionOrFunc;
                                master && master.length && ( ref.model = master.get( name ) );
                            }

                            return ref.model;
                        },

                        set : function( model ){
                            var ref = this.attributes[ name ];

                            ref.model = model;
                            ref.id = model.id;
                        }
                    }
                }
            });
        };

        Model.Property = function( fun ){
            return Model.Attribute({
                type : exports.Class.extend({
                    toJSON : fun
                }),
                get : fun
            });
        };

        return Model;
    }();

    exports.Collection = function(){
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

			model : exports.Model,

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
            sort: wrapCall( CollectionProto.sort )
        });

        Collection.extend = createExtendFor( Collection );

        var refsCollectionSpec = {
            triggerWhenChanged : "add remove reset sort",
            __class : 'Collection.RefsTo',

            isResolved : false,

            toJSON : function(){
                return _.pluck( this.models, 'id' );
            },

            parse : function( raw ){
                var idName = this.model.prototype.idAttribute;
                this.isResolved = false;

                return _.map( raw, function( id ){
                    var res = {};
                    res[ idName ] = id;
                    return res;
                });
            },

            set : function( models, options ){
                _.extend( options, { merge : false } );
                CollectionProto.set.call( this, models, options );
            },

            resolve : function( collection ){
                var values = this.map( function( ref ){
                    return collection.get( ref.id );
                });

                this.reset( _.compact( values ), { silent : true } );
                this.isResolved = true;

                return this;
            }
        };

        Collection.RefsTo = function( collectionOrFunc ){
            return exports.Model.Attribute({
                type : this.extend( refsCollectionSpec ),
                property : function( name ){
                    return {
                        get : function(){
                            var refs = this.attributes[ name ],
                                master;

                            if( !refs.isResolved ){
                                master = _.isFunction( collectionOrFunc ) ? collectionOrFunc.call( this ) : collectionOrFunc;
                                master && master.length && refs.resolve( master );
                            }

                            return refs;
                        },

                        enumerable : false
                    }
                }
            });
        };

        return Collection;
    }();

    // Extend Date due to inconsistencies with Date.parse in browsers
    // http://dygraphs.com/date-formats.html
    if( !Date.fromJSON ){
        Date.fromJSON = function( value ){
            if( _.isString(value) ){
                value = value
                    .replace( /\.\d\d\d+/, '' )
                    .replace( /-/g, '/' )
                    .replace( 'T', ' ' )
                    .replace( /(Z)?$/, ' UTC' );
            }

            return new Date( value );
        };
    }

}));