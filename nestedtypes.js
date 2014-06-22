// Backbone.nestedTypes 0.6.0 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin, may be freely distributed under the MIT license

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

    function attachNativeProperties( This, properties, Base ){
        _.each( properties, function( propDesc, name ){
            var prop = typeof propDesc === 'function' ? {
                get: propDesc,
                enumerable: false
            } : propDesc;

            if( name in Base.prototype ){
                console.error( '[Type error in Type.extend] Property ' + name + ' conflicts with base class members in spec:', properties );
            }

            Object.defineProperty( This.prototype, name, prop );
        });
    }

    function extendWithProperties( Base ){
        return function( protoProps, staticProps ){
            var This = extend.call( this, protoProps, staticProps );
            attachNativeProperties( This, protoProps.properties, Base );
            return This;
        };
    }

    exports.Class = function(){
        function Class(){
            this.initialize.apply( this, arguments );
        };

        _.extend( Class.prototype, Backbone.Events, { initialize: function (){} } );
        Class.extend = extendWithProperties( Class );

        return Class;
    }();

    exports.Model = function(){
        var extend = Backbone.Model.extend,
            ModelProto = Backbone.Model.prototype;

        function delegateEvents( name, oldValue, newValue ){
            if( oldValue ){
                this.stopListening( oldValue );
            }

            if( newValue ){
                this.listenTo( newValue, 'before:change', onEnter );
                this.listenTo( newValue, 'after:change', onExit );

                this.listenTo( newValue, newValue.triggerWhenChanged, function(){
                    var value = this.get( name );

                    if( this.__duringSet ){
                        this.__nestedChanges[ name ] = value;
                    }
                    else{
                        this.attributes[ name ] = null;
                        ModelProto.set.call( this, name, value );
                    }
                } );

                _.each( this.listening[ name ], function( handler, events ){
                    var callback = typeof handler === 'string' ? this[ handler ] : handler;
                    this.listenTo( newValue, events, callback );
                }, this );
            }

            this.trigger( 'replace:' + name, this, newValue, oldValue );
        }

        function typeCastBackbone( ModelOrCollection, name, value, options ){
            var incompatibleType = !( value == null || value instanceof ModelOrCollection ),
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

            if( attrs ){
                ModelProto.set.call( this, attrs, options );
            }
        }

        function onEnter(){
            if( !this.__duringSet++ ){
                this.__nestedChanges = {};
            }
        }

        var Model = Backbone.Model.extend( {
            triggerWhenChanged: 'change',
            listening: {},
            __duringSet: 0,
            __defaults: {},
            __types: { id: null },

            __setMany : function( attrs, options ){
                var types = this.__types, Ctor, value;

                if( attrs.constructor !== Object ){
                    console.error( '[Type Error in Model.set] Attribute hash is not an object:', attrs, 'In model:', this );
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
                        else if( value != null && !( value instanceof Ctor ) ){ // use constructor to convert to default type
                            attrs[ name ]  = new Ctor( value );
                        }
                    }
                    else if( Ctor !== null ){
                        console.error( '[Type Error in Model.set] Attribute "' + name + '" has no default value.', attrs, 'In model:', this );
                    }
                }

                // apply changes
                onExit.call( this, attrs, options );

                return this;
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

            set: function( name, value, options ){
                var attrs, Ctor;

                if( typeof name !== 'string' ){
                    return this.__setMany( name, value );
                }

                // optimized set version for single argument
                Ctor = this.__types[ name ];

                if( Ctor ){
                    if( Ctor.prototype.triggerWhenChanged ){
                        onEnter.call( this );
                        ( attrs = {} )[ name ] = typeCastBackbone.call( this, Ctor, name, value, options );
                        onExit.call( this, attrs, options );

                        return this;
                    }
                    else if( value != null && !( value instanceof Ctor ) ){
                        value = new Ctor( value );
                    }
                }
                else if( Ctor !== null ){
                    console.error( '[Type Error in Model.set] Attribute "' + name + '" has no default value.', value, 'In model:', this );
                }

                return ModelProto.set.call( this, name, value, options );
            },

            // Create deep copy for all nested objects...
            deepClone: function(){
                var copy = ModelProto.clone.call( this );

                _.each( copy.attributes, function( value, key ){
                    if( value && value.deepClone ){
                        copy.set( key, value.deepClone() );
                    }
                } );

                return copy;
            },

            // Support for nested models and objects.
            // Apply toJSON recursively to produce correct JSON.
            toJSON: function(){
                var res = ModelProto.toJSON.apply( this, arguments );

                _.each( res, function( value, key ){
                    if( value && value.toJSON ){
                        res[ key ] = value.toJSON();
                    }
                } );

                return res;
            },

            _: _ // add underscore to be accessible in templates
        } );

        function parseDefaults( spec, Base ){
            var defaults    = _.defaults( spec.defaults || {}, Base.prototype.__defaults ),
                fnames      = _.functions( defaults ),
                values      = _.omit( defaults, fnames ),
                ctors       = _.pick( defaults, fnames ),
                idAttr      = spec.idAttribute || Base.prototype.idAttribute,
                types       = {};

            types[ idAttr ] = null;

            _.each( defaults, function( value, name ){
                types[ name ] = _.isFunction( value ) ? value : null;
            });

            return _.extend( {}, spec, {
                defaults    : createDefaults( values, ctors ),
                __defaults  : defaults,
                __types     : types
            });
        }

        function createDefaults( values, ctors ){
            return function(){
                var defaults = _.clone( values );

                for( var name in ctors ){
                    defaults[ name ] = new ctors[ name ]();
                }

                return defaults;
            };
        }

        function createAttrPropDesc( name, type ){
            return _.isFunction( type ) && type.property ?
                type.property( name ) : {
                    get: function(){
                        return this.attributes[ name ];
                    },

                    set: function( val ){
                        this.set( name, val );
                        return val;
                    },

                    enumerable: false
                };
        }

        function attachNativeProperties( This, spec ){
            var properties = {};

            if( spec.properties !== false ){
                _.each( spec.defaults, function( type, name ){
                    properties[ name ] = createAttrPropDesc( name, type );
                } );

                _.each( spec.properties, function( propDesc, name ){
                    properties[ name ] = typeof propDesc === 'function' ? {
                        get: propDesc,
                        enumerable: false
                    } : propDesc;
                } );

                _.each( properties, function( prop, name ){
                    if( name in ModelProto ||
                        name === 'cid' || name === 'id' || name === 'attributes' ){
                        console.error( '[Type Error in Model.extend] Attribute ' + name + ' conflicts with Backbone.Model base class members in model:', spec );
                    }

                    Object.defineProperty( This.prototype, name, prop );
                } );
            }
        }

        Model.extend = function( protoProps, staticProps ){
            var spec = parseDefaults( protoProps, this ),
                This = extend.call( this, spec, staticProps );

            attachNativeProperties( This, protoProps );

            return This;
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

                func.apply( this, arguments );

                if( !--this.__changing ){
                    this.trigger( 'after:change' );
                }
            };
        }

        Collection = Backbone.Collection.extend({
            triggerWhenChanged: 'change add remove reset sort',

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

            set: function( value ){
                if( !this.__changing++ ){
                    this.trigger( 'before:change' );
                }

                if( !( typeof( value ) === 'undefined' || value.constructor === Array || value instanceof this.model || value.constructor === Object ) ){
                    console.error( '[Type Error in Collection.set] Argument is not an array, compatible model, or attribute hash:', value, 'In collection:', this );
                }

                CollectionProto.set.apply( this, arguments );

                if( !--this.__changing ){
                    this.trigger( 'after:change' );
                }
            },

            remove: wrapCall( CollectionProto.remove ),
            add: wrapCall( CollectionProto.add ),
            reset: wrapCall( CollectionProto.reset ),
            sort: wrapCall( CollectionProto.sort )
        });

        Collection.extend = extendWithProperties( Collection );

        var refsCollectionSpec = {
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
            return this.extend( refsCollectionSpec, {
                property : function( name ){
                    return {
                        get : function(){
                            var refs = this.attributes[ name ],
                                master;

                            if( !refs.isResolved ){
                                master = _.isFunction( collectionOrFunc ) ? collectionOrFunc.call( this ) : collectionOrFunc;
                                master && refs.resolve( master );
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
}));