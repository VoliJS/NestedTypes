(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("underscore"), require("jquery"));
	else if(typeof define === 'function' && define.amd)
		define(["underscore", "jquery"], factory);
	else if(typeof exports === 'object')
		exports["Nested"] = factory(require("underscore"), require("jquery"));
	else
		root["Nested"] = factory(root["_"], root["$"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_6__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	// NestedTypes namespace
	// =======================
	
	var Model      = __webpack_require__( 1 ),
	    Collection = __webpack_require__( 10 ),
	    relations  = __webpack_require__( 11 ),
	    Backbone   = __webpack_require__( 2 ),
	    _          = __webpack_require__( 5 ),
	    attribute  = __webpack_require__( 9 );
	
	__webpack_require__( 12 );
	
	Collection.subsetOf = relations.subsetOf;
	Model.from          = relations.from;
	Model.take = Collection.take = relations.take;
	
	Model.Collection    = Collection;
	
	var Store = __webpack_require__( 13 );
	Object.defineProperty( exports, 'store', Store.globalProp );
	
	_.extend( exports, Backbone, {
	    Backbone  : Backbone,
	    Class     : __webpack_require__( 3 ),
	    error     : __webpack_require__( 8 ),
	    attribute : attribute,
	    options   : attribute,
	
	    value : function( value ){
	        return attribute( { value : value } );
	    },
	
	    parseReference : relations.parseReference,
	
	    Collection : Collection,
	    Model      : Model,
	    Store      : Store.Model,
	    LazyStore  : Store.Lazy,
	
	    defaults : function( x ){
	        return Model.defaults( x );
	    },
	
	    transaction : function( fun ){
	        return function(){
	            return this.transaction( fun, this, arguments );
	        }
	    }
	});
	
	function linkToProp( name ){
	    return {
	        get : function(){ return Backbone[ name ]; },
	        set : function( value ){ Backbone[ name ] = value; }
	    }
	}
	
	// allow sync and jQuery override
	Object.defineProperties( exports, {
	    'sync' : linkToProp( 'sync' ),
	    '$'    : linkToProp( '$' ),
	    'ajax' : linkToProp( 'ajax' )
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone    = __webpack_require__( 2 ),
	    BaseModel   = Backbone.Model,
	    modelSet    = __webpack_require__( 7 ),
	    attrOptions = __webpack_require__( 9 ),
	    error       = __webpack_require__( 8 ),
	    _           = __webpack_require__( 5 ),
	    ModelProto  = BaseModel.prototype;
	
	var setSingleAttr = modelSet.setSingleAttr,
	    setAttrs        = modelSet.setAttrs,
	    applyTransform  = modelSet.transform;
	
	function cloneAttrs( attrSpecs, attrs, options ){
	    for( var name in attrs ){
	        attrs[ name ] = attrSpecs[ name ].clone( attrs[ name ], options );
	    }
	
	    return attrs;
	}
	
	var Model = BaseModel.extend( {
	    triggerWhenChanged : 'change',
	
	    properties : {
	        id : {
	            get : function(){
	                var name = this.idAttribute;
	
	                // TODO: get hook doesn't work for idAttribute === 'id'
	                return name === 'id' ? this.attributes.id : this[ name ];
	            },
	
	            set : function( value ){
	                var name = this.idAttribute;
	                setSingleAttr( this, name, value, this.__attributes[ name ] );
	            }
	        }
	    },
	
	    getStore : function(){
	        var owner = this._owner || this.collection;
	        return owner ? owner.getStore() : this._defaultStore;
	    },
	
	    getOwner : function(){
	        return this._owner || ( this.collection && this.collection._owner );
	    },
	
	    sync : function(){
	        var store = this.getStore() || Backbone;
	        return store.sync.apply( this, arguments );
	    },
	
	    _owner : null,
	
	    __attributes : { id : attrOptions( { value : undefined } ).createAttribute( 'id' ) },
	    __class      : 'Model',
	
	    __duringSet : 0,
	
	    defaults : function(){ return {}; },
	
	    __begin  : modelSet.__begin,
	    __commit : modelSet.__commit,
	
	    transaction : modelSet.transaction,
	
	    set : function( a, b, c ){
	        switch( typeof a ){
	        case 'string' :
	            var attrSpec = this.__attributes[ a ];
	
	            if( attrSpec && !attrSpec.isBackboneType && !c ){
	                return setSingleAttr( this, a, b, attrSpec );
	            }
	
	            var attrs = {};
	            attrs[ a ] = b;
	            return setAttrs( this, attrs, c );
	
	        case 'object' :
	            if( a && Object.getPrototypeOf( a ) === Object.prototype ){
	                return setAttrs( this, a, b );
	            }
	
	        default :
	            error.argumentIsNotAnObject( this, a );
	        }
	    },
	
	    // Return model's value for dot-separated 'deep reference'.
	    // Model id and cid are allowed for collection elements.
	    // If path is not exist, 'undefined' is returned.
	    // model.deepGet( 'a.b.c123.x' )
	    deepGet : function( name ){
	        var path = name.split( '.' ), value = this;
	
	        for( var i = 0, l = path.length; value && i < l; i++ ){
	            value = value.get ? value.get( path[ i ] ) : value[ path[ i ] ];
	        }
	
	        return value;
	    },
	
	    // Set model's value for dot separated 'deep reference'.
	    // If model doesn't exist at some path, create default models
	    // if options.nullify is given, assign attributes with nulls
	    deepSet : function( name, value, options ){
	        var path  = name.split( '.' ),
	            l     = path.length - 1,
	            model = this,
	            attr  = path[ l ];
	
	        for( var i = 0; i < l; i++ ){
	            var current = path[ i ],
	                next    = model.get ? model.get( current ) : model[ current ];
	
	            // Create models in path, if they are not exist.
	            if( !next ){
	                var attrSpecs = model.__attributes;
	
	                if( attrSpecs ){
	                    // If current object is model, create default attribute
	                    var newModel = attrSpecs[ current ].create( options );
	
	                    // If created object is model, nullify attributes when requested
	                    if( options && options.nullify && newModel.__attributes ){
	                        var nulls = new newModel.Attributes( {} );
	                        for( var key in nulls ){
	                            nulls[ key ] = null;
	                        }
	                        newModel.set( nulls );
	                    }
	
	                    model[ current ] = next = newModel;
	                }
	                else{
	                    return;
	                } // silently fail in other case
	            }
	            model = next;
	        }
	
	        return model.set ? model.set( attr, value, options ) : model[ attr ] = value;
	    },
	
	    constructor : function( attributes, opts ){
	        var attrSpecs = this.__attributes,
	            attrs     = attributes || {},
	            options   = opts || {};
	
	        this.__duringSet = 0;
	        this.attributes = {};
	        if( options.collection ) this.collection = options.collection;
	        this.cid = _.uniqueId( 'c' );
	
	        if( options.parse ){
	            attrs = this.parse( attrs, options ) || {};
	        }
	
	        if( typeof attrs !== 'object' || Object.getPrototypeOf( attrs ) !== Object.prototype ){
	            error.argumentIsNotAnObject( this, attrs );
	            attrs = {};
	        }
	
	        attrs = options.deep ?
	                cloneAttrs( attrSpecs, new this.Attributes( attrs ), options ) :
	                this.defaults( attrs, options );
	
	        // Execute attributes transform function instead of this.set
	        applyTransform( this, attrs, attrSpecs, options );
	
	        this.attributes = attrs;
	        this.changed = {};
	        this.initialize.apply( this, arguments );
	    },
	    // override get to invoke native getter...
	    get         : function( name ){ return this[ name ]; },
	
	    // override clone to pass options to constructor
	    clone : function( options ){
	        return new this.constructor( this.attributes, options );
	    },
	
	    // Create deep copy for all nested objects...
	    deepClone : function(){ return this.clone( { deep : true } ); },
	
	    // Support for nested models and objects.
	    // Apply toJSON recursively to produce correct JSON.
	    toJSON : function(){
	        var res   = {},
	            attrs = this.attributes, attrSpecs = this.__attributes;
	
	        for( var key in attrs ){
	            var value  = attrs[ key ], attrSpec = attrSpecs[ key ],
	                toJSON = attrSpec && attrSpec.toJSON;
	
	            if( toJSON ){
	                res[ key ] = toJSON.call( this, value, key );
	            }
	        }
	
	        return res;
	    },
	
	    parse  : function( resp ){ return this._parse( resp ); },
	    _parse : _.identity,
	
	    isValid : function( options ){
	        // todo: need to do something smart with validation logic
	        // something declarative on attributes level, may be
	        return ModelProto.isValid.call( this, options ) && _.every( this.attributes, function( attr ){
	                if( attr && attr.isValid ){
	                    return attr.isValid( options );
	                }
	
	                return attr instanceof Date ? !_.isNaN( attr.getTime() ) : !_.isNaN( attr );
	            } );
	    },
	
	    _ : _ // add underscore to be accessible in templates
	}, {
	    // shorthand for inline nested model definitions
	    defaults : function( attrs ){ return this.extend( { defaults : attrs } ); },
	
	    // extend Model and its Collection
	    extend : function( protoProps, staticProps ){
	        var This = Object.extend.call( this );
	        This.Collection = this.Collection.extend();
	        return protoProps ? This.define( protoProps, staticProps ) : This;
	    },
	
	    // define Model and its Collection. All the magic starts here.
	    define : function( protoProps, staticProps ){
	        var Base = Object.getPrototypeOf( this.prototype ).constructor,
	            spec = createDefinition( protoProps, Base ),
	            This = this;
	
	        Object.extend.Class.define.call( This, spec, staticProps );
	        attachMixins( This );
	
	        // define Collection
	        var collectionSpec = { model : This };
	        spec.urlRoot && ( collectionSpec.url = spec.urlRoot );
	        This.Collection.define( _.defaults( protoProps.collection || {}, collectionSpec ) );
	
	        return This;
	    }
	} );
	
	function attachMixins( Type ){
	    var self = Type.prototype,
	        attrSpecs = self.__attributes;
	
	    for( name in attrSpecs ){
	        attrSpecs[ name ].attachMixins( self );
	    }
	}
	
	// Create model definition from protoProps spec.
	function createDefinition( protoProps, Base ){
	    var defaults           = protoProps.defaults || protoProps.attributes || {},
	        defaultsAsFunction = typeof defaults == 'function' && defaults,
	        baseAttrSpecs      = Base.prototype.__attributes;
	
	    // Support for legacy backbone defaults as functions.
	    if( defaultsAsFunction ){
	        defaults = defaults();
	    }
	
	    var attrSpecs = Object.transform( {}, defaults, attrOptions.create );
	
	    // Create attribute for idAttribute, if it's not declared explicitly
	    var idAttribute = protoProps.idAttribute;
	    if( idAttribute && !attrSpecs[ idAttribute ] ){
	        attrSpecs[ idAttribute ] = attrOptions( { value : undefined } ).createAttribute( idAttribute );
	    }
	
	    // Prevent conflict with backbone model's 'id' property
	    if( attrSpecs[ 'id' ] ){
	        attrSpecs[ 'id' ].createPropertySpec = false;
	    }
	
	    var allAttrSpecs = _.defaults( {}, attrSpecs, baseAttrSpecs ),
	        Attributes   = createCloneCtor( allAttrSpecs );
	
	    return _.extend( _.omit( protoProps, 'collection', 'attributes' ), {
	        __attributes : new Attributes( allAttrSpecs ),
	        _parse       : create_parse( allAttrSpecs, attrSpecs ) || Base.prototype._parse,
	        defaults     : defaultsAsFunction || createDefaults( allAttrSpecs ),
	        properties   : createAttrsNativeProps( protoProps.properties, attrSpecs ),
	        Attributes   : Attributes
	    } );
	}
	
	// Create attributes 'parse' option function only if local 'parse' options present.
	// Otherwise return null.
	function create_parse( allAttrSpecs, attrSpecs ){
	    var statements = [ 'var a = this.__attributes;' ],
	        create = false;
	
	    for( var name in allAttrSpecs ){
	        // Is there any 'parse' option in local model definition?
	        if( attrSpecs[ name ] && attrSpecs[ name ].parse ) create = true;
	
	        // Add statement for each attribute with 'parse' option.
	        if( allAttrSpecs[ name ].parse ){
	            var s = 'if("' + name + '" in r) r.' + name + '=a.' + name + '.parse.call(this,r.' + name + ',"' + name + '");';
	            statements.push( s );
	        }
	    }
	
	    statements.push( 'return r;' );
	
	    return create ? new Function( 'r', statements.join( '' ) ) : null;
	}
	
	// Create constructor for efficient attributes clone operation.
	function createCloneCtor( attrSpecs ){
	    var statements = [];
	
	    for( var name in attrSpecs ){
	        statements.push( "this." + name + "=x." + name + ";" );
	    }
	
	    var Attributes = new Function( "x", statements.join( '' ) );
	
	    // attributes hash must look like vanilla object, otherwise Model.set will trigger an exception
	    Attributes.prototype = Object.prototype;
	
	    return Attributes;
	}
	
	// Check if value is valid JSON.
	function isValidJSON( value ){
	    if( value === null ){
	        return true;
	    }
	
	    switch( typeof value ){
	    case 'number' :
	    case 'string' :
	    case 'boolean' :
	        return true;
	
	    case 'object':
	        var proto = Object.getPrototypeOf( value );
	
	        if( proto === Object.prototype || proto === Array.prototype ){
	            return _.every( value, isValidJSON );
	        }
	    }
	
	    return false;
	}
	
	// Create optimized model.defaults( attrs, options ) function
	function createDefaults( attrSpecs ){
	    var statements = [], init = {}, refs = {};
	
	    // Compile optimized constructor function for efficient deep copy of JSON literals in defaults.
	    _.each( attrSpecs, function( attrSpec, name ){
	        if( attrSpec.value === undefined && attrSpec.type ){
	            // if type with no value is given, create an empty object
	            init[ name ] = attrSpec;
	            statements.push( 'this.' + name + '=i.' + name + '.create( o );' );
	        }
	        else{
	            // If value is given, type casting logic will do the job later, converting value to the proper type.
	            if( isValidJSON( attrSpec.value ) ){
	                // JSON literals must be deep copied.
	                statements.push( 'this.' + name + '=' + JSON.stringify( attrSpec.value ) + ';' );
	            }
	            else if( attrSpec.value === undefined ){
	                // handle undefined value separately. Usual case for model ids.
	                statements.push( 'this.' + name + '=undefined;' );
	            }
	            else{
	                // otherwise, copy value by reference.
	                refs[ name ] = attrSpec.value;
	                statements.push( 'this.' + name + '=r.' + name + ';' );
	            }
	
	        }
	    } );
	
	    var Defaults = new Function( 'r', 'i', 'o', statements.join( '' ) );
	    Defaults.prototype = Object.prototype;
	
	    // Create model.defaults( attrs, options ) function
	    // 'attrs' will override default values, options will be passed to nested backbone types
	    return function( attrs, options ){
	        var opts = options, name;
	
	        // 'collection' and 'parse' options must not be passed down to default nested models and collections
	        if( options && ( options.collection || options.parse ) ){
	            opts = {};
	            for( name in options ){
	                if( name !== 'collection' && name !== 'parse' ){
	                    opts[ name ] = options[ name ];
	                }
	            }
	        }
	
	        var defaults = new Defaults( refs, init, opts );
	
	        // assign attrs, overriding defaults
	        for( var name in attrs ){
	            defaults[ name ] = attrs[ name ];
	        }
	
	        return defaults;
	    }
	}
	
	// Create native properties for model's attributes
	function createAttrsNativeProps( properties, attrSpecs ){
	    if( properties === false ){
	        return {};
	    }
	
	    properties || ( properties = {} );
	
	    return Object.transform( properties, attrSpecs, function( attrSpec, name ){
	        if( !properties[ name ] && attrSpec.createPropertySpec ){
	            return attrSpec.createPropertySpec();
	        }
	    } );
	}
	
	module.exports = Model;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* Backbone core extensions: bug fixes and optimizations
	    - Use Object+ for all backbone objects
	    - Fix for Events.listenTo to support message maps
	    - optimized trigger functions
	
	 * (c) Vlad Balin & Volicon, 2015
	 * ------------------------------------------------------------- */
	
	var Class = __webpack_require__( 3 ),
	    Backbone = __webpack_require__( 4 );
	
	module.exports = Backbone;
	
	// Workaround for backbone 1.2.0 listenTo event maps bug
	var Events = Backbone.Events,
	    bbListenTo = Events.listenTo;
	
	Events.listenTo = function( obj, events ){
	    if( typeof events === 'object' ){
	        for( var event in events ) bbListenTo.call( this, obj, event, events[ event ] );
	        return this;
	    }
	
	    return bbListenTo.apply( this, arguments );
	};
	
	// Update Backbone objects to use event patches and Object+
	[ 'Model', 'Collection', 'View', 'Router', 'History' ].forEach( function( name ){
	    var Type = Backbone[ name ];
	    Type.prototype.listenTo = Events.listenTo;
	    Object.extend.attach( Type );
	});
	
	// Make Object.extend classes capable of sending and receiving Backbone Events...
	Object.assign( Class.prototype, Events );
	
	// So hard to believe :) You won't. Optimized JIT-friendly event trigger functions to be used from model.set
	// Two specialized functions for event triggering...
	Events.trigger2 = function( self, name, a, b ){
	    var _events = self._events;
	    if( _events ){
	        _fireEvent2( _events[ name ], a, b );
	        _fireEvent3( _events.all, name, a, b );
	    }
	};
	
	Events.trigger3 = function( self, name, a, b, c ){
	    var _events = self._events;
	    if( _events ){
	        _fireEvent3( _events[ name ], a, b, c );
	        _fireEvent4( _events.all, name, a, b, c );
	    }
	};
	
	// ...and specialized functions with triggering loops. Crappy JS JIT loves these small functions and code duplication.
	function _fireEvent2( events, a, b ){
	    if( events )
	        for( var i = 0, l = events.length, ev; i < l; i ++ )
	            (ev = events[i]).callback.call(ev.ctx, a, b);
	}
	
	function _fireEvent3( events, a, b, c ){
	    if( events )
	        for( var i = 0, l = events.length, ev; i < l; i ++ )
	            (ev = events[i]).callback.call(ev.ctx, a, b, c);
	}
	
	function _fireEvent4( events, a, b, c, d ){
	    if( events )
	        for( var i = 0, l = events.length, ev; i < l; i ++ )
	            (ev = events[i]).callback.call(ev.ctx, a, b, c, d);
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	/* Object extensions: backbone-style OO functions and helpers...
	 * (c) Vlad Balin & Volicon, 2015
	 * ------------------------------------------------------------- */
	
	(function( spec ){
	    for( var name in spec ){
	        Object[ name ] || Object.defineProperty( Object, name, {
	            enumerable   : false,
	            configurable : true,
	            writable     : true,
	            value        : spec[ name ]
	        } );
	    }
	})( {
	    // Object.assign polyfill from MDN.
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
	                var desc = Object.getOwnPropertyDescriptor( nextSource, nextKey );
	                if( desc !== void 0 && desc.enumerable ){
	                    to[ nextKey ] = nextSource[ nextKey ];
	                }
	            }
	        }
	        return to;
	    },
	
	    // Object.transform function, similar to _.mapObject
	    transform : function( dest, source, fun, context ){
	        for( var name in source ){
	            if( source.hasOwnProperty( name ) ){
	                var value = fun.call( context, source[ name ], name );
	                typeof value === 'undefined' || ( dest[ name ] = value );
	            }
	        }
	
	        return dest;
	    },
	
	    // get property descriptor looking through all prototype chain
	    getPropertyDescriptor : function( obj, prop ){
	        for( var desc; !desc && obj; obj = Object.getPrototypeOf( obj ) ){
	            desc = Object.getOwnPropertyDescriptor( obj, prop );
	        }
	
	        return desc;
	    },
	
	    // extend function in the fashion of Backbone, with extended features required by NestedTypes
	    // - supports native properties definitions
	    // - supports forward declarations
	    // - warn in case if base class method is overriden with value. It's popular mistake when working with Backbone.
	    extend : (function(){
	        var error = {
	            overrideMethodWithValue : function( Ctor, name, value ){
	                console.warn( '[Type Warning] Base class method overriden with value in Object.extend({ ' + name +
	                              ' : ' + value + ' }); Object =', Ctor.prototype );
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
	                Child = protoProps;
	                protoProps = null;
	            }
	            else if( protoProps && protoProps.hasOwnProperty( 'constructor' ) ){
	                Child = protoProps.constructor;
	            }
	            else{
	                Child = function Constructor(){ return Parent.apply( this, arguments ); };
	            }
	
	            Object.assign( Child, Parent );
	
	            Child.prototype = Object.create( Parent.prototype );
	            Child.prototype.constructor = Child;
	            Child.__super__ = Parent.prototype;
	
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
	
	        function define( protoProps, staticProps ){
	            Object.transform( this.prototype, protoProps, warnOnError, this );
	            Object.transform( this, staticProps, warnOnError, this );
	
	            protoProps && Object.defineProperties( this.prototype,
	                Object.transform( {}, protoProps.properties, preparePropSpec, this ) );
	
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
	} );
	
	module.exports = Object.extend.Class;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;//     Backbone.js 1.1.2
	
	//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	//     Backbone may be freely distributed under the MIT license.
	//     For all details and documentation:
	//     http://backbonejs.org
	
	(function(root, factory) {
	
	  // Set up Backbone appropriately for the environment. Start with AMD.
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5), __webpack_require__(6), exports], __WEBPACK_AMD_DEFINE_RESULT__ = function(_, $, exports) {
	      // Export global even in AMD case in case this script is loaded with
	      // others that may still expect a global Backbone.
	      root.Backbone = factory(root, exports, _, $);
	    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	
	  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
	  } else if (typeof exports !== 'undefined') {
	    var _ = require('underscore');
	    factory(root, exports, _);
	
	  // Finally, as a browser global.
	  } else {
	    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
	  }
	
	}(this, function(root, Backbone, _, $) {
	
	  // Initial Setup
	  // -------------
	
	  // Save the previous value of the `Backbone` variable, so that it can be
	  // restored later on, if `noConflict` is used.
	  var previousBackbone = root.Backbone;
	
	  // Create local references to array methods we'll want to use later.
	  var array = [];
	  var push = array.push;
	  var slice = array.slice;
	  var splice = array.splice;
	
	  // Current version of the library. Keep in sync with `package.json`.
	  Backbone.VERSION = '1.1.2';
	
	  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
	  // the `$` variable.
	  Backbone.$ = $;
	
	  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
	  // to its previous owner. Returns a reference to this Backbone object.
	  Backbone.noConflict = function() {
	    root.Backbone = previousBackbone;
	    return this;
	  };
	
	  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
	  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
	  // set a `X-Http-Method-Override` header.
	  Backbone.emulateHTTP = false;
	
	  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
	  // `application/json` requests ... will encode the body as
	  // `application/x-www-form-urlencoded` instead and will send the model in a
	  // form param named `model`.
	  Backbone.emulateJSON = false;
	
	  // Backbone.Events
	  // ---------------
	
	  // A module that can be mixed in to *any object* in order to provide it with
	  // custom events. You may bind with `on` or remove with `off` callback
	  // functions to an event; `trigger`-ing an event fires all callbacks in
	  // succession.
	  //
	  //     var object = {};
	  //     _.extend(object, Backbone.Events);
	  //     object.on('expand', function(){ alert('expanded'); });
	  //     object.trigger('expand');
	  //
	  var Events = Backbone.Events = {
	
	    // Bind an event to a `callback` function. Passing `"all"` will bind
	    // the callback to all events fired.
	    on: function(name, callback, context) {
	      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
	      this._events || (this._events = {});
	      var events = this._events[name] || (this._events[name] = []);
	      events.push({callback: callback, context: context, ctx: context || this});
	      return this;
	    },
	
	    // Bind an event to only be triggered a single time. After the first time
	    // the callback is invoked, it will be removed.
	    once: function(name, callback, context) {
	      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
	      var self = this;
	      var once = _.once(function() {
	        self.off(name, once);
	        callback.apply(this, arguments);
	      });
	      once._callback = callback;
	      return this.on(name, once, context);
	    },
	
	    // Remove one or many callbacks. If `context` is null, removes all
	    // callbacks with that function. If `callback` is null, removes all
	    // callbacks for the event. If `name` is null, removes all bound
	    // callbacks for all events.
	    off: function(name, callback, context) {
	      var retain, ev, events, names, i, l, j, k;
	      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
	      if (!name && !callback && !context) {
	        this._events = void 0;
	        return this;
	      }
	      names = name ? [name] : _.keys(this._events);
	      for (i = 0, l = names.length; i < l; i++) {
	        name = names[i];
	        if (events = this._events[name]) {
	          this._events[name] = retain = [];
	          if (callback || context) {
	            for (j = 0, k = events.length; j < k; j++) {
	              ev = events[j];
	              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
	                  (context && context !== ev.context)) {
	                retain.push(ev);
	              }
	            }
	          }
	          if (!retain.length) delete this._events[name];
	        }
	      }
	
	      return this;
	    },
	
	    // Trigger one or many events, firing all bound callbacks. Callbacks are
	    // passed the same arguments as `trigger` is, apart from the event name
	    // (unless you're listening on `"all"`, which will cause your callback to
	    // receive the true name of the event as the first argument).
	    trigger: function(name) {
	      if (!this._events) return this;
	      var args = slice.call(arguments, 1);
	      if (!eventsApi(this, 'trigger', name, args)) return this;
	      var events = this._events[name];
	      var allEvents = this._events.all;
	      if (events) triggerEvents(events, args);
	      if (allEvents) triggerEvents(allEvents, arguments);
	      return this;
	    },
	
	    // Tell this object to stop listening to either specific events ... or
	    // to every object it's currently listening to.
	    stopListening: function(obj, name, callback) {
	      var listeningTo = this._listeningTo;
	      if (!listeningTo) return this;
	      var remove = !name && !callback;
	      if (!callback && typeof name === 'object') callback = this;
	      if (obj) (listeningTo = {})[obj._listenId] = obj;
	      for (var id in listeningTo) {
	        obj = listeningTo[id];
	        obj.off(name, callback, this);
	        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
	      }
	      return this;
	    }
	
	  };
	
	  // Regular expression used to split event strings.
	  var eventSplitter = /\s+/;
	
	  // Implement fancy features of the Events API such as multiple event
	  // names `"change blur"` and jQuery-style event maps `{change: action}`
	  // in terms of the existing API.
	  var eventsApi = function(obj, action, name, rest) {
	    if (!name) return true;
	
	    // Handle event maps.
	    if (typeof name === 'object') {
	      for (var key in name) {
	        obj[action].apply(obj, [key, name[key]].concat(rest));
	      }
	      return false;
	    }
	
	    // Handle space separated event names.
	    if (eventSplitter.test(name)) {
	      var names = name.split(eventSplitter);
	      for (var i = 0, l = names.length; i < l; i++) {
	        obj[action].apply(obj, [names[i]].concat(rest));
	      }
	      return false;
	    }
	
	    return true;
	  };
	
	  // A difficult-to-believe, but optimized internal dispatch function for
	  // triggering events. Tries to keep the usual cases speedy (most internal
	  // Backbone events have 3 arguments).
	  var triggerEvents = function(events, args) {
	    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
	    switch (args.length) {
	      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
	      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
	      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
	      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
	      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
	    }
	  };
	
	  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};
	
	  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
	  // listen to an event in another object ... keeping track of what it's
	  // listening to.
	  _.each(listenMethods, function(implementation, method) {
	    Events[method] = function(obj, name, callback) {
	      var listeningTo = this._listeningTo || (this._listeningTo = {});
	      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
	      listeningTo[id] = obj;
	      if (!callback && typeof name === 'object') callback = this;
	      obj[implementation](name, callback, this);
	      return this;
	    };
	  });
	
	  // Aliases for backwards compatibility.
	  Events.bind   = Events.on;
	  Events.unbind = Events.off;
	
	  // Allow the `Backbone` object to serve as a global event bus, for folks who
	  // want global "pubsub" in a convenient place.
	  _.extend(Backbone, Events);
	
	  // Backbone.Model
	  // --------------
	
	  // Backbone **Models** are the basic data object in the framework --
	  // frequently representing a row in a table in a database on your server.
	  // A discrete chunk of data and a bunch of useful, related methods for
	  // performing computations and transformations on that data.
	
	  // Create a new model with the specified attributes. A client id (`cid`)
	  // is automatically generated and assigned for you.
	  var Model = Backbone.Model = function(attributes, options) {
	    var attrs = attributes || {};
	    options || (options = {});
	    this.cid = _.uniqueId('c');
	    this.attributes = {};
	    if (options.collection) this.collection = options.collection;
	    if (options.parse) attrs = this.parse(attrs, options) || {};
	    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
	    this.set(attrs, options);
	    this.changed = {};
	    this.initialize.apply(this, arguments);
	  };
	
	  // Attach all inheritable methods to the Model prototype.
	  _.extend(Model.prototype, Events, {
	
	    // A hash of attributes whose current and previous value differ.
	    changed: null,
	
	    // The value returned during the last failed validation.
	    validationError: null,
	
	    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
	    // CouchDB users may want to set this to `"_id"`.
	    idAttribute: 'id',
	
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function(){},
	
	    // Return a copy of the model's `attributes` object.
	    toJSON: function(options) {
	      return _.clone(this.attributes);
	    },
	
	    // Proxy `Backbone.sync` by default -- but override this if you need
	    // custom syncing semantics for *this* particular model.
	    sync: function() {
	      return Backbone.sync.apply(this, arguments);
	    },
	
	    // Get the value of an attribute.
	    get: function(attr) {
	      return this.attributes[attr];
	    },
	
	    // Get the HTML-escaped value of an attribute.
	    escape: function(attr) {
	      return _.escape(this.get(attr));
	    },
	
	    // Returns `true` if the attribute contains a value that is not null
	    // or undefined.
	    has: function(attr) {
	      return this.get(attr) != null;
	    },
	
	    // Set a hash of model attributes on the object, firing `"change"`. This is
	    // the core primitive operation of a model, updating the data and notifying
	    // anyone who needs to know about the change in state. The heart of the beast.
	    set: function(key, val, options) {
	      var attr, attrs, unset, changes, silent, changing, prev, current;
	      if (key == null) return this;
	
	      // Handle both `"key", value` and `{key: value}` -style arguments.
	      if (typeof key === 'object') {
	        attrs = key;
	        options = val;
	      } else {
	        (attrs = {})[key] = val;
	      }
	
	      options || (options = {});
	
	      // Run validation.
	      if (!this._validate(attrs, options)) return false;
	
	      // Extract attributes and options.
	      unset           = options.unset;
	      silent          = options.silent;
	      changes         = [];
	      changing        = this._changing;
	      this._changing  = true;
	
	      if (!changing) {
	        this._previousAttributes = _.clone(this.attributes);
	        this.changed = {};
	      }
	      current = this.attributes, prev = this._previousAttributes;
	
	      // Check for changes of `id`.
	      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];
	
	      // For each `set` attribute, update or delete the current value.
	      for (attr in attrs) {
	        val = attrs[attr];
	        if (!_.isEqual(current[attr], val)) changes.push(attr);
	        if (!_.isEqual(prev[attr], val)) {
	          this.changed[attr] = val;
	        } else {
	          delete this.changed[attr];
	        }
	        unset ? delete current[attr] : current[attr] = val;
	      }
	
	      // Trigger all relevant attribute changes.
	      if (!silent) {
	        if (changes.length) this._pending = options;
	        for (var i = 0, l = changes.length; i < l; i++) {
	          this.trigger('change:' + changes[i], this, current[changes[i]], options);
	        }
	      }
	
	      // You might be wondering why there's a `while` loop here. Changes can
	      // be recursively nested within `"change"` events.
	      if (changing) return this;
	      if (!silent) {
	        while (this._pending) {
	          options = this._pending;
	          this._pending = false;
	          this.trigger('change', this, options);
	        }
	      }
	      this._pending = false;
	      this._changing = false;
	      return this;
	    },
	
	    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
	    // if the attribute doesn't exist.
	    unset: function(attr, options) {
	      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
	    },
	
	    // Clear all attributes on the model, firing `"change"`.
	    clear: function(options) {
	      var attrs = {};
	      for (var key in this.attributes) attrs[key] = void 0;
	      return this.set(attrs, _.extend({}, options, {unset: true}));
	    },
	
	    // Determine if the model has changed since the last `"change"` event.
	    // If you specify an attribute name, determine if that attribute has changed.
	    hasChanged: function(attr) {
	      if (attr == null) return !_.isEmpty(this.changed);
	      return _.has(this.changed, attr);
	    },
	
	    // Return an object containing all the attributes that have changed, or
	    // false if there are no changed attributes. Useful for determining what
	    // parts of a view need to be updated and/or what attributes need to be
	    // persisted to the server. Unset attributes will be set to undefined.
	    // You can also pass an attributes object to diff against the model,
	    // determining if there *would be* a change.
	    changedAttributes: function(diff) {
	      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
	      var val, changed = false;
	      var old = this._changing ? this._previousAttributes : this.attributes;
	      for (var attr in diff) {
	        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
	        (changed || (changed = {}))[attr] = val;
	      }
	      return changed;
	    },
	
	    // Get the previous value of an attribute, recorded at the time the last
	    // `"change"` event was fired.
	    previous: function(attr) {
	      if (attr == null || !this._previousAttributes) return null;
	      return this._previousAttributes[attr];
	    },
	
	    // Get all of the attributes of the model at the time of the previous
	    // `"change"` event.
	    previousAttributes: function() {
	      return _.clone(this._previousAttributes);
	    },
	
	    // Fetch the model from the server. If the server's representation of the
	    // model differs from its current attributes, they will be overridden,
	    // triggering a `"change"` event.
	    fetch: function(options) {
	      options = options ? _.clone(options) : {};
	      if (options.parse === void 0) options.parse = true;
	      var model = this;
	      var success = options.success;
	      options.success = function(resp) {
	        if (!model.set(model.parse(resp, options), options)) return false;
	        if (success) success(model, resp, options);
	        model.trigger('sync', model, resp, options);
	      };
	      wrapError(this, options);
	      return this.sync('read', this, options);
	    },
	
	    // Set a hash of model attributes, and sync the model to the server.
	    // If the server returns an attributes hash that differs, the model's
	    // state will be `set` again.
	    save: function(key, val, options) {
	      var attrs, method, xhr, attributes = this.attributes;
	
	      // Handle both `"key", value` and `{key: value}` -style arguments.
	      if (key == null || typeof key === 'object') {
	        attrs = key;
	        options = val;
	      } else {
	        (attrs = {})[key] = val;
	      }
	
	      options = _.extend({validate: true}, options);
	
	      // If we're not waiting and attributes exist, save acts as
	      // `set(attr).save(null, opts)` with validation. Otherwise, check if
	      // the model will be valid when the attributes, if any, are set.
	      if (attrs && !options.wait) {
	        if (!this.set(attrs, options)) return false;
	      } else {
	        if (!this._validate(attrs, options)) return false;
	      }
	
	      // Set temporary attributes if `{wait: true}`.
	      if (attrs && options.wait) {
	        this.attributes = _.extend({}, attributes, attrs);
	      }
	
	      // After a successful server-side save, the client is (optionally)
	      // updated with the server-side state.
	      if (options.parse === void 0) options.parse = true;
	      var model = this;
	      var success = options.success;
	      options.success = function(resp) {
	        // Ensure attributes are restored during synchronous saves.
	        model.attributes = attributes;
	        var serverAttrs = model.parse(resp, options);
	        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
	        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
	          return false;
	        }
	        if (success) success(model, resp, options);
	        model.trigger('sync', model, resp, options);
	      };
	      wrapError(this, options);
	
	      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
	      if (method === 'patch') options.attrs = attrs;
	      xhr = this.sync(method, this, options);
	
	      // Restore attributes.
	      if (attrs && options.wait) this.attributes = attributes;
	
	      return xhr;
	    },
	
	    // Destroy this model on the server if it was already persisted.
	    // Optimistically removes the model from its collection, if it has one.
	    // If `wait: true` is passed, waits for the server to respond before removal.
	    destroy: function(options) {
	      options = options ? _.clone(options) : {};
	      var model = this;
	      var success = options.success;
	
	      var destroy = function() {
	        model.trigger('destroy', model, model.collection, options);
	      };
	
	      options.success = function(resp) {
	        if (options.wait || model.isNew()) destroy();
	        if (success) success(model, resp, options);
	        if (!model.isNew()) model.trigger('sync', model, resp, options);
	      };
	
	      if (this.isNew()) {
	        options.success();
	        return false;
	      }
	      wrapError(this, options);
	
	      var xhr = this.sync('delete', this, options);
	      if (!options.wait) destroy();
	      return xhr;
	    },
	
	    // Default URL for the model's representation on the server -- if you're
	    // using Backbone's restful methods, override this to change the endpoint
	    // that will be called.
	    url: function() {
	      var base =
	        _.result(this, 'urlRoot') ||
	        _.result(this.collection, 'url') ||
	        urlError();
	      if (this.isNew()) return base;
	      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
	    },
	
	    // **parse** converts a response into the hash of attributes to be `set` on
	    // the model. The default implementation is just to pass the response along.
	    parse: function(resp, options) {
	      return resp;
	    },
	
	    // Create a new model with identical attributes to this one.
	    clone: function() {
	      return new this.constructor(this.attributes);
	    },
	
	    // A model is new if it has never been saved to the server, and lacks an id.
	    isNew: function() {
	      return !this.has(this.idAttribute);
	    },
	
	    // Check if the model is currently in a valid state.
	    isValid: function(options) {
	      return this._validate({}, _.extend(options || {}, { validate: true }));
	    },
	
	    // Run validation against the next complete set of model attributes,
	    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
	    _validate: function(attrs, options) {
	      if (!options.validate || !this.validate) return true;
	      attrs = _.extend({}, this.attributes, attrs);
	      var error = this.validationError = this.validate(attrs, options) || null;
	      if (!error) return true;
	      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
	      return false;
	    }
	
	  });
	
	  // Underscore methods that we want to implement on the Model.
	  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];
	
	  // Mix in each Underscore method as a proxy to `Model#attributes`.
	  _.each(modelMethods, function(method) {
	    Model.prototype[method] = function() {
	      var args = slice.call(arguments);
	      args.unshift(this.attributes);
	      return _[method].apply(_, args);
	    };
	  });
	
	  // Backbone.Collection
	  // -------------------
	
	  // If models tend to represent a single row of data, a Backbone Collection is
	  // more analagous to a table full of data ... or a small slice or page of that
	  // table, or a collection of rows that belong together for a particular reason
	  // -- all of the messages in this particular folder, all of the documents
	  // belonging to this particular author, and so on. Collections maintain
	  // indexes of their models, both in order, and for lookup by `id`.
	
	  // Create a new **Collection**, perhaps to contain a specific type of `model`.
	  // If a `comparator` is specified, the Collection will maintain
	  // its models in sort order, as they're added and removed.
	  var Collection = Backbone.Collection = function(models, options) {
	    options || (options = {});
	    if (options.model) this.model = options.model;
	    if (options.comparator !== void 0) this.comparator = options.comparator;
	    this._reset();
	    this.initialize.apply(this, arguments);
	    if (models) this.reset(models, _.extend({silent: true}, options));
	  };
	
	  // Default options for `Collection#set`.
	  var setOptions = {add: true, remove: true, merge: true};
	  var addOptions = {add: true, remove: false};
	
	  // Define the Collection's inheritable methods.
	  _.extend(Collection.prototype, Events, {
	
	    // The default model for a collection is just a **Backbone.Model**.
	    // This should be overridden in most cases.
	    model: Model,
	
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function(){},
	
	    // The JSON representation of a Collection is an array of the
	    // models' attributes.
	    toJSON: function(options) {
	      return this.map(function(model){ return model.toJSON(options); });
	    },
	
	    // Proxy `Backbone.sync` by default.
	    sync: function() {
	      return Backbone.sync.apply(this, arguments);
	    },
	
	    // Add a model, or list of models to the set.
	    add: function(models, options) {
	      return this.set(models, _.extend({merge: false}, options, addOptions));
	    },
	
	    // Remove a model, or a list of models from the set.
	    remove: function(models, options) {
	      var singular = !_.isArray(models);
	      models = singular ? [models] : _.clone(models);
	      options || (options = {});
	      var i, l, index, model;
	      for (i = 0, l = models.length; i < l; i++) {
	        model = models[i] = this.get(models[i]);
	        if (!model) continue;
	        delete this._byId[model.id];
	        delete this._byId[model.cid];
	        index = this.indexOf(model);
	        this.models.splice(index, 1);
	        this.length--;
	        if (!options.silent) {
	          options.index = index;
	          model.trigger('remove', model, this, options);
	        }
	        this._removeReference(model, options);
	      }
	      return singular ? models[0] : models;
	    },
	
	    // Update a collection by `set`-ing a new list of models, adding new ones,
	    // removing models that are no longer present, and merging models that
	    // already exist in the collection, as necessary. Similar to **Model#set**,
	    // the core operation for updating the data contained by the collection.
	    set: function(models, options) {
	      options = _.defaults({}, options, setOptions);
	      if (options.parse) models = this.parse(models, options);
	      var singular = !_.isArray(models);
	      models = singular ? (models ? [models] : []) : _.clone(models);
	      var i, l, id, model, attrs, existing, sort;
	      var at = options.at;
	      var targetModel = this.model;
	      var sortable = this.comparator && (at == null) && options.sort !== false;
	      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
	      var toAdd = [], toRemove = [], modelMap = {};
	      var add = options.add, merge = options.merge, remove = options.remove;
	      var order = !sortable && add && remove ? [] : false;
	
	      // Turn bare objects into model references, and prevent invalid models
	      // from being added.
	      for (i = 0, l = models.length; i < l; i++) {
	        attrs = models[i] || {};
	        if (attrs instanceof Model) {
	          id = model = attrs;
	        } else {
	          id = attrs[targetModel.prototype.idAttribute || 'id'];
	        }
	
	        // If a duplicate is found, prevent it from being added and
	        // optionally merge it into the existing model.
	        if (existing = this.get(id)) {
	          if (remove) modelMap[existing.cid] = true;
	          if (merge) {
	            attrs = attrs === model ? model.attributes : attrs;
	            if (options.parse) attrs = existing.parse(attrs, options);
	            existing.set(attrs, options);
	            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
	          }
	          models[i] = existing;
	
	        // If this is a new, valid model, push it to the `toAdd` list.
	        } else if (add) {
	          model = models[i] = this._prepareModel(attrs, options);
	          if (!model) continue;
	          toAdd.push(model);
	          this._addReference(model, options);
	        }
	
	        // Do not add multiple models with the same `id`.
	        model = existing || model;
	        if (order && (model.isNew() || !modelMap[model.id])) order.push(model);
	        modelMap[model.id] = true;
	      }
	
	      // Remove nonexistent models if appropriate.
	      if (remove) {
	        for (i = 0, l = this.length; i < l; ++i) {
	          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
	        }
	        if (toRemove.length) this.remove(toRemove, options);
	      }
	
	      // See if sorting is needed, update `length` and splice in new models.
	      if (toAdd.length || (order && order.length)) {
	        if (sortable) sort = true;
	        this.length += toAdd.length;
	        if (at != null) {
	          for (i = 0, l = toAdd.length; i < l; i++) {
	            this.models.splice(at + i, 0, toAdd[i]);
	          }
	        } else {
	          if (order) this.models.length = 0;
	          var orderedModels = order || toAdd;
	          for (i = 0, l = orderedModels.length; i < l; i++) {
	            this.models.push(orderedModels[i]);
	          }
	        }
	      }
	
	      // Silently sort the collection if appropriate.
	      if (sort) this.sort({silent: true});
	
	      // Unless silenced, it's time to fire all appropriate add/sort events.
	      if (!options.silent) {
	        for (i = 0, l = toAdd.length; i < l; i++) {
	          (model = toAdd[i]).trigger('add', model, this, options);
	        }
	        if (sort || (order && order.length)) this.trigger('sort', this, options);
	      }
	
	      // Return the added (or merged) model (or models).
	      return singular ? models[0] : models;
	    },
	
	    // When you have more items than you want to add or remove individually,
	    // you can reset the entire set with a new list of models, without firing
	    // any granular `add` or `remove` events. Fires `reset` when finished.
	    // Useful for bulk operations and optimizations.
	    reset: function(models, options) {
	      options || (options = {});
	      for (var i = 0, l = this.models.length; i < l; i++) {
	        this._removeReference(this.models[i], options);
	      }
	      options.previousModels = this.models;
	      this._reset();
	      models = this.add(models, _.extend({silent: true}, options));
	      if (!options.silent) this.trigger('reset', this, options);
	      return models;
	    },
	
	    // Add a model to the end of the collection.
	    push: function(model, options) {
	      return this.add(model, _.extend({at: this.length}, options));
	    },
	
	    // Remove a model from the end of the collection.
	    pop: function(options) {
	      var model = this.at(this.length - 1);
	      this.remove(model, options);
	      return model;
	    },
	
	    // Add a model to the beginning of the collection.
	    unshift: function(model, options) {
	      return this.add(model, _.extend({at: 0}, options));
	    },
	
	    // Remove a model from the beginning of the collection.
	    shift: function(options) {
	      var model = this.at(0);
	      this.remove(model, options);
	      return model;
	    },
	
	    // Slice out a sub-array of models from the collection.
	    slice: function() {
	      return slice.apply(this.models, arguments);
	    },
	
	    // Get a model from the set by id.
	    get: function(obj) {
	      if (obj == null) return void 0;
	      return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
	    },
	
	    // Get the model at the given index.
	    at: function(index) {
	      return this.models[index];
	    },
	
	    // Return models with matching attributes. Useful for simple cases of
	    // `filter`.
	    where: function(attrs, first) {
	      if (_.isEmpty(attrs)) return first ? void 0 : [];
	      return this[first ? 'find' : 'filter'](function(model) {
	        for (var key in attrs) {
	          if (attrs[key] !== model.get(key)) return false;
	        }
	        return true;
	      });
	    },
	
	    // Return the first model with matching attributes. Useful for simple cases
	    // of `find`.
	    findWhere: function(attrs) {
	      return this.where(attrs, true);
	    },
	
	    // Force the collection to re-sort itself. You don't need to call this under
	    // normal circumstances, as the set will maintain sort order as each item
	    // is added.
	    sort: function(options) {
	      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
	      options || (options = {});
	
	      // Run sort based on type of `comparator`.
	      if (_.isString(this.comparator) || this.comparator.length === 1) {
	        this.models = this.sortBy(this.comparator, this);
	      } else {
	        this.models.sort(_.bind(this.comparator, this));
	      }
	
	      if (!options.silent) this.trigger('sort', this, options);
	      return this;
	    },
	
	    // Pluck an attribute from each model in the collection.
	    pluck: function(attr) {
	      return _.invoke(this.models, 'get', attr);
	    },
	
	    // Fetch the default set of models for this collection, resetting the
	    // collection when they arrive. If `reset: true` is passed, the response
	    // data will be passed through the `reset` method instead of `set`.
	    fetch: function(options) {
	      options = options ? _.clone(options) : {};
	      if (options.parse === void 0) options.parse = true;
	      var success = options.success;
	      var collection = this;
	      options.success = function(resp) {
	        var method = options.reset ? 'reset' : 'set';
	        collection[method](resp, options);
	        if (success) success(collection, resp, options);
	        collection.trigger('sync', collection, resp, options);
	      };
	      wrapError(this, options);
	      return this.sync('read', this, options);
	    },
	
	    // Create a new instance of a model in this collection. Add the model to the
	    // collection immediately, unless `wait: true` is passed, in which case we
	    // wait for the server to agree.
	    create: function(model, options) {
	      options = options ? _.clone(options) : {};
	      if (!(model = this._prepareModel(model, options))) return false;
	      if (!options.wait) this.add(model, options);
	      var collection = this;
	      var success = options.success;
	      options.success = function(model, resp) {
	        if (options.wait) collection.add(model, options);
	        if (success) success(model, resp, options);
	      };
	      model.save(null, options);
	      return model;
	    },
	
	    // **parse** converts a response into a list of models to be added to the
	    // collection. The default implementation is just to pass it through.
	    parse: function(resp, options) {
	      return resp;
	    },
	
	    // Create a new collection with an identical list of models as this one.
	    clone: function() {
	      return new this.constructor(this.models);
	    },
	
	    // Private method to reset all internal state. Called when the collection
	    // is first initialized or reset.
	    _reset: function() {
	      this.length = 0;
	      this.models = [];
	      this._byId  = {};
	    },
	
	    // Prepare a hash of attributes (or other model) to be added to this
	    // collection.
	    _prepareModel: function(attrs, options) {
	      if (attrs instanceof Model) return attrs;
	      options = options ? _.clone(options) : {};
	      options.collection = this;
	      var model = new this.model(attrs, options);
	      if (!model.validationError) return model;
	      this.trigger('invalid', this, model.validationError, options);
	      return false;
	    },
	
	    // Internal method to create a model's ties to a collection.
	    _addReference: function(model, options) {
	      this._byId[model.cid] = model;
	      if (model.id != null) this._byId[model.id] = model;
	      if (!model.collection) model.collection = this;
	      model.on('all', this._onModelEvent, this);
	    },
	
	    // Internal method to sever a model's ties to a collection.
	    _removeReference: function(model, options) {
	      if (this === model.collection) delete model.collection;
	      model.off('all', this._onModelEvent, this);
	    },
	
	    // Internal method called every time a model in the set fires an event.
	    // Sets need to update their indexes when models change ids. All other
	    // events simply proxy through. "add" and "remove" events that originate
	    // in other collections are ignored.
	    _onModelEvent: function(event, model, collection, options) {
	      if ((event === 'add' || event === 'remove') && collection !== this) return;
	      if (event === 'destroy') this.remove(model, options);
	      if (model && event === 'change:' + model.idAttribute) {
	        delete this._byId[model.previous(model.idAttribute)];
	        if (model.id != null) this._byId[model.id] = model;
	      }
	      this.trigger.apply(this, arguments);
	    }
	
	  });
	
	  // Underscore methods that we want to implement on the Collection.
	  // 90% of the core usefulness of Backbone Collections is actually implemented
	  // right here:
	  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
	    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
	    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
	    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
	    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
	    'lastIndexOf', 'isEmpty', 'chain', 'sample'];
	
	  // Mix in each Underscore method as a proxy to `Collection#models`.
	  _.each(methods, function(method) {
	    Collection.prototype[method] = function() {
	      var args = slice.call(arguments);
	      args.unshift(this.models);
	      return _[method].apply(_, args);
	    };
	  });
	
	  // Underscore methods that take a property name as an argument.
	  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];
	
	  // Use attributes instead of properties.
	  _.each(attributeMethods, function(method) {
	    Collection.prototype[method] = function(value, context) {
	      var iterator = _.isFunction(value) ? value : function(model) {
	        return model.get(value);
	      };
	      return _[method](this.models, iterator, context);
	    };
	  });
	
	  // Backbone.View
	  // -------------
	
	  // Backbone Views are almost more convention than they are actual code. A View
	  // is simply a JavaScript object that represents a logical chunk of UI in the
	  // DOM. This might be a single item, an entire list, a sidebar or panel, or
	  // even the surrounding frame which wraps your whole app. Defining a chunk of
	  // UI as a **View** allows you to define your DOM events declaratively, without
	  // having to worry about render order ... and makes it easy for the view to
	  // react to specific changes in the state of your models.
	
	  // Creating a Backbone.View creates its initial element outside of the DOM,
	  // if an existing element is not provided...
	  var View = Backbone.View = function(options) {
	    this.cid = _.uniqueId('view');
	    options || (options = {});
	    _.extend(this, _.pick(options, viewOptions));
	    this._ensureElement();
	    this.initialize.apply(this, arguments);
	    this.delegateEvents();
	  };
	
	  // Cached regex to split keys for `delegate`.
	  var delegateEventSplitter = /^(\S+)\s*(.*)$/;
	
	  // List of view options to be merged as properties.
	  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
	
	  // Set up all inheritable **Backbone.View** properties and methods.
	  _.extend(View.prototype, Events, {
	
	    // The default `tagName` of a View's element is `"div"`.
	    tagName: 'div',
	
	    // jQuery delegate for element lookup, scoped to DOM elements within the
	    // current view. This should be preferred to global lookups where possible.
	    $: function(selector) {
	      return this.$el.find(selector);
	    },
	
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function(){},
	
	    // **render** is the core function that your view should override, in order
	    // to populate its element (`this.el`), with the appropriate HTML. The
	    // convention is for **render** to always return `this`.
	    render: function() {
	      return this;
	    },
	
	    // Remove this view by taking the element out of the DOM, and removing any
	    // applicable Backbone.Events listeners.
	    remove: function() {
	      this.$el.remove();
	      this.stopListening();
	      return this;
	    },
	
	    // Change the view's element (`this.el` property), including event
	    // re-delegation.
	    setElement: function(element, delegate) {
	      if (this.$el) this.undelegateEvents();
	      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
	      this.el = this.$el[0];
	      if (delegate !== false) this.delegateEvents();
	      return this;
	    },
	
	    // Set callbacks, where `this.events` is a hash of
	    //
	    // *{"event selector": "callback"}*
	    //
	    //     {
	    //       'mousedown .title':  'edit',
	    //       'click .button':     'save',
	    //       'click .open':       function(e) { ... }
	    //     }
	    //
	    // pairs. Callbacks will be bound to the view, with `this` set properly.
	    // Uses event delegation for efficiency.
	    // Omitting the selector binds the event to `this.el`.
	    // This only works for delegate-able events: not `focus`, `blur`, and
	    // not `change`, `submit`, and `reset` in Internet Explorer.
	    delegateEvents: function(events) {
	      if (!(events || (events = _.result(this, 'events')))) return this;
	      this.undelegateEvents();
	      for (var key in events) {
	        var method = events[key];
	        if (!_.isFunction(method)) method = this[events[key]];
	        if (!method) continue;
	
	        var match = key.match(delegateEventSplitter);
	        var eventName = match[1], selector = match[2];
	        method = _.bind(method, this);
	        eventName += '.delegateEvents' + this.cid;
	        if (selector === '') {
	          this.$el.on(eventName, method);
	        } else {
	          this.$el.on(eventName, selector, method);
	        }
	      }
	      return this;
	    },
	
	    // Clears all callbacks previously bound to the view with `delegateEvents`.
	    // You usually don't need to use this, but may wish to if you have multiple
	    // Backbone views attached to the same DOM element.
	    undelegateEvents: function() {
	      this.$el.off('.delegateEvents' + this.cid);
	      return this;
	    },
	
	    // Ensure that the View has a DOM element to render into.
	    // If `this.el` is a string, pass it through `$()`, take the first
	    // matching element, and re-assign it to `el`. Otherwise, create
	    // an element from the `id`, `className` and `tagName` properties.
	    _ensureElement: function() {
	      if (!this.el) {
	        var attrs = _.extend({}, _.result(this, 'attributes'));
	        if (this.id) attrs.id = _.result(this, 'id');
	        if (this.className) attrs['class'] = _.result(this, 'className');
	        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
	        this.setElement($el, false);
	      } else {
	        this.setElement(_.result(this, 'el'), false);
	      }
	    }
	
	  });
	
	  // Backbone.sync
	  // -------------
	
	  // Override this function to change the manner in which Backbone persists
	  // models to the server. You will be passed the type of request, and the
	  // model in question. By default, makes a RESTful Ajax request
	  // to the model's `url()`. Some possible customizations could be:
	  //
	  // * Use `setTimeout` to batch rapid-fire updates into a single request.
	  // * Send up the models as XML instead of JSON.
	  // * Persist models via WebSockets instead of Ajax.
	  //
	  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
	  // as `POST`, with a `_method` parameter containing the true HTTP method,
	  // as well as all requests with the body as `application/x-www-form-urlencoded`
	  // instead of `application/json` with the model in a param named `model`.
	  // Useful when interfacing with server-side languages like **PHP** that make
	  // it difficult to read the body of `PUT` requests.
	  Backbone.sync = function(method, model, options) {
	    var type = methodMap[method];
	
	    // Default options, unless specified.
	    _.defaults(options || (options = {}), {
	      emulateHTTP: Backbone.emulateHTTP,
	      emulateJSON: Backbone.emulateJSON
	    });
	
	    // Default JSON-request options.
	    var params = {type: type, dataType: 'json'};
	
	    // Ensure that we have a URL.
	    if (!options.url) {
	      params.url = _.result(model, 'url') || urlError();
	    }
	
	    // Ensure that we have the appropriate request data.
	    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
	      params.contentType = 'application/json';
	      params.data = JSON.stringify(options.attrs || model.toJSON(options));
	    }
	
	    // For older servers, emulate JSON by encoding the request into an HTML-form.
	    if (options.emulateJSON) {
	      params.contentType = 'application/x-www-form-urlencoded';
	      params.data = params.data ? {model: params.data} : {};
	    }
	
	    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
	    // And an `X-HTTP-Method-Override` header.
	    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
	      params.type = 'POST';
	      if (options.emulateJSON) params.data._method = type;
	      var beforeSend = options.beforeSend;
	      options.beforeSend = function(xhr) {
	        xhr.setRequestHeader('X-HTTP-Method-Override', type);
	        if (beforeSend) return beforeSend.apply(this, arguments);
	      };
	    }
	
	    // Don't process data on a non-GET request.
	    if (params.type !== 'GET' && !options.emulateJSON) {
	      params.processData = false;
	    }
	
	    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
	    // that still has ActiveX enabled by default, override jQuery to use that
	    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
	    if (params.type === 'PATCH' && noXhrPatch) {
	      params.xhr = function() {
	        return new ActiveXObject("Microsoft.XMLHTTP");
	      };
	    }
	
	    // Make the request, allowing the user to override any Ajax options.
	    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
	    model.trigger('request', model, xhr, options);
	    return xhr;
	  };
	
	  var noXhrPatch =
	    typeof window !== 'undefined' && !!window.ActiveXObject &&
	      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);
	
	  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
	  var methodMap = {
	    'create': 'POST',
	    'update': 'PUT',
	    'patch':  'PATCH',
	    'delete': 'DELETE',
	    'read':   'GET'
	  };
	
	  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
	  // Override this if you'd like to use a different library.
	  Backbone.ajax = function() {
	    return Backbone.$.ajax.apply(Backbone.$, arguments);
	  };
	
	  // Backbone.Router
	  // ---------------
	
	  // Routers map faux-URLs to actions, and fire events when routes are
	  // matched. Creating a new one sets its `routes` hash, if not set statically.
	  var Router = Backbone.Router = function(options) {
	    options || (options = {});
	    if (options.routes) this.routes = options.routes;
	    this._bindRoutes();
	    this.initialize.apply(this, arguments);
	  };
	
	  // Cached regular expressions for matching named param parts and splatted
	  // parts of route strings.
	  var optionalParam = /\((.*?)\)/g;
	  var namedParam    = /(\(\?)?:\w+/g;
	  var splatParam    = /\*\w+/g;
	  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;
	
	  // Set up all inheritable **Backbone.Router** properties and methods.
	  _.extend(Router.prototype, Events, {
	
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function(){},
	
	    // Manually bind a single named route to a callback. For example:
	    //
	    //     this.route('search/:query/p:num', 'search', function(query, num) {
	    //       ...
	    //     });
	    //
	    route: function(route, name, callback) {
	      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
	      if (_.isFunction(name)) {
	        callback = name;
	        name = '';
	      }
	      if (!callback) callback = this[name];
	      var router = this;
	      Backbone.history.route(route, function(fragment) {
	        var args = router._extractParameters(route, fragment);
	        router.execute(callback, args);
	        router.trigger.apply(router, ['route:' + name].concat(args));
	        router.trigger('route', name, args);
	        Backbone.history.trigger('route', router, name, args);
	      });
	      return this;
	    },
	
	    // Execute a route handler with the provided parameters.  This is an
	    // excellent place to do pre-route setup or post-route cleanup.
	    execute: function(callback, args) {
	      if (callback) callback.apply(this, args);
	    },
	
	    // Simple proxy to `Backbone.history` to save a fragment into the history.
	    navigate: function(fragment, options) {
	      Backbone.history.navigate(fragment, options);
	      return this;
	    },
	
	    // Bind all defined routes to `Backbone.history`. We have to reverse the
	    // order of the routes here to support behavior where the most general
	    // routes can be defined at the bottom of the route map.
	    _bindRoutes: function() {
	      if (!this.routes) return;
	      this.routes = _.result(this, 'routes');
	      var route, routes = _.keys(this.routes);
	      while ((route = routes.pop()) != null) {
	        this.route(route, this.routes[route]);
	      }
	    },
	
	    // Convert a route string into a regular expression, suitable for matching
	    // against the current location hash.
	    _routeToRegExp: function(route) {
	      route = route.replace(escapeRegExp, '\\$&')
	                   .replace(optionalParam, '(?:$1)?')
	                   .replace(namedParam, function(match, optional) {
	                     return optional ? match : '([^/?]+)';
	                   })
	                   .replace(splatParam, '([^?]*?)');
	      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
	    },
	
	    // Given a route, and a URL fragment that it matches, return the array of
	    // extracted decoded parameters. Empty or unmatched parameters will be
	    // treated as `null` to normalize cross-browser behavior.
	    _extractParameters: function(route, fragment) {
	      var params = route.exec(fragment).slice(1);
	      return _.map(params, function(param, i) {
	        // Don't decode the search params.
	        if (i === params.length - 1) return param || null;
	        return param ? decodeURIComponent(param) : null;
	      });
	    }
	
	  });
	
	  // Backbone.History
	  // ----------------
	
	  // Handles cross-browser history management, based on either
	  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
	  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
	  // and URL fragments. If the browser supports neither (old IE, natch),
	  // falls back to polling.
	  var History = Backbone.History = function() {
	    this.handlers = [];
	    _.bindAll(this, 'checkUrl');
	
	    // Ensure that `History` can be used outside of the browser.
	    if (typeof window !== 'undefined') {
	      this.location = window.location;
	      this.history = window.history;
	    }
	  };
	
	  // Cached regex for stripping a leading hash/slash and trailing space.
	  var routeStripper = /^[#\/]|\s+$/g;
	
	  // Cached regex for stripping leading and trailing slashes.
	  var rootStripper = /^\/+|\/+$/g;
	
	  // Cached regex for detecting MSIE.
	  var isExplorer = /msie [\w.]+/;
	
	  // Cached regex for removing a trailing slash.
	  var trailingSlash = /\/$/;
	
	  // Cached regex for stripping urls of hash.
	  var pathStripper = /#.*$/;
	
	  // Has the history handling already been started?
	  History.started = false;
	
	  // Set up all inheritable **Backbone.History** properties and methods.
	  _.extend(History.prototype, Events, {
	
	    // The default interval to poll for hash changes, if necessary, is
	    // twenty times a second.
	    interval: 50,
	
	    // Are we at the app root?
	    atRoot: function() {
	      return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
	    },
	
	    // Gets the true hash value. Cannot use location.hash directly due to bug
	    // in Firefox where location.hash will always be decoded.
	    getHash: function(window) {
	      var match = (window || this).location.href.match(/#(.*)$/);
	      return match ? match[1] : '';
	    },
	
	    // Get the cross-browser normalized URL fragment, either from the URL,
	    // the hash, or the override.
	    getFragment: function(fragment, forcePushState) {
	      if (fragment == null) {
	        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
	          fragment = decodeURI(this.location.pathname + this.location.search);
	          var root = this.root.replace(trailingSlash, '');
	          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
	        } else {
	          fragment = this.getHash();
	        }
	      }
	      return fragment.replace(routeStripper, '');
	    },
	
	    // Start the hash change handling, returning `true` if the current URL matches
	    // an existing route, and `false` otherwise.
	    start: function(options) {
	      if (History.started) throw new Error("Backbone.history has already been started");
	      History.started = true;
	
	      // Figure out the initial configuration. Do we need an iframe?
	      // Is pushState desired ... is it available?
	      this.options          = _.extend({root: '/'}, this.options, options);
	      this.root             = this.options.root;
	      this._wantsHashChange = this.options.hashChange !== false;
	      this._wantsPushState  = !!this.options.pushState;
	      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
	      var fragment          = this.getFragment();
	      var docMode           = document.documentMode;
	      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));
	
	      // Normalize root to always include a leading and trailing slash.
	      this.root = ('/' + this.root + '/').replace(rootStripper, '/');
	
	      if (oldIE && this._wantsHashChange) {
	        var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
	        this.iframe = frame.hide().appendTo('body')[0].contentWindow;
	        this.navigate(fragment);
	      }
	
	      // Depending on whether we're using pushState or hashes, and whether
	      // 'onhashchange' is supported, determine how we check the URL state.
	      if (this._hasPushState) {
	        Backbone.$(window).on('popstate', this.checkUrl);
	      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
	        Backbone.$(window).on('hashchange', this.checkUrl);
	      } else if (this._wantsHashChange) {
	        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
	      }
	
	      // Determine if we need to change the base url, for a pushState link
	      // opened by a non-pushState browser.
	      this.fragment = fragment;
	      var loc = this.location;
	
	      // Transition from hashChange to pushState or vice versa if both are
	      // requested.
	      if (this._wantsHashChange && this._wantsPushState) {
	
	        // If we've started off with a route from a `pushState`-enabled
	        // browser, but we're currently in a browser that doesn't support it...
	        if (!this._hasPushState && !this.atRoot()) {
	          this.fragment = this.getFragment(null, true);
	          this.location.replace(this.root + '#' + this.fragment);
	          // Return immediately as browser will do redirect to new url
	          return true;
	
	        // Or if we've started out with a hash-based route, but we're currently
	        // in a browser where it could be `pushState`-based instead...
	        } else if (this._hasPushState && this.atRoot() && loc.hash) {
	          this.fragment = this.getHash().replace(routeStripper, '');
	          this.history.replaceState({}, document.title, this.root + this.fragment);
	        }
	
	      }
	
	      if (!this.options.silent) return this.loadUrl();
	    },
	
	    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
	    // but possibly useful for unit testing Routers.
	    stop: function() {
	      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
	      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
	      History.started = false;
	    },
	
	    // Add a route to be tested when the fragment changes. Routes added later
	    // may override previous routes.
	    route: function(route, callback) {
	      this.handlers.unshift({route: route, callback: callback});
	    },
	
	    // Checks the current URL to see if it has changed, and if it has,
	    // calls `loadUrl`, normalizing across the hidden iframe.
	    checkUrl: function(e) {
	      var current = this.getFragment();
	      if (current === this.fragment && this.iframe) {
	        current = this.getFragment(this.getHash(this.iframe));
	      }
	      if (current === this.fragment) return false;
	      if (this.iframe) this.navigate(current);
	      this.loadUrl();
	    },
	
	    // Attempt to load the current URL fragment. If a route succeeds with a
	    // match, returns `true`. If no defined routes matches the fragment,
	    // returns `false`.
	    loadUrl: function(fragment) {
	      fragment = this.fragment = this.getFragment(fragment);
	      return _.any(this.handlers, function(handler) {
	        if (handler.route.test(fragment)) {
	          handler.callback(fragment);
	          return true;
	        }
	      });
	    },
	
	    // Save a fragment into the hash history, or replace the URL state if the
	    // 'replace' option is passed. You are responsible for properly URL-encoding
	    // the fragment in advance.
	    //
	    // The options object can contain `trigger: true` if you wish to have the
	    // route callback be fired (not usually desirable), or `replace: true`, if
	    // you wish to modify the current URL without adding an entry to the history.
	    navigate: function(fragment, options) {
	      if (!History.started) return false;
	      if (!options || options === true) options = {trigger: !!options};
	
	      var url = this.root + (fragment = this.getFragment(fragment || ''));
	
	      // Strip the hash for matching.
	      fragment = fragment.replace(pathStripper, '');
	
	      if (this.fragment === fragment) return;
	      this.fragment = fragment;
	
	      // Don't include a trailing slash on the root.
	      if (fragment === '' && url !== '/') url = url.slice(0, -1);
	
	      // If pushState is available, we use it to set the fragment as a real URL.
	      if (this._hasPushState) {
	        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
	
	      // If hash changes haven't been explicitly disabled, update the hash
	      // fragment to store history.
	      } else if (this._wantsHashChange) {
	        this._updateHash(this.location, fragment, options.replace);
	        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
	          // Opening and closing the iframe tricks IE7 and earlier to push a
	          // history entry on hash-tag change.  When replace is true, we don't
	          // want this.
	          if(!options.replace) this.iframe.document.open().close();
	          this._updateHash(this.iframe.location, fragment, options.replace);
	        }
	
	      // If you've told us that you explicitly don't want fallback hashchange-
	      // based history, then `navigate` becomes a page refresh.
	      } else {
	        return this.location.assign(url);
	      }
	      if (options.trigger) return this.loadUrl(fragment);
	    },
	
	    // Update the hash location, either replacing the current entry, or adding
	    // a new one to the browser history.
	    _updateHash: function(location, fragment, replace) {
	      if (replace) {
	        var href = location.href.replace(/(javascript:|#).*$/, '');
	        location.replace(href + '#' + fragment);
	      } else {
	        // Some browsers require that `hash` contains a leading #.
	        location.hash = '#' + fragment;
	      }
	    }
	
	  });
	
	  // Create the default Backbone.history.
	  Backbone.history = new History;
	
	  // Helpers
	  // -------
	
	  // Helper function to correctly set up the prototype chain, for subclasses.
	  // Similar to `goog.inherits`, but uses a hash of prototype properties and
	  // class properties to be extended.
	  var extend = function(protoProps, staticProps) {
	    var parent = this;
	    var child;
	
	    // The constructor function for the new subclass is either defined by you
	    // (the "constructor" property in your `extend` definition), or defaulted
	    // by us to simply call the parent's constructor.
	    if (protoProps && _.has(protoProps, 'constructor')) {
	      child = protoProps.constructor;
	    } else {
	      child = function(){ return parent.apply(this, arguments); };
	    }
	
	    // Add static properties to the constructor function, if supplied.
	    _.extend(child, parent, staticProps);
	
	    // Set the prototype chain to inherit from `parent`, without calling
	    // `parent`'s constructor function.
	    var Surrogate = function(){ this.constructor = child; };
	    Surrogate.prototype = parent.prototype;
	    child.prototype = new Surrogate;
	
	    // Add prototype properties (instance properties) to the subclass,
	    // if supplied.
	    if (protoProps) _.extend(child.prototype, protoProps);
	
	    // Set a convenience property in case the parent's prototype is needed
	    // later.
	    child.__super__ = parent.prototype;
	
	    return child;
	  };
	
	  // Set up inheritance for the model, collection, router, view and history.
	  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;
	
	  // Throw an error when a URL is needed, and none is supplied.
	  var urlError = function() {
	    throw new Error('A "url" property or function must be specified');
	  };
	
	  // Wrap an optional error callback with a fallback error event.
	  var wrapError = function(model, options) {
	    var error = options.error;
	    options.error = function(resp) {
	      if (error) error(model, resp, options);
	      model.trigger('error', model, resp, options);
	    };
	  };
	
	  return Backbone;
	
	}));


