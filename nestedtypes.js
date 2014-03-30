define( function( require, exports, module ){
    'use strict';

    var Backbone = require( 'backbone' );

    exports.Collection = function(){
        var CollectionProto = Backbone.Collection.prototype;

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

        return Backbone.Collection.extend({
            triggerWhenChanged: 'change add remove reset sort',

            deepClone: function(){
                var copy = CollectionProto.clone.call( this );

                copy.reset( this.map( function( model ){
                    return model.deepClone();
                }));

                return copy;
            },

            __changing: 0,
            set: wrapCall( CollectionProto.set ),
            remove: wrapCall( CollectionProto.remove ),
            add: wrapCall( CollectionProto.add ),
            reset: wrapCall( CollectionProto.reset ),
            sort: wrapCall( CollectionProto.sort )
        });
    }();

    exports.Model = function(){
        var extend = Backbone.Model.extend,
            ModelProto = Backbone.Model.prototype;

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

        var Model = Backbone.Model.extend({
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
                var copy = ModelProto.clone.call( this );

                _.each( copy.attributes, function( value, key ){
                    if( value && value.deepClone ){
                        copy.set( key, value.deepClone() );
                    }
                });

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
                });

                return res;
            },

            _: _ // add underscore to be accessible in templates
        });

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

        function createAttrPropDesc( name ){
            return {
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
                _.each( spec.defaults, function( notUsed, name ){
                    properties[ name ] = createAttrPropDesc( name );
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

        Model.extend = function( protoProps, staticProps ){
            var spec = parseDefaults( protoProps, this ),
                This = extend.call( this, spec, staticProps );

            attachNativeProperties( This, protoProps );

            return This;
        };

        return Model;
    }();
});