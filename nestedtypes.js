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

    exports.Model = function(){
        var ModelProto = Backbone.Model.prototype,
            originalSet = ModelProto.set,
            primitiveTypes = [String, Number, Boolean];

        function delegateEvents( name, oldValue, newValue ){
            oldValue && this.stopListening( oldValue );

            if( newValue ){
                this.listenTo( newValue, 'before:change', onEnter );
                this.listenTo( newValue, 'after:change', onExit );

                this.listenTo( newValue, newValue.triggerWhenChanged, function(){
                    var value = this.attributes[ name ];

                    if( this.__duringSet ){
                        this.__nestedChanges[ name ] = value;
                    }
                    else{
                        this.attributes[ name ] = null;
                        originalSet.call( this, name, value );
                    }
                });

                _.each( this.listening[ name ], function( handler, events ){
                    var callback = typeof handler === 'string' ? this[ handler ] : handler;
                    this.listenTo( newValue, events, callback );
                }, this );
            }

            this.trigger( 'replace:' + name, this, newValue, oldValue );
        }

        function typeCastBackbone( ModelOrCollection, name, value, options ){
            var incompatibleType = value != null && !( value instanceof ModelOrCollection ),
                existingModelOrCollection = this.attributes[ name ];

            if( incompatibleType ){
                if( existingModelOrCollection ){ // ...delegate update for existing object 'set' method
                    existingModelOrCollection.set( value, options );
                    value = existingModelOrCollection;
                }
                else{ // ...or create a new object, if it's not exist
                    value = new ModelOrCollection( value, options );
                }
            }

            if( value !== existingModelOrCollection ){
                delegateEvents.call( this, name, existingModelOrCollection, value );
            }

            return value;
        }

        function onExit( attrs, options ){
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
        }

        function onEnter(){
            this.__duringSet++ || ( this.__nestedChanges = {} );
        }

        function setMany( attrs, options ){
            var types = this.__types, Ctor, value;

            if( attrs.constructor !== Object ){
                error.argumentIsNotAnObject( this, attrs );
            }

            onEnter.call( this );

            // cast values to default types...
            for( var name in attrs ){
                Ctor = types[ name ],
                value = attrs[ name ];

                if( Ctor ){
                    if( Ctor.prototype.triggerWhenChanged ){ // for models and collections...
                        attrs[ name ] = typeCastBackbone.call( this, Ctor, name, value, options );
                    }
                    else if( value != null ){
                        if( primitiveTypes.indexOf( Ctor ) > -1 ){ // use primitive types as is
                            attrs[ name ] = Ctor( value );
                        }
                        else if( !( value instanceof Ctor ) ){ // use constructor to convert to default type
                            if( Ctor.fromJSON ){ // support custom constructors
                                attrs[ name ]  = Ctor.fromJSON( value );
                            }
                            else { // use constructor to convert to default type
                                attrs[ name ]  = new Ctor( value );
                            }
                        }
                    }
                }
                else if( Ctor !== null ){
                    error.unknownAttribute( this, name, value );
                }
            }

            // apply changes
            onExit.call( this, attrs, options );

            return this;
        }

        var Model = Backbone.Model.extend( {
            triggerWhenChanged: 'change',
            listening: {},
            __duringSet: 0,
            __defaults: {},
            __types: { id: null },
            __class : 'Model',

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

            set: function( name, value, options ){
                if( typeof name !== 'string' ){
                    return setMany.call( this, name, value );
                }

                // optimized set version for single argument
                var Ctor = this.__types[ name ];

                if( Ctor ){
                    if( Ctor.prototype.triggerWhenChanged ){ // for models and collections...
                        var attrs = {};

                        onEnter.call( this );
                        attrs[ name ] = typeCastBackbone.call( this, Ctor, name, value, options );
                        onExit.call( this, attrs, options );

                        return this;
                    }
                    else if( value != null ){
                        if( primitiveTypes.indexOf( Ctor ) > -1 ){ // use primitive types as is
                            value = Ctor( value );
                        }
                        else if( !( value instanceof Ctor ) ){ // use constructor to convert to default type
                            if( Ctor.fromJSON ){ // support custom constructors
                                value  = Ctor.fromJSON( value );
                            }
                            else { // use constructor to convert to default type
                                value  = new Ctor( value );
                            }
                        }
                    }
                }
                else if( Ctor !== null ){
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

            _: _ // add underscore to be accessible in templates
        } );

        // Attribute metatype
        // ------------------
        function Attribute( spec ){
            if( 'typeOrValue' in spec ){
                var something = spec.typeOrValue;

                if( _.isFunction( something ) ){
                    this.type = something;
                }
                else{
                    this.value = something;
                }
            }
            else{
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
        }

        Attribute.prototype.type = null;
        Attribute.prototype.property = function( name ){
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
        };

        Model.Attribute = function( spec ){
            if( arguments.length == 2 ){
                spec = {
                    type : arguments[ 0 ],
                    value : arguments[ 1 ]
                };
            }

            return new Attribute( spec );
        };

        function parseDefaults( spec, Base ){
            if( _.isFunction( spec.defaults ) ){
                error.defaultsIsFunction( spec );
            }

            var defaults    = _.defaults( spec.defaults || {}, Base.prototype.__defaults ),
                idAttr      = spec.idAttribute || Base.prototype.idAttribute,
                attributes = {};

            attributes[ idAttr ] = new Attribute( { value : undefined } );

            if( idAttr === 'id' ){
                attributes[ idAttr ].property = false;
            }

            _.each( defaults, function( attr, name ){
                attr instanceof Attribute || ( attr = new Attribute({ typeOrValue: attr }) );

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