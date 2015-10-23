(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("backbone"), require("underscore"));
	else if(typeof define === 'function' && define.amd)
		define(["backbone", "underscore"], factory);
	else if(typeof exports === 'object')
		exports["Nested"] = factory(require("backbone"), require("underscore"));
	else
		root["Nested"] = factory(root["Backbone"], root["_"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_6__) {
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
	    Collection = __webpack_require__( 9 ),
	    relations  = __webpack_require__( 10 ),
	    Backbone   = __webpack_require__( 2 ),
	    _          = __webpack_require__( 6 ),
	    attribute  = __webpack_require__( 8 );
	
	__webpack_require__( 11 );
	
	Collection.subsetOf = relations.subsetOf;
	Model.from          = relations.from;
	Model.Collection    = Collection;
	
	var Store = __webpack_require__( 12 );
	Object.defineProperty( exports, 'store', Store.globalProp );
	
	_.extend( exports, Backbone, {
	    Class     : __webpack_require__( 3 ),
	    error     : __webpack_require__( 7 ),
	    attribute : attribute,
	    options   : attribute,
	
	    value : function( value ){
	        return attribute( { value : value } );
	    },
	
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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone    = __webpack_require__( 2 ),
	    BaseModel   = Backbone.Model,
	    modelSet    = __webpack_require__( 5 ),
	    attrOptions = __webpack_require__( 8 ),
	    error       = __webpack_require__( 7 ),
	    _           = __webpack_require__( 6 ),
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
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_4__;

/***/ },
/* 5 */
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
	
	var _        = __webpack_require__( 6 ),
	    Events   = __webpack_require__( 2 ).Events,
	    error    = __webpack_require__( 7 ),
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
	
	    model.__commit( attrs, options );
	
	    return model;
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
	        bbSetAttrs( this, attrs, options );
	    }
	}

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_6__;

/***/ },
/* 7 */
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
	
	    unknownAttribute : function( context, name, value ){
	        if( context.suppressTypeErrors ) return;
	
	        console.warn( '[Type Error] Attribute has no default value in ' +
	                        context.__class + '.set( "' + name + '",', format( value ), '); this =', context );
	    },
	
	    wrongCollectionSetArg : function( context, value ){
	        //throw new TypeError( 'Wrong argument type in ' + context.__class + '.set(' + value + ')' );
	        console.error( '[Type Error] Wrong argument type in ' +
	                       context.__class + '.set(', format( value ), '); this =', context );
	    },
	
	    serializeSharedObject : function( context, name, value ){
	      console.error( '[Ownership Error] Shared model/collection is being serialized to JSON, in ' +
	                     context.__class + '.' + name + '==', value, '; this =', context );
	    }
	});
	
	module.exports = Object.extend.error;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	// Options wrapper for chained and safe type specs...
	// --------------------------------------------------
	__webpack_require__( 3 );
	
	var trigger3         = __webpack_require__( 2 ).Events.trigger3,
	    modelSet         = __webpack_require__( 5 ),
	    genericIsChanged = modelSet.isChanged,
	    setSingleAttr    = modelSet.setSingleAttr;
	
	var primitiveTypes = {
	    string  : String,
	    number  : Number,
	    boolean : Boolean
	};
	
	// list of simple accessor methods available in options
	var availableOptions = [ 'triggerWhenChanged', 'changeEvents', 'parse', 'clone', 'toJSON', 'value', 'cast', 'create', 'name', 'value',
	                         'type', 'proxy' ];
	
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
	                }).join( ' ' );
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
	        var type = this.type,
	            proto = type && type.prototype;
	
	        if( type && this.proxy ){
	            var keys = typeof this.proxy === 'string' ? this.proxy.split( ' ' ) : _.allKeys( proto );
	
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
	                var Type = arguments[ i ];
	                Type.attribute = Type.options = options;
	                Type.value = value;
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
	
	createOptions.Type = Attribute;
	createOptions.create = function( options, name ){
	    if( !( options && options instanceof Options ) ){
	        options = new Options( { typeOrValue : options } );
	    }
	
	    return options.createAttribute( name );
	};
	
	module.exports = createOptions;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone = __webpack_require__( 2 ),
	    Model    = __webpack_require__( 1 ),
	    error    = __webpack_require__( 7 ),
	    _        = __webpack_require__( 6 );
	
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
	
	    constructor : function(){
	        this.__changing = 0;
	        this._changed = false;
	
	        Backbone.Collection.apply( this, arguments );
	
	        this.listenTo( this, this._listenToChanges, handleChange );
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
	
	    get : function( obj ){
	        if( obj == null ){
	            return void 0;
	        }
	        return typeof obj === 'object' ? this._byId[ obj.id ] || this._byId[ obj.cid ] : this._byId[ obj ];
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
	        return new SubsetOf( models, options );
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
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	// Nested Relations
	//=================
	
	var bbVersion  = __webpack_require__( 4 ).VERSION,
	    attribute  = __webpack_require__( 8 ),
	    Collection = __webpack_require__( 9 ),
	    _          = __webpack_require__( 6 );
	
	function parseReference( collectionRef ){
	    switch( typeof collectionRef ){
	    case 'function' :
	        return collectionRef;
	    case 'object'   :
	        return function(){ return collectionRef; };
	    case 'string'   :
	        var path = collectionRef.split( '.' );
	        if( path[ 0 ] === 'store' ){
	          path[ 0 ] = 'getStore()';
	          path[ 1 ] = 'get("' + path[ 1 ] + '")';
	        }
	
	        return new Function( 'return this.' + path.join( '.' ) );
	    }
	}
	
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
	    } );
	
	    var options = attribute( { value : null } );
	    options.Attribute = ModelRefAttribute; //todo: consider moving this to the attrSpec
	    return options;
	};
	
	var CollectionProto = Collection.prototype;
	
	var refsCollectionSpec = {
	    listenToChanges : bbVersion >= '1.2.0' ? 'update reset' : 'add remove reset', // don't bubble changes from models
	    __class            : 'Collection.SubsetOf',
	
	    resolvedWith : null,
	    refs         : null,
	
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
	
	    toggle : function( modelOrId, inSet ){
	        var model = this.resolvedWith.get( modelOrId ),
	            toggle = inSet === void 0;
	
	        if( this.get( model ) ){
	            if( toggle || !inSet ) this.remove( model );
	        }
	        else{
	            if( toggle || inSet ) this.add( model );
	        }
	    },
	
	    addAll    : function(){
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
	
	    justOne   : function( arg ){
	        var model = arg instanceof Backbone.Model ? arg : this.resolvedWith.get( arg );
	        this.set( [ model ] );
	    },
	
	    set       : function( models, upperOptions ){
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
	    var SubsetOf = this.__subsetOf || ( this.__subsetOf = this.extend( refsCollectionSpec ) );
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
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
	// (c) 2011 Colin Snover <http://zetafleet.com>
	// Released under MIT license.
	
	// Attribute Type definitions for core JS types
	// ============================================
	var attribute  = __webpack_require__( 8 ),
	    modelSet   = __webpack_require__( 5 ),
	    Model      = __webpack_require__( 1 ),
	    errors     = __webpack_require__( 7 ),
	    Collection = __webpack_require__( 9 );
	
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
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone   = __webpack_require__( 2 ),
	    $          = Backbone.$;
	    Model      = __webpack_require__( 1 ),
	    Collection = __webpack_require__( 9 ),
	    _          = __webpack_require__( 6 );
	
	var _store = null;
	
	var Store = exports.Model = Model.extend({
	  // end store lookup sequence on this class
	  getStore : function(){ return this; },
	
	  sync : Backbone.sync,
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