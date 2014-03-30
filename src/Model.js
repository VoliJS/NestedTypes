define( function( require, exports, module ){
    'use strict';
    var Chaplin = require( "chaplin" ),
        extend = Chaplin.Model.extend,
        ModelProto = Chaplin.Model.prototype;


    /* CORE BACKBONE MODELS EXTENSIONS. CHANGE CAREFULLY!

     Native properties
     =================================================
      - native ECMAScript5 properties are being generated for all attributes mentioned in defaults;
      - custom properties can be added to the model using 'properties' section;
      - custom properties definitions overrides attribute's properties.
      - TypeError exception is being thrown on clash with Backbone.Model members.

     Defaults section inheritance
     ============================
      - default values are being inherited from the base class.

     Type specs in defaults
     ======================
     Type (constructor function) may be specified as default value of an attribute. In this case:
     - When new model is created, attribute will be initialized with a new instance of the specified type.
     - Attribute can be set to null or subtype of the specified type.
     - When attribute is being set with value of different type, new instance of the specified type will be
        created with the given value as an argument.
     - Typed attributes are being parsed and serialized automatically. No coding required.

     Backbone models and collections
     -------------------------------
     Backbone.Model and Backbone.Collection subtypes can be used in attribute type specs. This attribute:
     - initialized to the default model or collection of specified type on creation.
     - can be set to null or subclass of the specified model or collection.
     - When attribute is being set with value of different type, nested model's or collection's 'set' method will
        be called instead, with the given value as an argument.
     - 'change:attribute' and 'change' events will be triggered on nested model or collection change.
     - Nested models and collections are being parsed and serialized automatically.
     - Nested models and collections will be kepts during fetch.
     */

    function delegateEvents( name, oldValue, newValue ){
        if( oldValue && oldValue.triggerWhenChanged ){
            this.stopListening( oldValue );
            this.trigger( 'listening:off', name, oldValue );
        }

        if( newValue && newValue.triggerWhenChanged ){
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
            });

            _.each( this.listening[ name ], function( handler, events ){
                var callback = typeof handler === 'string' ? this[ handler ] : handler;
                this.listenTo( newValue, events, callback );
            }, this );

            this.trigger( 'listening:on', name, newValue );
        }
    }

    function typeCast( Ctor, name, value ){
        var oldValue = this.attributes[ name ],
            valueHasOtherType = value && !( value instanceof Ctor ),
            newValue;

        if( oldValue && oldValue.set && valueHasOtherType ){
            oldValue.set( value );
            newValue = oldValue;
        }
        else{
            newValue = valueHasOtherType ? new Ctor( value ) : value;
            delegateEvents.call( this, name, oldValue, newValue );
        }

        return newValue;
    }

    function onExit( a_attrs, options ){
        var attrs = a_attrs || {};

        if( !--this.__duringSet ){
            _.each( this.__nestedChanges, function( value, name ){
                attrs[ name ] = value;
                this.attributes[ name ] = null;
            }, this );

            this.__nestedChanges = {};

            ModelProto.set.call( this, attrs, options );
        }
    }

    function onEnter(){
        if( !this.__duringSet++ ){
            this.__nestedChanges = {};
        }
    }

    Chaplin.Model.extend = function( protoProps, staticProps ){
        var spec = parseDefaults( protoProps, this ),
            This = extend.call( this, spec, staticProps );

        attachNativeProperties( This, protoProps );

        return This;
    };

    function parseDefaults( spec, Base ){
        var defaults    = _.defaults( spec.defaults || {}, Base.prototype.__defaults ),
            fnames      = _.functions( defaults ),
            values      = _.omit( defaults, fnames ),
            types       = _.pick( defaults, fnames );

        return _.defaults({
            defaults    : createDefaults( values, types ),
            __defaults  : defaults,
            __types     : types
        }, spec );
    }

    function createDefaults( values, ctors ){
        return function(){
            var defaults = _.clone( values );

            _.each( ctors, function( Ctor, name ){
                defaults[ name ] = new Ctor();
            });

            return defaults;
        };
    }

    function attachNativeProperties( This, spec ){
        var properties = {};

        if( spec.properties !== false ){
            _.each( spec.defaults, function( notUsed, name ){
                properties[ name ] = {
                    get: function(){
                        return this.get( name );
                    },
                    set: function( val ){
                        this.set( name, val );
                        return val;
                    },
                    enumerable: false
                };
            });

            _.each( spec.properties, function( propDesc, name ){
                properties[ name ] = typeof propDesc === 'function' ? {
                    get: propDesc,
                    enumerable: false
                } : propDesc;
            });

            _.each( properties, function( prop, name ){
                if( name in ModelProto ||
                    name === 'cid' || name === 'id' || name === 'attributes' ){
                    throw new TypeError( 'extend: attribute ' + name + ' conflicts with Backbone.Model base class members!' );
                }

                Object.defineProperty( This.prototype, name, prop );
            });
        }
    }

    module.exports = Chaplin.Model.extend({
        triggerWhenChanged: 'change',
        listening: {},
        __duringSet: 0,
        __defaults: {},
        __types: {},

        set: function( first, second, third ){
            // handle different call options...
            var attrs, options, types = this.__types;

            if( typeof first === 'string' ){
                ( attrs = {} )[ first ] = second;
                options = third;
            }
            else{
                attrs = first;
                options = second;
            }

            onEnter.call( this );

            // cast values to default types...
            _.each( attrs, function( value, name ){
                var Ctor = types[ name ];

                if( Ctor ){
                    attrs[ name ] = typeCast.call( this, Ctor, name, value );
                }
            }, this );

            // apply changes
            onExit.call( this, attrs, options );

            return this;
        },

        // Create deep copy for all nested objects...
        deepClone: function(){
            var newOne = ModelProto.clone.call( this );

            _.each( newOne.attributes, function( value, key ){
                if( value && value.deepClone ){
                    // pass merge:false to force replacement of the nested model
                    newOne.set( key, value.deepClone(), { merge: false } );
                }
            });

            return newOne;
        },

        // Support for nested models and objects.
        // Apply toJSON recursively to produce correct JSON.
        toJSON: function(){
            var res = ModelProto.toJSON.apply( this, arguments );

            _.each( res, function( value, key ){
                if( value && value.toJSON ){
                    res[ key ] = value.toJSON();
                }
            });

            return res;
        },

		_: _ // add underscore to be accessible in templates
    });
});