/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_5__;

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_6__;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	// Optimized Model.set functions
	//---------------------------------
	/*
	 Does two main things:
	 1) Invoke model-specific constructor for attributes cloning. It improves performance on large model updates.
	 2) Invoke attribute-specific comparison function. Improves performance for everything, especially nested stuff.
	
	 attrSpec is required to provide two methods:
	 transform( value, options, model, name ) -> value
	 to transform value before assignment
	
	 isChanged( value1, value2 ) -> bool
	 to detect whenever attribute must be assigned and counted as changed
	
	 Model is required to implement Attributes constructor for attributes cloning.
	 */
	
	// Special case set: used from model's native properties.
	// Single attribute change, no options, _no_ _nested_ _changes_ detection on deep update.
	// 1) Code is stripped for this special case
	// 2) attribute-specific transform function invoked internally
	
	var _        = __webpack_require__( 5 ),
	    Events   = __webpack_require__( 2 ).Events,
	    error    = __webpack_require__( 8 ),
	    trigger2 = Events.trigger2,
	    trigger3 = Events.trigger3;
	
	module.exports = {
	    isChanged     : genericIsChanged,
	    setSingleAttr : setSingleAttr,
	    setAttrs      : setAttrs,
	    transaction   : transaction,
	    transform     : applyTransform,
	    __begin       : __begin,
	    __commit      : __commit
	};
	
	function genericIsChanged( a, b ){
	    return !( a === b || ( a && b && typeof a == 'object' && typeof b == 'object' && _.isEqual( a, b ) ) );
	}
	
	function setSingleAttr( model, key, value, attrSpec ){
	    'use strict';
	    var changing = model._changing,
	        current  = model.attributes;
	
	    model._changing = true;
	
	    if( !changing ){
	        model._previousAttributes = new model.Attributes( current );
	        model.changed             = {};
	    }
	
	    var prev      = model._previousAttributes,
	        options   = {},
	        val       = attrSpec.transform( value, options, model, key ),
	        isChanged = attrSpec.isChanged;
	
	    isChanged( prev[ key ], val ) ? model.changed[ key ] = val : delete model.changed[ key ];
	
	    if( isChanged( current[ key ], val ) ){
	        current[ key ] = val;
	        model._pending = options;
	        trigger3( model, 'change:' + key, model, val, options );
	    }
	
	    if( changing ){
	        return model;
	    }
	
	    while( model._pending ){
	        options        = model._pending;
	        model._pending = false;
	        trigger2( model, 'change', model, options );
	    }
	
	    model._pending  = false;
	    model._changing = false;
	    return model;
	}
	
	
	// call a_fun with a_args inside of set transaction.
	// model.set inside of a_fun will trigger change:attr
	// but only single 'change' will be triggered at the end of transaction
	// transactions can be nested
	function transaction( a_fun, context, args ){
	    var notChanging = !this._changing,
	        options  = {};
	
	    this._changing = true;
	
	
	    if( notChanging ){
	        this._previousAttributes = new this.Attributes( this.attributes );
	        this.changed             = {};
	    }
	
	    this.__begin();
	    var res = a_fun.apply( context || this, args );
	    this.__commit();
	
	    if( notChanging ){
	        while( this._pending ){
	            options       = this._pending;
	            this._pending = false;
	            trigger2( this, 'change', this, options );
	        }
	
	        this._pending  = false;
	        this._changing = false;
	    }
	
	    return res;
	}
	
	// General case set: used for multiple and nested model/collection attributes.
	// Does _not_ invoke attribute transform! It must be done at the the top level,
	// due to the problems with current nested changes detection algorithm. See 'setAttrs' function below.
	function bbSetAttrs( model, attrs, opts ){
	    'use strict';
	    var options = opts || {};
	
	    // Run validation.
	    if( !model._validate( attrs, options ) ){
	        return false;
	    }
	
	    // Extract attributes and options.
	    var unset     = options.unset,
	        silent    = options.silent,
	        changes   = [],
	        changing  = model._changing,
	        current   = model.attributes,
	        attrSpecs = model.__attributes;
	
	    model._changing = true;
	
	    if( !changing ){
	        model._previousAttributes = new model.Attributes( current );
	        model.changed             = {};
	    }
	
	    var prev = model._previousAttributes;
	
	    // For each `set` attribute, update or delete the current value.
	    for( var attr in attrs ){
	        var attrSpec  = attrSpecs[ attr ],
	            isChanged = attrSpec ? attrSpec.isChanged : genericIsChanged,
	            val       = attrs[ attr ];
	
	        if( isChanged( current[ attr ], val ) ){
	            changes.push( attr );
	        }
	
	        if( isChanged( prev[ attr ], val ) ){
	            model.changed[ attr ] = val;
	        }
	        else{
	            delete model.changed[ attr ];
	        }
	
	        unset ? delete current[ attr ] : current[ attr ] = val;
	    }
	
	    // Trigger all relevant attribute changes.
	    if( !silent ){
	        if( changes.length ){
	            model._pending = options;
	        }
	        for( var i = 0, l = changes.length; i < l; i++ ){
	            attr = changes[ i ];
	            trigger3( model, 'change:' + attr, model, current[ attr ], options );
	        }
	    }
	
	    // You might be wondering why there's a `while` loop here. Changes can
	    // be recursively nested within `"change"` events.
	    if( changing ){
	        return model;
	    }
	    if( !silent ){
	        while( model._pending ){
	            options        = model._pending;
	            model._pending = false;
	            trigger2( model, 'change', model, options );
	        }
	    }
	
	    model._pending  = false;
	    model._changing = false;
	
	    return model;
	}
	
	// Optimized Backbone Core functions
	// =================================
	// Deep set model attributes, catching nested attributes changes
	function setAttrs( model, attrs, options ){
	    model.__begin();
	
	    applyTransform( model, attrs, model.__attributes, options );
	
	    return model.__commit( attrs, options );
	}
	
	// transform attributes hash
	function applyTransform( model, attrs, attrSpecs, options ){
	    for( var name in attrs ){
	        var attrSpec = attrSpecs[ name ], value = attrs[ name ];
	        if( attrSpec ){
	            attrs[ name ] = attrSpec.transform( value, options, model, name );
	        }
	        else{
	            error.unknownAttribute( model, name, value );
	        }
	    }
	}
	
	function __begin(){
	    this.__duringSet++ || ( this.__nestedChanges = {} );
	}
	
	function __commit( a_attrs, options ){
	    var attrs = a_attrs;
	
	    if( !--this.__duringSet ){
	        var nestedChanges = this.__nestedChanges,
	            attributes    = this.attributes;
	
	        attrs || ( attrs = {} );
	
	        // Catch nested changes.
	        for( var name in nestedChanges ){
	            var value = name in attrs ? attrs[ name ] : attrs[ name ] = nestedChanges[ name ];
	
	            if( value === attributes[ name ] ){
	                // patch attributes to force change:name event
	                attributes[ name ] = null;
	            }
	        }
	
	        this.__nestedChanges = {};
	    }
	
	    if( attrs ){
	        return bbSetAttrs( this, attrs, options );
	    }

		return this;
	}

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__( 3 );
	
	function format( value ){
	    return typeof value === 'string' ? '"' + value + '"' : value;
	}
	
	Object.assign( Object.extend.error, {
	    argumentIsNotAnObject : function( context, value ){
	        //throw new TypeError( 'Attribute hash is not an object in ' + context.__class + '.set(', value, ')' );
	        console.error( '[Type Error] Attribute hash is not an object in ' +
	                       context.__class + '.set(', format( value ), '); this =', context );
	    },
	
	    wrongWatcher : function( context, ref ){
	        console.warn( "[Reference Error] Attribute's .has.watcher(", ref, ") must be string reference or function; attr=", context );
	    },
	
	    unknownAttribute : function( context, name, value ){
	        if( context.suppressTypeErrors ) return;
	
	        console.warn( '[Type Error] Attribute has no default value in ' +
	                        context.__class + '.set( "' + name + '",', format( value ), '); this =', context );
	    },
	
	    hardRefNotAssignable : function( context, name, value ){
	        if( context.suppressTypeErrors ) return;
	
	        console.warn( '[Type Error] Hard reference cannot be assigned in ' +
	                        context.__class + '.set( "' + name + '",', format( value ), '); this =', context );
	    },
	
	    wrongCollectionSetArg : function( context, value ){
	        //throw new TypeError( 'Wrong argument type in ' + context.__class + '.set(' + value + ')' );
	        console.error( '[Type Error] Wrong argument type in ' +
	                       context.__class + '.set(', format( value ), '); this =', context );
	    },
	
	    serializeSharedObject : function( context, name, value ){
	      console.warn( '[Ownership Error] Shared model/collection is being serialized to JSON, in ' +
	                     context.__class + '.' + name + '==', value, '; this =', context );
	    }
	});
	
	module.exports = Object.extend.error;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	// Options wrapper for chained and safe type specs...
	// --------------------------------------------------
	__webpack_require__( 3 );
	
	var trigger3         = __webpack_require__( 2 ).Events.trigger3,
	    modelSet         = __webpack_require__( 7 ),
	    error            = __webpack_require__( 8 ),
	    genericIsChanged = modelSet.isChanged,
	    setSingleAttr    = modelSet.setSingleAttr;
	
	var primitiveTypes = {
	    string  : String,
	    number  : Number,
	    boolean : Boolean
	};
	
	// list of simple accessor methods available in options
	var availableOptions = [ 'triggerWhenChanged', 'changeEvents', 'parse', 'clone', 'toJSON', 'value', 'cast', 'create', 'name', 'value',
	                         'type' ];
	
	function parseReference( ref ){
	    switch( typeof ref ){
	        case 'string' :
	            var path     = ( 'self.' + ref.replace( /\^/g, 'getOwner().' ) ).split( '.' ),
	                callback = path.pop(),
	                context  = new Function( 'self', 'return ' + path.join( '.' ) );
	
	            return function( value ){
	                var self = context( this );
	
	                if( self && self[ callback ] ){
	                    self[ callback ]( value, this );
	                }
	
	                return value;
	            };
	        case 'function' :
	            return function( value ){
	                ref.call( this, value, this );
	                return value;
	            };
	    }
	}
	
	var Options = Object.extend( {
	    _options : {}, // attribute options
	
	    Attribute : null, // default attribute spec when no type is given, is set to Attribute below
	
	    properties : {
	        has : function(){ return this; }
	    },
	
	    constructor : function( spec ){
	        // special option used to guess types of primitive values and to distinguish value from type
	        if( 'typeOrValue' in spec ){
	            var typeOrValue   = spec.typeOrValue,
	                primitiveType = primitiveTypes[ typeof typeOrValue ];
	
	            if( primitiveType ){
	                spec = { type : primitiveType, value : typeOrValue };
	            }
	            else{
	                spec = typeof typeOrValue == 'function' ? { type : typeOrValue } : { value : typeOrValue };
	            }
	        }
	
	        this._options = {};
	        this.options( spec );
	    },
	
	    watcher : function( ref ){
	        var callback = parseReference( ref );
	        if( callback ){
	            this.set( callback );
	        }
	        else{
	            error.wrongWatcher( this, ref );
	        }
	
	        return this;
	    },
	
	    proxy : function( attrs ){
	        this._options.proxy = attrs || true;
	        return this;
	    },
	
	    // get hooks stored as an array
	    get : function( getter ){
	        var options = this._options;
	        options.get = options.get ? options.get.unshift( getter ) : [ getter ];
	        return this;
	    },
	
	    // set hooks stored as an array
	    set : function( setter ){
	        var options = this._options;
	        options.set = options.set ? options.set.push( setter ) : [ setter ];
	        return this;
	    },
	
	    // events must be merged
	    events : function( events ){
	        this._options.events = Object.assign( this._options.events || {}, events );
	        return this;
	    },
	
	    // options must be merged using rules for individual accessors
	    options : function( options ){
	        for( var i in options ){
	            this[ i ]( options[ i ] );
	        }
	
	        return this;
	    },
	
	    // construct attribute with a given name and proper type.
	    createAttribute : function( name ){
	        var options = this._options,
	            Type    = options.type ? options.type.Attribute : this.Attribute;
	
	        if( options.changeEvents ) options.triggerWhenChanged = options.changeEvents;
	
	        if( options.proxy && typeof options.proxy === 'string' && !options.triggerWhenChanged ){
	            options.triggerWhenChanged = options.proxy
	                                                .split( ' ' )
	                                                .map( function( attr ){
	                                                    return 'change:' + attr;
	                                                } ).join( ' ' );
	        }
	
	        return new Type( name, options );
	    }
	} );
	
	availableOptions.forEach( function( name ){
	    Options.prototype[ name ] = function( value ){
	        this._options[ name ] = value;
	        return this;
	    };
	} );
	
	function chainHooks( array ){
	    var l = array.length;
	
	    return l === 1 ? array[ 0 ] : function( value, name ){
	        var res = value;
	        for( var i = 0; i < l; i++ ){
	            res = array[ i ].call( this, res, name );
	        }
	        return res;
	    };
	}
	
	var transform = {
	    hookAndCast : function( val, options, model, name ){
	        var value = this.cast( val, options, model, name ),
	            prev  = model.attributes[ name ];
	
	        if( this.isChanged( value, prev ) ){
	            value = this.set.call( model, value, name );
	            return value === undefined ? prev : this.cast( value, options, model );
	        }
	
	        return value;
	    },
	
	    hook : function( value, options, model, name ){
	        var prev = model.attributes[ name ];
	
	        if( this.isChanged( value, prev ) ){
	            var changed = this.set.call( model, value, name );
	            return changed === undefined ? prev : changed;
	        }
	
	        return value;
	    },
	
	    delegateAndMore : function( val, options, model, attr ){
	        return this.delegateEvents( this._transform( val, options, model, attr ), options, model, attr );
	    }
	};
	
	// Base class for Attribute metatype
	// ---------------------------------
	function proxyProperty( first, second ){
	    return {
	        get : function(){
	            return this[ first ][ second ];
	        },
	
	        set : function( value ){
	            this[ first ][ second ] = value;
	        }
	    }
	}
	
	function proxyFunction( first, second ){
	    return function(){
	        var self = this[ first ];
	        return self[ second ].apply( self, arguments );
	    }
	}
	
	var Attribute = Object.extend( {
	    name  : null,
	    type  : null,
	    value : undefined,
	
	    // cast function
	    // may be overriden in subclass
	    cast : null, // function( value, options, model ),
	
	    // get and set hooks...
	    get : null,
	    set : null,
	
	    // user events
	    events : null, // { event : handler, ... }
	
	    // system events
	    __events : null, // { event : handler, ... }
	
	    // create empty object passing backbone options to constructor...
	    // must be overriden for backbone types only
	    create : function( options ){ return new this.type(); },
	
	    // optimized general purpose isEqual function for typeless attributes
	    // must be overriden in subclass
	    isChanged : genericIsChanged,
	
	    // generic clone function for typeless attributes
	    // Must be overriden in sublass
	    clone : function( value, options ){
	        if( value && typeof value === 'object' ){
	            var proto = Object.getPrototypeOf( value );
	
	            if( proto.clone ){
	                // delegate to object's clone if it exist
	                return value.clone( options );
	            }
	
	            if( options && options.deep && proto === Object.prototype || proto === Array.prototype ){
	                // attempt to deep copy raw objects, assuming they are JSON
	                return JSON.parse( JSON.stringify( value ) );
	            }
	        }
	
	        return value;
	    },
	
	    toJSON : function( value, key ){
	        return value && value.toJSON ? value.toJSON() : value;
	    },
	
	    // must be overriden for backbone types...
	    createPropertySpec : function(){
	        return (function( self, name, get ){
	            return {
	                // call to optimized set function for single argument. Doesn't work for backbone types.
	                set : function( value ){ setSingleAttr( this, name, value, self ); },
	
	                // attach get hook to the getter function, if present
	                get : get ? function(){ return get.call( this, this.attributes[ name ], name ); } :
	                      function(){ return this.attributes[ name ]; }
	            }
	        })( this, this.name, this.get );
	    },
	
	    attachMixins : function( spec ){
	        var type  = this.type,
	            proto = type && type.prototype;
	
	        if( type && this.proxy ){
	            var keys = typeof this.proxy === 'string' ? this.proxy.split( ' ' ) : _.allKeys( proto ).concat(
	                _.keys( proto.properties ) );
	
	            // for each enumerable property...
	            for( var i = 0; i < keys.length; i++ ){
	                var name = keys[ i ];
	
	                // ...which is not defined in target class
	                if( name in spec ) continue;
	
	                var prop = Object.getPropertyDescriptor( proto, name );
	
	                // create proxy function, if it the function...
	                if( typeof prop.value === 'function' ){
	                    spec[ name ] = proxyFunction( this.name, name );
	                }
	                // ...or create native property, if it's the property.
	                else if( prop.get ){
	                    Object.defineProperty( spec, name, proxyProperty( this.name, name ) );
	                }
	            }
	        }
	    },
	
	    // automatically generated optimized transform function
	    // do not touch.
	    _transform : null,
	    transform  : function( value ){ return value; },
	
	    // delegate user and system events on attribute transform
	    delegateEvents : function( value, options, model, name ){
	        var prev = model.attributes[ name ];
	
	        if( this.isChanged( prev, value ) ){ //should be changed only when attr is really replaced.
	            prev && prev.trigger && model.stopListening( prev );
	
	            if( value && value.trigger ){
	                if( this.events ){
	                    model.listenTo( value, this.events );
	                }
	                if( this.__events ){
	                    model.listenTo( value, this.__events );
	                }
	            }
	
	            trigger3( model, 'replace:' + name, model, value, prev );
	        }
	
	        return value;
	    },
	
	    constructor : function( name, spec ){
	        this.name = name;
	
	        Object.transform( this, spec, function( value, name ){
	            if( name === 'events' && this.events ){
	                return Object.assign( this.events, value );
	            }
	
	            if( name === 'get' ){
	                if( this.get ){
	                    value.unshift( this.get );
	                }
	                return chainHooks( value );
	            }
	
	            if( name === 'set' ){
	                if( this.set ){
	                    value.push( this.set );
	                }
	                return chainHooks( value );
	            }
	
	            return value;
	        }, this );
	
	        this.initialize( spec );
	
	        // assemble optimized transform function...
	        if( this.cast ){
	            this.transform = this._transform = this.cast;
	        }
	        if( this.set ){
	            this.transform = this._transform = this.cast ? transform.hookAndCast : transform.hook;
	        }
	        if( this.events || this.__events ){
	            this.transform =
	                this._transform ? transform.delegateAndMore : this.delegateEvents;
	        }
	    }
	}, {
	    attach : (function(){
	        function options( spec ){
	            spec || ( spec = {} );
	            spec.type || ( spec.type = this );
	            return new Options( spec );
	        }
	
	        function value( value ){
	            return new Options( { type : this, value : value } );
	        }
	
	        return function(){
	            for( var i = 0; i < arguments.length; i++ ){
	                var Type       = arguments[ i ];
	                Type.attribute = Type.options = options;
	                Type.value     = value;
	                Type.Attribute = this;
	                Object.defineProperty( Type, 'has', {
	                    get : function(){
	                        // workaround for sinon.js and other libraries overriding 'has'
	                        return this._has || this.options();
	                    },
	                    set : function( value ){ this._has = value; }
	                } );
	            }
	        };
	    })()
	} );
	
	Options.prototype.Attribute = Attribute;
	Options.prototype.attribute = Options.prototype.options;
	
	function createOptions( spec ){
	    return new Options( spec );
	}
	
	createOptions.Type   = Attribute;
	createOptions.create = function( options, name ){
	    if( !( options && options instanceof Options ) ){
	        options = new Options( { typeOrValue : options } );
	    }
	
	    return options.createAttribute( name );
	};
	
	module.exports = createOptions;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__( 2 ),
	    Model    = __webpack_require__( 1 ),
	    error    = __webpack_require__( 8 ),
	    _        = __webpack_require__( 5 );
	
	var CollectionProto = Backbone.Collection.prototype;
	
	function transaction( func ){
	    return function(){
	        this.__changing++ || ( this._changed = false );
	
	        var res = func.apply( this, arguments );
	
	        --this.__changing || ( this._changed && this.trigger( this.triggerWhenChanged, this ) );
	
	        return res;
	    };
	}
	
	function handleChange(){
	    if( this.__changing ){
	        this._changed = true;
	    }
	    else{
	        this.trigger( this.triggerWhenChanged, this );
	    }
	}
	
	module.exports = Backbone.Collection.extend( {
	    triggerWhenChanged : 'changes',
	    _listenToChanges : Backbone.VERSION >= '1.2.0' ? 'update change reset' : 'add remove change reset',
	    __class            : 'Collection',
	
	    model : Model,
	
	    _owner : null,
	    _store : null,
	
	    __changing : 0,
	    _changed : false,
	
	    // ATTENTION: Overriden backbone logic with bug fixes
	    constructor : function( models, options ){
	        options || (options = {});
	        if (options.model) this.model = options.model;
	        if (options.comparator !== void 0) this.comparator = options.comparator;
	        this._reset();
	
	        this.__changing = 0;
	        this._changed = false;
	        if (models) this.reset( models, options );
	        this.listenTo( this, this._listenToChanges, handleChange );
	        this.initialize.apply(this, arguments);
	    },
	
	    getStore : function(){
	        return this._store || ( this._store = this._owner ? this._owner.getStore() : this._defaultStore );
	    },
	
	    sync : function(){
	      return this.getStore().sync.apply( this, arguments );
	    },
	
	    isValid : function( options ){
	        return this.every( function( model ){
	            return model.isValid( options );
	        } );
	    },
	
	    // Toggle model in collection
	    toggle : function( model, a_next ){
	        var prev = Boolean( this.get( model ) ),
	            next = a_next === void 0 ? !prev : Boolean( a_next );
	
	        if( prev !== next ){
	            if( prev ){
	                this.remove( model );
	            }
	            else{
	                this.add( model );
	            }
	        }
	
	        return next;
	    },
	
		// ATTENTION: Overriden backbone logic with bug fixes
	    get : function( obj ){
	        if( obj == null ){ return void 0; }
	
	        if( typeof obj === 'object' ){
	            return this._byId[ obj[ this.model.prototype.idAttribute ] ] || this._byId[ obj.cid ];
	        }
	
	        return this._byId[ obj ];
	    },
	
	    deepClone : function(){ return this.clone( { deep : true } ); },
	
	    clone : function( options ){
	        var models = options && options.deep ?
	                     this.map( function( model ){
	                         return model.clone( options );
	                     } ) : this.models;
	
	        return new this.constructor( models );
	    },
	
	    set : transaction( function( models, options ){
	        if( models ){
	            if( typeof models !== 'object' || !( models instanceof Array || models instanceof Model ||
	                Object.getPrototypeOf( models ) === Object.prototype ) ){
	                error.wrongCollectionSetArg( this, models );
	            }
	        }
	
	        return CollectionProto.set.call( this, models, options );
	    } ),
	
	    transaction : function( func, self, args ){
	        return transaction( func ).apply( self || this, args );
	    },
	
	    remove : transaction( CollectionProto.remove ),
	    add    : transaction( CollectionProto.add ),
	    reset  : transaction( CollectionProto.reset ),
	    sort   : transaction( CollectionProto.sort ),
	
	    getModelIds : function(){ return _.pluck( this.models, 'id' ); },
	
	    createSubset : function( models, options ){
	        var SubsetOf = this.constructor.subsetOf( this ).createAttribute().type;
	        var subset = new SubsetOf( models, options );
	        subset.resolve( this );
	        return subset;
	    }
	}, {
	    // Cache for subsetOf collection subclass.
	    __subsetOf : null,
	    defaults   : function( attrs ){
	        return this.prototype.model.extend( { defaults : attrs } ).Collection;
	    },
	    extend     : function(){
	        // Need to subsetOf cache when extending the collection
	        var This = Backbone.Collection.extend.apply( this, arguments );
	        This.__subsetOf = null;
	        return This;
	    }
	} );


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// Nested Relations
	//=================
	
	var bbVersion  = __webpack_require__( 2 ).VERSION,
	    attribute  = __webpack_require__( 9 ),
	    error      = __webpack_require__( 8 ),
	    Collection = __webpack_require__( 10 ),
	    _          = __webpack_require__( 5 );
	
	function parseReference( collectionRef ){
	    switch( typeof collectionRef ){
	        case 'function' :
	            return collectionRef;
	        case 'object'   :
	            return function(){ return collectionRef; };
	        case 'string'   :
	            var path = collectionRef
	                .replace( /\^/g, 'getOwner().' )
	                .replace( /^\~/, 'store.' )
	                .replace( /^store\.(\w+)/, 'getStore().get("$1")' );
	
	            return new Function( 'return this.' + path );
	    }
	}
	
	exports.parseReference = parseReference;
	
	var TakeAttribute = attribute.Type.extend( {
	    clone     : function( value ){ return value; },
	    isChanged : function( a, b ){ return a !== b; },
	    set       : function( value, name ){
	        if( !value ) return null;
	
	        error.hardRefNotAssignable( this, name, value );
	    },
	
	    _update : function( val, options, model, attr ){
	        return this.delegateEvents( this.cast( val, options, model, attr ), options, model, attr );
	    }
	} );
	
	exports.take = function( reference ){
	    var getMaster = parseReference( reference );
	
	    var options = attribute( {
	        value  : null,
	        toJSON : false,
	        type   : this,
	        get    : function( ref, name ){
	            if( !ref ){
	                // Resolve reference.
	                var value = getMaster.call( this );
	
	                if( value ){
	                    // Silently update attribute with object from master.
	                    // Subscribe for all events...
	                    var attrSpec = this.__attributes[ name ];
	                    return this.attributes[ name ] = attrSpec._update( value, {}, this, name );
	                }
	            }
	
	            return ref;
	        }
	    } );
	
	    options.Attribute = TakeAttribute;
	    return options;
	};
	
	exports.from = function( masterCollection ){
	    var getMaster = parseReference( masterCollection );
	
	    function clone( value ){
	        return value && typeof value === 'object' ? value.id : value;
	    }
	
	    var ModelRefAttribute = attribute.Type.extend( {
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
	                    objOrId                 = master.get( objOrId ) || null;
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
	    } );
	
	    var options       = attribute( { value : null } );
	    options.Attribute = ModelRefAttribute; //todo: consider moving this to the attrSpec
	    return options;
	};
	
	var CollectionProto = Collection.prototype;
	
	var refsCollectionSpec = {
	    _listenToChanges : bbVersion >= '1.2.0' ? 'update reset' : 'add remove reset', // don't bubble changes from models
	    __class          : 'Collection.SubsetOf',
	
	    resolvedWith : null,
	    refs         : null,
	
	    toJSON : function(){
	        return this.refs || _.pluck( this.models, 'id' );
	    },
	
	    clone : function( options ){
	        var copy          = CollectionProto.clone.call( this, _.omit( options, 'deep' ) );
	        copy.resolvedWith = this.resolvedWith;
	        copy.refs         = this.refs;
	
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
	
	    toggle : function( modelOrId, val ){
	        var model = this.resolvedWith.get( modelOrId );
	        return CollectionProto.toggle.call( this, model, val );
	    },
	
	    addAll : function(){
	        this.reset( this.resolvedWith.models );
	    },
	
	    removeAll : function(){
	        this.reset();
	    },
	
	    toggleAll : function(){
	        if( this.length ){
	            this.removeAll();
	        }
	        else{
	            this.addAll();
	        }
	    },
	
	    getModelIds : function(){ return this.refs || _.pluck( this.models, 'id' ); },
	
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
	
	exports.subsetOf = function( masterCollection ){
	    var SubsetOf  = this.__subsetOf || ( this.__subsetOf = this.extend( refsCollectionSpec ) );
	    var getMaster = parseReference( masterCollection );
	
	    return attribute( {
	        type : SubsetOf,
	
	        get : function( refs ){
	            !refs || refs.resolvedWith || refs.resolve( getMaster.call( this ) );
	            return refs;
	        }
	    } );
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	// Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
	// (c) 2011 Colin Snover <http://zetafleet.com>
	// Released under MIT license.
	
	// Attribute Type definitions for core JS types
	// ============================================
	var attribute  = __webpack_require__( 9 ),
	    modelSet   = __webpack_require__( 7 ),
	    Model      = __webpack_require__( 1 ),
	    errors     = __webpack_require__( 8 ),
	    Collection = __webpack_require__( 10 );
	
	// Constructors Attribute
	// ----------------
	attribute.Type.extend( {
	    cast : function( value ){
	        return value == null || value instanceof this.type ? value : new this.type( value );
	    },
	
	    clone : function( value, options ){
	        // delegate to clone function or deep clone through serialization
	        return value.clone ? value.clone( value, options ) : this.cast( JSON.parse( JSON.stringify( value ) ) );
	    }
	} ).attach( Function.prototype );
	
	// Date Attribute
	// ----------------------
	var numericKeys    = [ 1, 4, 5, 6, 7, 10, 11 ],
	    msDatePattern  = /\/Date\(([0-9]+)\)\//,
	    isoDatePattern = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;
	
	function parseDate( date ){
	    var msDate, timestamp, struct, minutesOffset = 0;
	
	    if( msDate = msDatePattern.exec( date ) ){
	        timestamp = Number( msDate[ 1 ] );
	    }
	    else if( ( struct = isoDatePattern.exec( date )) ){
	        // avoid NaN timestamps caused by undefined values being passed to Date.UTC
	        for( var i = 0, k; ( k = numericKeys[ i ] ); ++i ){
	            struct[ k ] = +struct[ k ] || 0;
	        }
	
	        // allow undefined days and months
	        struct[ 2 ] = (+struct[ 2 ] || 1) - 1;
	        struct[ 3 ] = +struct[ 3 ] || 1;
	
	        if( struct[ 8 ] !== 'Z' && struct[ 9 ] !== undefined ){
	            minutesOffset = struct[ 10 ] * 60 + struct[ 11 ];
	
	            if( struct[ 9 ] === '+' ){
	                minutesOffset = 0 - minutesOffset;
	            }
	        }
	
	        timestamp =
	            Date.UTC( struct[ 1 ], struct[ 2 ], struct[ 3 ], struct[ 4 ], struct[ 5 ] + minutesOffset, struct[ 6 ],
	                struct[ 7 ] );
	    }
	    else{
	        timestamp = Date.parse( date );
	    }
	
	    return timestamp;
	}
	
	attribute.Type.extend( {
	    cast : function( value ){
	        return value == null || value instanceof Date ? value :
	               new Date( typeof value === 'string' ? parseDate( value ) : value )
	    },
	
	    toJSON : function( value ){ return value && value.toJSON(); },
	
	    isChanged : function( a, b ){ return ( a && +a ) !== ( b && +b ); },
	    clone     : function( value ){ return value && new Date( +value ); }
	} ).attach( Date );
	
	// Primitive Types
	// ----------------
	// Global Mock for missing Integer data type...
	// -------------------------------------
	Integer = function( x ){ return x ? Math.round( x ) : 0; };
	
	attribute.Type.extend( {
	    create : function(){ return this.type(); },
	
	    toJSON : function( value ){ return value; },
	    cast   : function( value ){ return value == null ? null : this.type( value ); },
	
	    isChanged : function( a, b ){ return a !== b; },
	
	    clone : function( value ){ return value; }
	} ).attach( Number, Boolean, String, Integer );
	
	// Array Type
	// ---------------
	attribute.Type.extend( {
	    toJSON : function( value ){ return value; },
	    cast   : function( value ){
	        // Fix incompatible constructor behaviour of Array...
	        return value == null || value instanceof Array ? value : [ value ];
	    }
	} ).attach( Array );
	
	// Backbone Attribute
	// ----------------
	
	// helper attrSpec mock to force attribute update
	var bbForceUpdateAttr = new ( attribute.Type.extend( {
	    isChanged : function(){ return true; }
	} ) );
	
	var setAttrs      = modelSet.setAttrs,
	    setSingleAttr = modelSet.setSingleAttr;
	
	attribute.Type.extend( {
	    create : function( options ){ return new this.type( null, options ); },
	    clone  : function( value, options ){ return value && value.clone( options ); },
	    toJSON : function( value, name ){
	      if( value && value._owner !== this ){
	        errors.serializeSharedObject( this, name, value );
	      }
	
	      return value && value.toJSON();
	    },
	
	    isChanged : function( a, b ){ return a !== b; },
	
	    isBackboneType : true,
	    isModel        : true,
	
	    createPropertySpec : function(){
	        // if there are nested changes detection enabled, disable optimized setter
	        if( this.__events ){
	            return (function( self, name, get ){
	                return {
	                    set : function( value ){
	                        var attrs = {};
	                        attrs[ name ] = value;
	                        setAttrs( this, attrs );
	                    },
	
	                    get : get ? function(){ return get.call( this, this.attributes[ name ], name ); } :
	                          function(){ return this.attributes[ name ]; }
	                }
	            })( this, this.name, this.get );
	        }
	        else{
	            return attribute.Type.prototype.createPropertySpec.call( this );
	        }
	    },
	
	    cast : function( value, options, model, name ){
	        var incompatibleType          = value != null && !( value instanceof this.type ),
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
	
	        // handle nested objects ownership
	        if( existingModelOrCollection !== value ){
	          if( existingModelOrCollection && existingModelOrCollection._owner === model ) existingModelOrCollection._owner = null;
	          if( value && !value.collection && !value._owner ) value._owner = model;
	        }
	
	        return value;
	    },
	
	    initialize : function( spec ){
	        var name               = this.name,
	            triggerWhenChanged = this.triggerWhenChanged || spec.type.prototype.triggerWhenChanged;
	
	        this.isModel = this.type === Model || this.type.prototype instanceof Model;
	
	        if( triggerWhenChanged ){
	            this.__events = {};
	            this.__events[ triggerWhenChanged ] = function handleNestedChange(){
	                var attr = this.attributes[ name ];
	
	                if( this.__duringSet ){
	                    this.__nestedChanges[ name ] = attr;
	                }
	                else{
	                    setSingleAttr( this, name, attr, bbForceUpdateAttr );
	                }
	            };
	        }
	    }
	} ).attach( Model, Collection );


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone   = __webpack_require__( 2 ),
	    $          = Backbone.$;
	    Model      = __webpack_require__( 1 ),
	    Collection = __webpack_require__( 10 ),
	    _          = __webpack_require__( 5 );
	
	var _store = null;
	
	var Store = exports.Model = Model.extend({
	  // end store lookup sequence on this class
	  getStore : function(){ return this; },
	
	  sync : function(){ return Backbone.sync.apply( Backbone, arguments ); },
	  // delegate item lookup to owner, and to the global store if undefined
	  get : function( name ){ return this[ name ] || ( this._owner && this._owner.get( name ) ) || _store[ name ]; }
	});
	
	var RestStore = exports.Lazy = Store.extend( {
	    _resolved  : {},
	
	    initialize   : function(){
	        this._resolved = {};
	        var self = this;
	
	        _.each( this.attributes, function( element, name ){
	            if( !element ) return;
	
	            element.store = this;
	
	            var fetch = element.fetch;
	
	            if( fetch ){
	                element.fetch = function(){
	                    self._resolved[ name ] = true;
	                    return fetch.apply( this, arguments );
	                }
	            }
	
	            if( element instanceof Collection && element.length ){
	                this._resolved[name] = true;
	            }
	        }, this );
	    },
	
	    // fetch specified items, or all items if called without arguments.
	    // returns jquery promise
	    fetch : function(){
	        var xhr         = [],
	            objsToFetch = arguments.length ? arguments : _.keys( this.attributes );
	
	        _.each( objsToFetch, function( name ){
	            var attr = this.attributes[name];
	            attr && attr.fetch && xhr.push( attr.fetch() );
	        }, this );
	
	        return $ && $.when && $.when.apply( Backbone.$, xhr );
	    },
	
	    clear : function(){
	        var objsToClear = arguments.length ? arguments : _.keys( this.attributes );
	
	        _.each( objsToClear, function( name ){
	            var element = this.attributes[ name ];
	
	            if( element instanceof Collection ){
	                element.reset();
	            }
	            else if( element instanceof Store ){
	                element.clear();
	            }
	            else if( element instanceof Model ){
	                element.set( element.defaults() )
	            }
	
	            this._resolved[ name ] = false;
	        }, this );
	
	        return this;
	    }
	}, {
	    extend : function( props, staticProps ){
	        var spec = props.defaults || props.attributes;
	
	        // add automatic fetching on first element's access
	        _.each( spec, function( Type, name ){
	            Type.options && ( spec[name] = Type.options( {
	                get : function( value ){
	                    if( !this._resolved[name] ){
	                        value.fetch && value.fetch();
	                        this._resolved[name] = true;
	                    }
	
	                    return value;
	                },
	
	                set : function( value ){
	                    value.length || ( this._resolved[name] = false );
	                    return value;
	                }
	            } ) );
	        } );
	
	        return Model.extend.call( this, props, staticProps )
	    }
	});
	
	// Exports native property spec for model store
	exports.globalProp = {
	    get : function(){ return _store; },
	
	    set : function( store ){
	        if( _store ){
	          _store.stopListening();
	          delete _store.get;
	        }
	
	        Collection.prototype._defaultStore = Model.prototype._defaultStore = _store = store;
	        _store.get = Model.prototype.get;
	    }
	}


/***/ }
/******/ ])
});
;
//# sourceMappingURL=nestedtypes.js.map