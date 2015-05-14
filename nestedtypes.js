// Backbone.nestedTypes 0.10.0 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin & Volicon, may be freely distributed under the MIT license

// Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
// © 2011 Colin Snover <http://zetafleet.com>
// Released under MIT license.

( function( root, factory ){
    // Mock for missing Integer data type...
    // -------------------------------------
    root.Integer = function( x ){ return x ? Math.round( x ) : 0; };

    // Object extensions: backbone-style OO functions and helpers...
    // -------------------------------------------------------------
    JSON.isValid = function( value ){
        var type = typeof value,
            isJSON = value === null || type === 'number' || type === 'string' || type === 'boolean';

        if( !isJSON && type === 'object' ){
            var proto = Object.getPrototypeOf( value );

            if( proto === Object.prototype || proto === Array.prototype ){
                isJSON = Object.every( value, JSON.isValid );
            }
        }

        return isJSON;
    };

    ( function( spec ){
        for( var name in spec ){
            Object[ name ] || Object.defineProperty( Object, name, {
                enumerable: false,
                configurable: true,
                writable: true,
                value: spec[ name ]
            });
        }
    })({
        each : function( source, fun, context ){
            var res;

            for( var name in source ){
                if( source.hasOwnProperty( name ) ){
                    res = fun.call( context, source[ name ], name );
                    if( res !== void 0 ){
                        return res;
                    }
                }
            }

            return res;
        },

        every : function( source, fun, context ){
            for( var name in source ){
                if( source.hasOwnProperty( name ) ){
                    if( !fun.call( context, source[ name ], name ) ){
                        return false;
                    }

                }
            }

            return true;
        },

        assign : function( target, firstSource ){
            if( target == null ){
                throw new TypeError( 'Cannot convert first argument to object' );
            }

            var to = Object( target );
            for( var i = 1; i < arguments.length; i++ ){
                var nextSource = arguments[ i ];
                if( nextSource == null ){
                    continue;
                }

                var keysArray = Object.keys( Object( nextSource ) );
                for( var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++ ){
                    var nextKey = keysArray[ nextIndex ];
                    var desc    = Object.getOwnPropertyDescriptor( nextSource, nextKey );
                    if( desc !== void 0 && desc.enumerable ){
                        to[ nextKey ] = nextSource[ nextKey ];
                    }
                }
            }
            return to;
        },

        transform : function( dest, source, fun, context ){
            for( var name in source ){
                if( source.hasOwnProperty( name ) ){
                    var value = fun.call( context, source[ name ], name );
                    typeof value === 'undefined' || ( dest[ name ] = value );
                }
            }

            return dest;
        },

        getPropertyDescriptor : function( obj, prop ){
            for( var desc; !desc && obj; obj = Object.getPrototypeOf( obj ) ){
                desc = Object.getOwnPropertyDescriptor( obj, prop );
            }

            return desc;
        },

        extend : (function(){
            var error = {
                overrideMethodWithValue : function( Ctor, name, value ){
                    console.warn( '[Type Warning] Base class method overriden with value in Object.extend({ ' + name + ' : ' + value + ' }); Object =', Ctor.prototype );
                }
            };

            function Class(){
                this.initialize.apply( this, arguments );
            }

            // Backbone-style extend with native properties and late definition support
            function extend( protoProps, staticProps ){
                var Parent = this === Object ? Class : this,
                    Child;

                if( typeof protoProps === 'function' ){
                    Child      = protoProps;
                    protoProps = null;
                }
                else if( protoProps && protoProps.hasOwnProperty( 'constructor' ) ){
                    Child = protoProps.constructor;
                }
                else{
                    Child = function Constructor(){ return Parent.apply( this, arguments ); };
                }

                Object.assign( Child, Parent );

                Child.prototype             = Object.create( Parent.prototype );
                Child.prototype.constructor = Child;
                Child.__super__             = Parent.prototype;

                protoProps && Child.define( protoProps, staticProps );

                return Child;
            }

            function warnOnError( value, name ){
                var prop = Object.getPropertyDescriptor( this.prototype, name );

                if( prop ){
                    var baseIsFunction  = typeof prop.value === 'function',
                        valueIsFunction = typeof value === 'function';

                    if( baseIsFunction && !valueIsFunction ){
                        error.overrideMethodWithValue( this, name, prop );
                    }
                }

                return value;
            }

            function preparePropSpec( spec, name ){
                var prop = Object.getPropertyDescriptor( this.prototype, name );

                if( prop && typeof prop.value === 'function' ){
                    error.overrideMethodWithValue( this, name, prop );
                }

                return spec instanceof Function ? { get : spec } : spec;
            }

            function define( protoProps, staticProps, mixinProps ){
                Object.transform( this.prototype, protoProps,  warnOnError, this );
                Object.transform( this,           staticProps, warnOnError, this );

                mixinProps && Object.defineProperties( this.prototype, Object.transform( {}, mixinProps, preparePropSpec, this ) );
                protoProps && Object.defineProperties( this.prototype, Object.transform( {}, protoProps.properties, preparePropSpec, this ) );

                return this;
            }

            extend.attach = function(){
                for( var i = 0; i < arguments.length; i++ ){
                    var Ctor = arguments[ i ];

                    Ctor.extend = extend;
                    Ctor.define = define;
                    Ctor.prototype.initialize || ( Ctor.prototype.initialize = function(){} );
                }
            };

            extend.attach( Class );
            extend.Class = Class;
            extend.error = error;

            return extend;
        })()
    });

    // Universal module adapter
    // ------------------------
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
    'use strict';

    // Override Backbone Events.listenTo to support message maps...
    Backbone.Events.listenTo =
        ( function( baseListenTo ){
            return function( source, events ){
                if( typeof events === 'object' ){
                    _.each( events, function( handler, name ){
                        baseListenTo.call( this, source, name, handler );
                    }, this );
                }
                else{
                    baseListenTo.apply( this, arguments );
                }
            };
        })( Backbone.Events.listenTo );

    // Make Object.extend classes capable of sending and receiving Backbone Events...
    Object.assign( Object.extend.Class.prototype, Backbone.Events );

    // Override Backbone's objects .extend and .listenTo...
    [ 'Model', 'Collection', 'View', 'Router', 'History' ].forEach( function( name ){
        var BackboneType = Backbone[ name ];
        Object.extend.attach( BackboneType );
        BackboneType.prototype.listenTo = Backbone.Events.listenTo;
    });

    Nested.Class = Object.extend.Class;

    // Extend Object+ type errors with NestedTypes specific error types...
    Nested.error = Object.assign( Object.extend.error, {
        argumentIsNotAnObject : function( context, value ){
            console.error( '[Type Error] Attribute hash is not an object in ' + context.__class + '.set(', value, '); this =', context );
        },

        unknownAttribute : function( context, name, value ){
            context.suppressTypeErrors || console.error( '[Type Error] Attribute has no default value in ' + context.__class + '.set( "' + name + '",', value, '); this =', context );
        },

        wrongCollectionSetArg : function( context, value ){
            console.error( '[Type Error] Wrong argument type in ' + context.__class + '.set(', value, '); this =', context );
        }
    });

    // Attribute Metatypes Definitions
    // -------------------------------

    Nested.options = ( function(){
        function chainHooks( first, second ){
            return function( value, name ){
                return second.call( this, first.call( this, value, name ), name );
            };
        }

        var Attribute = Object.extend({
            type : null,

            create : function(){
                return new this.type();
            },

            clone : function( value, options ){
                if( value && typeof value === 'object' ){
                    var proto = Object.getPrototypeOf( value );

                    if( proto === Object.prototype || proto === Array.prototype ){
                        return JSON.parse( JSON.stringify( value ) );
                    }
                    else if( value.clone ){
                        return value.clone( options );
                    }
                }

                return value;
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
                    return get.call( this, this.attributes[ name ], name );
                } : function(){
                    return this.attributes[ name ];
                };

                return spec;
            },

            options : function( spec ){
                if( spec.get && this.get ){
                    spec.get = chainHooks( this.get, spec.get );
                }
                if( spec.set && this.set ){
                    spec.set = chainHooks( this.set, spec.set );
                }
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
            },
            clone : function( value ){
                return this.cast( JSON.parse( JSON.stringify( value ) ) );
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
                return value == null || value instanceof Date ? value :
                    new Date( typeof value === 'string' ? parseDate( value ) : value )
            },

            clone : function( value ){ return new Date( +value ); }
        }).bind( Date );
    })();

    // Fix incompatible constructor behaviour of primitive types...
    Nested.options.Type.extend({
        create : function(){
            return this.type();
        },

        cast : function( value ){
            return value == null ? null : this.type( value );
        },
        clone : function( value ){ return value; }
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

        var Model = Backbone.Model.extend({
            triggerWhenChanged: 'change',

            __defaults: {},
            __attributes: { id : Nested.options({ name: 'id', value : undefined }) },
            __class : 'Model',

            __duringSet: 0,

            defaults : function(){ return {}; },
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
                if( Object.getPrototypeOf( attrs ) !== Object.prototype ){
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
                            value = attrSpec.set.call( this, value, name );
                            if( value === undefined ){
                                delete attrs[ name ];
                                continue;
                            }
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
                        value = attrSpec.set.call( this, value, name );
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

                for( var i = 0; value && i < l; i++ ){
                    value = value.get ? value.get( path[ i ] ) : value[ path[ i ] ];
                }

                return value;
            },

            deepSet : function( name, value, options ){
                var path = name.split( '.' ),
                    l = path.length - 1,
                    model = this,
                    attr = path[ l ];

                for( var i = 0; i < l; i++ ){
                    var next = model.get ? model.get( path[ i ] ) : model[ path[ i ] ];
                    if( !next ){
                        if( model.defaults ){
                            var newModel = model.__attributes[ path[ i ] ].create();
                            if( options && options.nullify && newModel.defaults ){
                                var nulls = newModel.defaults();
                                _.each( nulls, function( spec, name ){
                                    nulls[ name ] = null;
                                });
                                newModel.set( nulls );
                            }
                            model.set( path[ i ], newModel );
                            next = model.get( path[ i ] );
                        }else{
                            return;
                        }
                    }
                    model = next;
                }

                return model.set ? model.set( attr, value, options ) : model[ attr ] = value;
            },

            constructor : function(attributes, options){
                var attrs       = attributes || {};
                options || (options = {});
                this.cid        = _.uniqueId( 'c' );
                this.attributes = {};
                if( options.collection ) this.collection = options.collection;
                if( options.parse ) attrs = this.parse( attrs, options ) || {};
                attrs        = _.defaults( {}, attrs, this.defaults( options ) );
                this.set( attrs, options );
                this.changed = {};
                this.initialize.apply( this, arguments );
            },
            // override get to invoke native getter...
            get : function( name ){ return this[ name ]; },

            clone : function( options ){
                var attrs;

                if( options && options.deep ){
                    attrs = {};

                    _.each( this.attributes, function( value, key ){
                        var spec = this.__attributes[ key ];
                        spec && ( attrs[ key ] = spec.clone( value, options ) );
                    }, this );
                }
                else{
                    attrs = this.attributes;
                }

                return new this.constructor( attrs, options );
            },
            // Create deep copy for all nested objects...
            deepClone: function( options ){ return this.clone({ deep : true }); },

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
        },{
            defaults : function( attrs ){ return this.extend({ defaults : attrs }); },

            extend : function( protoProps, staticProps ){
                var This = Object.extend.call( this );
                This.Collection = this.Collection.extend();
                return protoProps ? This.define( protoProps, staticProps ) : This;
            },

            define : function( protoProps, staticProps ){
                var Base = Object.getPrototypeOf( this.prototype ).constructor,
                    spec = parseDefaults( protoProps, Base ),
                    This = this;

                Object.extend.Class.define.call( This, spec, staticProps, createNativeProperties( This, spec ) );

                var collectionSpec = { model : This };
                spec.urlRoot && ( collectionSpec.url = spec.urlRoot );
                This.Collection.define( _.defaults( protoProps.collection || {}, collectionSpec ) );

                return This;
            }
        });

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

        function createDefaults( attributes ){
            var json = [], init = {}, refs = {};

            _.each( attributes, function( attr, name ){
                if( attr.value !== undefined ){
                    if( JSON.isValid( attr.value ) ){
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

            return function( options ){
                if( options && ( options.collection || options.parse ) ){
                    options = _.omit( options, 'collection', 'parse' );
                }

                var defaults = literals();

                _.extend( defaults, refs );

                for( var name in init ){
                    defaults[ name ] = init[ name ].create( null, options );
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

                return properties;
            }
        }

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
            triggerWhenChanged: 'change add remove reset', // sort
            __class : 'Collection',

			model : Nested.Model,

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
                    if( typeof models !== 'object' || !(
                        models instanceof Array || models instanceof Nested.Model || Object.getPrototypeOf( models ) === Object.prototype ) ){
                        Nested.error.wrongCollectionSetArg( this, models );
                    }
                }
                return CollectionProto.set.call( this, models, options );
            }),
            remove: wrapCall( CollectionProto.remove ),
            add: wrapCall( CollectionProto.add ),
            reset: wrapCall( CollectionProto.reset ),
            sort: wrapCall( CollectionProto.sort ),

            getModelIds : function(){
                return _.pluck( this.models, 'id' );
            }
        },{
            defaults : function( attrs ){
                return this.prototype.model.extend({ defaults : attrs }).Collection;
            }
        });

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

                    this.events && model.listenTo( newValue, this.events );
                }

                model.trigger( 'replace:' + name, model, newValue, oldValue );
            }
        },

        create : function( value, options ){
            return new this.type( value, options );
        },

        clone : function( value, options ){ return value && value.clone( options ); },
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
            var getMaster = parseReference( masterCollection ), attrSpec;

            function clone( value ){
                return value && typeof value === 'object' ? value.id : value;
            }
            return attrSpec = Nested.options({
                value : null,

                toJSON : clone,
                clone : clone,

                get : function( objOrId, name ){

                            if( typeof objOrId !== 'object' ){
                                var master = getMaster.call( this );

                                if( master && master.length ){
                                    objOrId = master.get( objOrId ) || null;
                            this.attributes[ name ] = objOrId;
                            objOrId && attrSpec.events && this.listenTo( objOrId, attrSpec.events );
                                }
                                else{
                                    objOrId = null;
                                }
                            }

                            return objOrId;
                        },

                set : function( modelOrId, name ){
                    var current = this.attributes[ name ];
                    if( typeof modelOrId !== 'object' ){
                        if( current && typeof current === 'object' && current.id === modelOrId ) return;
                    }
                    else if( attrSpec.events && modelOrId ){
                        this.listenTo( modelOrId, attrSpec.events );
                    }
                    if( current && typeof current === 'object' ){
                        this.stopListening( current );
                        }

                    return modelOrId;
                }
            });
        };
    })();

    Nested.Collection.SubsetOf = Nested.Collection.subsetOf = Nested.Collection.RefsTo = ( function(){
        var CollectionProto = Nested.Collection.prototype;

        var refsCollectionSpec = {
            triggerWhenChanged : "add remove reset",
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
            var SubsetOf = this._subsetOf || ( this._subsetOf = this.extend( refsCollectionSpec ) );
            var getMaster = parseReference( masterCollection );

            return Nested.options({
                type : SubsetOf,

                get : function( refs ){
                    !refs || refs.resolvedWith || refs.resolve( getMaster.call( this ) );
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
