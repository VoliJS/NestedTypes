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
	    Collection = __webpack_require__( 14 ),
	    relations  = __webpack_require__( 18 ),
	    Backbone   = __webpack_require__( 2 ),
	    _          = __webpack_require__( 5 ),
	    attribute  = __webpack_require__( 10 ),
	    Rest       = __webpack_require__( 12 );
	
	Rest.$ = Backbone.$;
	
	__webpack_require__( 19 );
	
	Collection.subsetOf = relations.subsetOf;
	Model.from          = relations.from;
	Model.take          = Collection.take = relations.take;
	
	Model.Collection = Collection;
	
	var Store = __webpack_require__( 20 );
	Object.defineProperty( exports, 'store', Store.globalProp );
	
	exports.store = new Store.Model();
	
	_.extend( exports, Backbone, {
	    Backbone  : Backbone,
	    Class     : __webpack_require__( 3 ),
	    error     : __webpack_require__( 9 ),
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
	} );
	
	function linkProperty( Namespace, name ){
	    return {
	        get : function(){ return Namespace[ name ]; },
	        set : function( value ){ Namespace[ name ] = value; }
	    };
	}
	
	// allow sync and jQuery override
	Object.defineProperties( exports, {
	    'sync'         : linkProperty( Rest, 'sync' ),
	    'errorPromise' : linkProperty( Rest, 'errorPromise' ),
	    'ajax'         : linkProperty( Rest, 'ajax' ),
	    'history'      : linkProperty( Backbone, 'history' ),
	
	    '$' : {
	        get : function(){ return Backbone.$; },
	        set : function( value ){ Backbone.$ = Rest.$ = value; }
	    }
	} );

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone        = __webpack_require__( 2 ),
	    BaseModel       = Backbone.Model,
	    modelSet        = __webpack_require__( 8 ),
	    attrOptions     = __webpack_require__( 10 ),
	    error           = __webpack_require__( 9 ),
	    _               = __webpack_require__( 5 ),
	    ValidationMixin = __webpack_require__( 11 ),
	    RestMixin       = __webpack_require__( 12 ).Model,
	    UnderscoreMixin = __webpack_require__( 13 );
	
	var setSingleAttr  = modelSet.setSingleAttr,
	    setAttrs       = modelSet.setAttrs,
	    applyTransform = modelSet.transform;
	
	function deepCloneAttrs( model, a_attrs ){
	    var attrs     = new model.Attributes( a_attrs ),
	        attrSpecs = model.__attributes,
	        options   = { deep : true };
	
	    model.forEachAttr( attrs, function( value, name ){
	        attrs[ name ] = attrSpecs[ name ].clone( value, options );
	    } );
	
	    return attrs;
	}
	
	var _cidCount = 1;
	
	var Model = BaseModel.extend( {
	    mixins             : [ ValidationMixin, RestMixin, UnderscoreMixin.Model ],
	    triggerWhenChanged : 'change',
	
	    properties : {
	        _clonedProps : {
	            enumerable : false,
	            get        : function(){
	                var props = {};
	
	                this.forEachProp( this, function( value, name ){
	                    props[ name ] = value;
	                } );
	
	                return props;
	            }
	        },
	
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
	        },
	
	        changed : {
	            enumerable : false,
	            get        : function(){
	                var changed = this._changed;
	
	                if( !changed ){
	                    var last = this.attributes,
	                        prev = this._previousAttributes;
	
	                    changed = {};
	
	                    this.forEachAttr( this.__attributes, function( attrSpec, name ){
	                        if( attrSpec.isChanged( last[ name ], prev[ name ] ) ){
	                            changed[ name ] = last[ name ];
	                        }
	                    } );
	
	                    this._changed = changed;
	                }
	
	                return changed;
	            }
	        }
	    },
	
	    _validateNested : function( errors ){
	        var attrSpecs = this.__attributes,
	            length    = 0,
	            model     = this;
	
	        this.forEachAttr( this.attributes, function( value, name ){
	            var error = attrSpecs[ name ].validate( model, value, name );
	
	            if( error ){
	                errors[ name ] = error;
	                length++;
	            }
	        } );
	
	        return length;
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
	
	    Attributes : function( x ){ this.id = x.id; },
	    __class    : 'Model',
	
	    __duringSet  : 0,
	    _changed     : null,
	    _changeToken : {},
	
	    forEachAttr : function( obj, fun ){ this.id === void 0 || fun( this.id, 'id' ); },
	
	    defaults : function( attrs, options ){ return new this.Attributes( attrs ); },
	
	    __begin  : modelSet.__begin,
	    __commit : modelSet.__commit,
	
	    transaction : modelSet.transaction,
	
	    // Determine if the model has changed since the last `"change"` event.
	    // If you specify an attribute name, determine if that attribute has changed.
	    hasChanged : function( attr ){
	        if( attr == null ) return !_.isEmpty( this.changed );
	        return this.__attributes[ attr ].isChanged( this.attributes[ attr ], this._previousAttributes[ attr ] );
	    },
	
	    // Return an object containing all the attributes that have changed, or
	    // false if there are no changed attributes. Useful for determining what
	    // parts of a view need to be updated and/or what attributes need to be
	    // persisted to the server. Unset attributes will be set to undefined.
	    // You can also pass an attributes object to diff against the model,
	    // determining if there *would be* a change.
	    // TODO: Test it
	    changedAttributes : function( diff ){
	        if( !diff ) return this.hasChanged() ? _.clone( this.changed ) : false;
	
	        var val, changed = false,
	            old          = this._changing ? this._previousAttributes : this.attributes,
	            attrSpecs    = this.__attributes;
	
	        for( var attr in diff ){
	            if( !attrSpecs[ attr ].isChanged( old[ attr ], ( val = diff[ attr ] ) ) ) continue;
	            (changed || (changed = {}))[ attr ] = val;
	        }
	
	        return changed;
	    },
	
	    // Get all of the attributes of the model at the time of the previous
	    // `"change"` event.
	    previousAttributes : function(){
	        return new this.Attributes( this._previousAttributes );
	    },
	
	    set : function( a, b, c ){
	        switch( typeof a ){
	            case 'string' :
	                var attrSpec = this.__attributes[ a ];
	
	                if( attrSpec && !attrSpec.isBackboneType && !c ){
	                    return setSingleAttr( this, a, b, attrSpec );
	                }
	
	                var attrs  = {};
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
	    deepGet : function( path ){
	        return this._deepGet( path.split( '.' ) );
	    },
	
	    deepValidationError : function( name ){
	        var path  = name.split( '.' ),
	            attr  = path.pop(),
	            model = this._deepGet( path ) || null;
	
	        return model && model.getValidationError( attr );
	    },
	
	    _deepGet : function( path ){
	        var value = this;
	
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
	                    var newModel = attrSpecs[ current ].create( null, options );
	
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
	
	    cidPrefix : 'c',
	
	    constructor : function( attributes, opts ){
	        var attrSpecs = this.__attributes,
	            attrs     = attributes || {},
	            options   = opts || {};
	
	        this.__duringSet = 0;
	        this._changing   = this._pending = false;
	        this._changeToken = {};
	        this.attributes   = {};
	        this.cid          = this.cidPrefix + _cidCount++;
	
	        if( options.parse ){
	            attrs = this.parse( attrs, options ) || {};
	        }
	
	        //  Make this.collection accessible in initialize
	        if( options.collection ){
	            this.collection = options.collection;
	
	            // do not pass it to nested objects.
	            // No side effect here, options copied at the upper level in this case
	            options.collection = null;
	        }
	
	        if( typeof attrs !== 'object' || Object.getPrototypeOf( attrs ) !== Object.prototype ){
	            error.argumentIsNotAnObject( this, attrs );
	            attrs = {};
	        }
	
	        attrs = options.deep ? deepCloneAttrs( this, attrs ) : this.defaults( attrs );
	
	        // Execute attributes transform function instead of this.set
	        applyTransform( this, attrs, attrSpecs, options );
	
	        this._previousAttributes = this.attributes = attrs;
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
	        var self      = this,
	            res       = {},
	            attrSpecs = this.__attributes;
	
	        this.forEachAttr( this.attributes, function( value, key ){
	            var attrSpec = attrSpecs[ key ],
	                toJSON   = attrSpec && attrSpec.toJSON;
	
	            if( toJSON ){
	                res[ key ] = toJSON.call( self, value, key );
	            }
	        } );
	
	        return res;
	    },
	
	    parse  : function( resp ){ return this._parse( resp ); },
	    _parse : _.identity,
	
	    _ : _ // add underscore to be accessible in templates
	}, {
	    // shorthand for inline nested model definitions
	    defaults : function( attrs ){ return this.extend( { defaults : attrs } ); },
	
	    // extend Model and its Collection
	    extend : function( protoProps, staticProps ){
	        var Child;
	
	        if( typeof protoProps === 'function' ){
	            Child      = protoProps;
	            protoProps = null;
	        }
	        else if( protoProps && protoProps.hasOwnProperty( 'constructor' ) ){
	            Child = protoProps.constructor;
	        }
	        else{
	            var Parent = this;
	            Child      = function Model( attrs, options ){ return Parent.call( this, attrs, options ); };
	        }
	
	        var This        = Object.extend.call( this, Child );
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
	    var self      = Type.prototype,
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
	        Attributes   = Object.createCloneCtor( allAttrSpecs );
	
	    return _.extend( _.omit( protoProps, 'collection', 'attributes' ), {
	        __attributes : new Attributes( allAttrSpecs ),
	        forEachAttr  : Object.createForEach( allAttrSpecs ),
	        _parse       : createParse( allAttrSpecs, attrSpecs ) || Base.prototype._parse,
	        defaults     : defaultsAsFunction || createDefaults( allAttrSpecs ),
	        properties   : createAttrsNativeProps( protoProps.properties, attrSpecs ),
	        Attributes   : Attributes
	    } );
	}
	
	// Create attributes 'parse' option function only if local 'parse' options present.
	// Otherwise return null.
	function createParse( allAttrSpecs, attrSpecs ){
	    var statements = [ 'var a = this.__attributes;' ],
	        create     = false;
	
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
	    var assign_f = [], create_f = [];
	
	    function appendExpr( name, expr ){
	        assign_f.push( 'this.' + name + '=a.' + name + '===undefined?' + expr + ':a.' + name + ';' );
	        create_f.push( 'this.' + name + '=' + expr + ';' );
	    }
	
	    // Compile optimized constructor function for efficient deep copy of JSON literals in defaults.
	    _.each( attrSpecs, function( attrSpec, name ){
	        if( attrSpec.value === undefined && attrSpec.type ){
	            // if type with no value is given, create an empty object
	            appendExpr( name, 'i.' + name + '.create()' );
	        }
	        else{
	            // If value is given, type casting logic will do the job later, converting value to the proper type.
	            if( isValidJSON( attrSpec.value ) ){
	                // JSON literals must be deep copied.
	                appendExpr( name, JSON.stringify( attrSpec.value ) );
	            }
	            else if( attrSpec.value === undefined ){
	                // handle undefined value separately. Usual case for model ids.
	                appendExpr( name, 'undefined' );
	            }
	            else{
	                // otherwise, copy value by reference.
	                appendExpr( name, 'i.' + name + '.value' );
	            }
	        }
	    } );
	
	    var CreateDefaults = new Function( 'i', create_f.join( '' ) ),
	        AssignDefaults = new Function( 'a', 'i', assign_f.join( '' ) );
	
	    CreateDefaults.prototype = AssignDefaults.prototype = Object.prototype;
	
	    // Create model.defaults( attrs, options ) function
	    // 'attrs' will override default values, options will be passed to nested backbone types
	    return function( attrs ){
	        return attrs ? new AssignDefaults( attrs || {}, this.__attributes ) : new CreateDefaults( this.__attributes );
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
	    Backbone = __webpack_require__( 4 ),
	    Events = __webpack_require__( 7 );
	
	Backbone.Events = Events;
	Object.assign( Backbone, Events );
	module.exports = Backbone;
	
	// Update Backbone objects to use event patches and Object+
	[ 'Model', 'Collection', 'View', 'Router', 'History' ].forEach( function( name ){
	    var Type = Backbone[ name ];
	    Object.assign( Type.prototype, Events );
	    Object.extend.attach( Type );
	});
	
	// Make Object.extend classes capable of sending and receiving Backbone Events...
	Object.assign( Class.prototype, Events );

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
	                var desc    = Object.getOwnPropertyDescriptor( nextSource, nextKey );
	                if( desc !== void 0 && desc.enumerable ){
	                    to[ nextKey ] = nextSource[ nextKey ];
	                }
	            }
	        }
	        return to;
	    },
	
	    createForEach : function( attrSpecs ){
	        var statements = [ 'var v;' ];
	
	        for( var name in attrSpecs ){
	            statements.push( '(v=a.' + name + ')' + '===void 0||f(v,"' + name + '");' );
	        }
	
	        return new Function( 'a', 'f', statements.join( '' ) );
	    },
	
	    createCloneCtor : function ( attrSpecs ){
	        var statements = [];
	
	        for( var name in attrSpecs ){
	            statements.push( "this." + name + "=x." + name + ";" );
	        }
	
	        var CloneCtor = new Function( "x", statements.join( '' ) );
	        CloneCtor.prototype = Object.prototype;
	        return CloneCtor;
	    },
	
	    createTransformCtor : function ( attrSpecs ){
	        var statements = [ 'var v;' ];
	
	        for( var name in attrSpecs ){
	            statements.push( 'this.' + name + '=(v=a.' + name + ')' + '===void 0?void 0 :f(v,"' + name + '");' );
	        }
	
	        var TransformCtor = new Function( "a", 'f', statements.join( '' ) );
	        TransformCtor.prototype = Object.prototype;
	        return TransformCtor;
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
	
	            var prepared = spec instanceof Function ? { get : spec } : spec;
	
	            if( prepared.enumerable === void 0 ){
	                prepared.enumerable = true;
	            }
	
	            return prepared;
	        }
	
	        function attachMixins( protoProps ){
	            var mixins = protoProps.mixins,
	                merged = {}, properties = {};
	
	            for( var i = mixins.length - 1; i >= 0; i-- ){
	                var mixin = mixins[ i ];
	                Object.assign( properties, mixin.properties );
	                Object.assign( merged, mixin );
	            }
	
	            Object.assign( merged, protoProps );
	            Object.assign( properties, protoProps.properties );
	
	            merged.properties = properties;
	            return merged;
	        }
	
	        function createForEachProp( proto ){
	            var allProps = {};
	
	            // traverse prototype chain
	            for( var p = proto; p; p = Object.getPrototypeOf( p ) ){
	                Object.transform( allProps, p.properties, function( spec, name ){
	                    if( !allProps[ name ] && spec.enumerable ){
	                        return spec;
	                    }
	                } );
	            }
	
	            return Object.createForEach( allProps );
	        }
	
	        function define( a_protoProps, a_staticProps ){
	            var protoProps = a_protoProps || {};
	            staticProps    = a_staticProps || {};
	
	            if( protoProps.mixins ){
	                protoProps = attachMixins( protoProps );
	            }
	
	            Object.transform( this.prototype, protoProps, warnOnError, this );
	
	            // do not inherit abstract class factory!
	            if( !staticProps.create ) staticProps.create = null;
	            Object.assign( this, staticProps ); // No override check here
	
	            protoProps && Object.defineProperties( this.prototype,
	                Object.transform( {}, protoProps.properties, preparePropSpec, this ) );
	
	            this.prototype.forEachProp = createForEachProp( this.prototype );
	
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

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(global) {//     Backbone.js 1.2.3
	
	//     (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	//     Backbone may be freely distributed under the MIT license.
	
	(function(factory) {
	  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
	  // We use `self` instead of `window` for `WebWorker` support.
	  var root = (typeof self == 'object' && self.self == self && self) ||
	            (typeof global == 'object' && global.global == global && global);
	
	  // Set up Backbone appropriately for the environment. Start with AMD.
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5), __webpack_require__(6), exports], __WEBPACK_AMD_DEFINE_RESULT__ = function(_, $, exports) {
	      // Export global even in AMD case in case this script is loaded with
	      // others that may still expect a global Backbone.
	      root.Backbone = factory(root, exports, _, $);
	    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	
	  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
	  } else if (typeof exports !== 'undefined') {
	    var _ = require('underscore'), $;
	    try { $ = require('jquery'); } catch(e) {}
	    factory(root, exports, _, $);
	
	  // Finally, as a browser global.
	  } else {
	    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
	  }
	
	}(function(root, Backbone, _, $) {
	
	  // Initial Setup
	  // -------------
	
	  // Save the previous value of the `Backbone` variable, so that it can be
	  // restored later on, if `noConflict` is used.
	  var previousBackbone = root.Backbone;
	
	  // Create a local reference to a common array method we'll want to use later.
	
	  var slice = Array.prototype.slice;
	
	  // Current version of the library. Keep in sync with `package.json`.
	  Backbone.VERSION = '1.2.3';
	
	  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
	  // the `$` variable.
	  Backbone.$ = $;
	
	  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
	  // to its previous owner. Returns a reference to this Backbone object.
	  Backbone.noConflict = function() {
	    root.Backbone = previousBackbone;
	    return this;
	  };
	
	  // Backbone.Model
	  // --------------
	
	  // Backbone **Models** are the basic data object in the framework --
	  // frequently representing a row in a table in a database on your server.
	  // A discrete chunk of data and a bunch of useful, related methods for
	  // performing computations and transformations on that data.
	
	  // Create a new model with the specified attributes. A client id (`cid`)
	  // is automatically generated and assigned for you.
	  var Model = Backbone.Model = function(attributes, options) {};
	
	  // Attach all inheritable methods to the Model prototype.
	  _.extend(Model.prototype, {
	
	    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
	    // CouchDB users may want to set this to `"_id"`.
	    idAttribute: 'id',
	
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function(){},
	
	    // Returns `true` if the attribute contains a value that is not null
	    // or undefined.
	    has: function(attr) {
	      return this.get(attr) != null;
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
	
	    // Get the previous value of an attribute, recorded at the time the last
	    // `"change"` event was fired.
	    previous: function(attr) {
	      if (attr == null || !this._previousAttributes) return null;
	      return this._previousAttributes[attr];
	    },
	
	    // A model is new if it has never been saved to the server, and lacks an id.
	    isNew: function() {
	      return !this.has(this.idAttribute);
	    }
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
	  var Collection = Backbone.Collection = function(models, options) {};
	
	  // Define the Collection's inheritable methods.
	  _.extend(Collection.prototype, {
	
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
	
	    // Return models with matching attributes. Useful for simple cases of
	    // `filter`.
	    where: function(attrs, first) {
	      return this[first ? 'find' : 'filter'](attrs);
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
	      var comparator = this.comparator;
	      if (!comparator) throw new Error('Cannot sort a set without a comparator');
	      options || (options = {});
	
	      var length = comparator.length;
	      if (_.isFunction(comparator)) comparator = _.bind(comparator, this);
	      // Run sort based on type of `comparator`.
	      if (length === 1 || _.isString(comparator)) {
	        this.models = this.sortBy(comparator);
	      } else {
	        this.models.sort(comparator);
	      }
	
	      if (!options.silent) this.trigger('sort', this, options);
	      return this;
	    },
	
	    // Pluck an attribute from each model in the collection.
	    pluck: function(attr) {
	      return _.invoke(this.models, 'get', attr);
	    },
	
	    // **parse** converts a response into a list of models to be added to the
	    // collection. The default implementation is just to pass it through.
	    parse: function(resp, options) {
	      return resp;
	    }
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
	  _.extend(View.prototype, {
	
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
	  _.extend(Router.prototype, {
	
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
	        if (router.execute(callback, args, name) !== false) {
	        router.trigger.apply(router, ['route:' + name].concat(args));
	        router.trigger('route', name, args);
	        Backbone.history.trigger('route', router, name, args);
	        }
	      });
	      return this;
	    },
	
	    // Execute a route handler with the provided parameters.  This is an
	    // excellent place to do pre-route setup or post-route cleanup.
	    execute: function(callback, args, name) {
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
	    this.checkUrl = _.bind(this.checkUrl, this);
	
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
	
	
	
	  // Cached regex for stripping urls of hash.
	  var pathStripper = /#.*$/;
	
	  // Has the history handling already been started?
	  History.started = false;
	
	  // Set up all inheritable **Backbone.History** properties and methods.
	  _.extend(History.prototype, {
	
	    // The default interval to poll for hash changes, if necessary, is
	    // twenty times a second.
	    interval: 50,
	
	    // Are we at the app root?
	    atRoot: function() {
	      var path = this.location.pathname.replace(/[^\/]$/, '$&/');
	      return path === this.root && !this.getSearch();
	    },
	
	    // Does the pathname match the root?
	    matchRoot: function() {
	      var path = this.decodeFragment(this.location.pathname);
	      var root = path.slice(0, this.root.length - 1) + '/';
	      return root === this.root;
	    },
	    // Unicode characters in `location.pathname` are percent encoded so they're
	    // decoded for comparison. `%25` should not be decoded since it may be part
	    // of an encoded parameter.
	    decodeFragment: function(fragment) {
	      return decodeURI(fragment.replace(/%25/g, '%2525'));
	    },
	    // In IE6, the hash fragment and search params are incorrect if the
	    // fragment contains `?`.
	    getSearch: function() {
	      var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
	      return match ? match[0] : '';
	    },
	    // Gets the true hash value. Cannot use location.hash directly due to bug
	    // in Firefox where location.hash will always be decoded.
	    getHash: function(window) {
	      var match = (window || this).location.href.match(/#(.*)$/);
	      return match ? match[1] : '';
	    },
	
	    // Get the pathname and search params, without the root.
	    getPath: function() {
	      var path = this.decodeFragment(
	        this.location.pathname + this.getSearch()
	      ).slice(this.root.length - 1);
	      return path.charAt(0) === '/' ? path.slice(1) : path;
	    },
	
	    // Get the cross-browser normalized URL fragment from the path or hash.
	    getFragment: function(fragment) {
	      if (fragment == null) {
	        if (this._usePushState || !this._wantsHashChange) {
	          fragment = this.getPath();
	        } else {
	          fragment = this.getHash();
	        }
	      }
	      return fragment.replace(routeStripper, '');
	    },
	
	    // Start the hash change handling, returning `true` if the current URL matches
	    // an existing route, and `false` otherwise.
	    start: function(options) {
	      if (History.started) throw new Error('Backbone.history has already been started');
	      History.started = true;
	
	      // Figure out the initial configuration. Do we need an iframe?
	      // Is pushState desired ... is it available?
	      this.options          = _.extend({root: '/'}, this.options, options);
	      this.root             = this.options.root;
	      this._wantsHashChange = this.options.hashChange !== false;
	      this._hasHashChange   = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
	      this._useHashChange   = this._wantsHashChange && this._hasHashChange;
	      this._wantsPushState  = !!this.options.pushState;
	      this._hasPushState    = !!(this.history && this.history.pushState);
	      this._usePushState    = this._wantsPushState && this._hasPushState;
	      this.fragment         = this.getFragment();
	
	      // Normalize root to always include a leading and trailing slash.
	      this.root = ('/' + this.root + '/').replace(rootStripper, '/');
	
	
	
	
	      // Transition from hashChange to pushState or vice versa if both are
	      // requested.
	      if (this._wantsHashChange && this._wantsPushState) {
	
	        // If we've started off with a route from a `pushState`-enabled
	        // browser, but we're currently in a browser that doesn't support it...
	        if (!this._hasPushState && !this.atRoot()) {
	          var root = this.root.slice(0, -1) || '/';
	          this.location.replace(root + '#' + this.getPath());
	          // Return immediately as browser will do redirect to new url
	          return true;
	
	        // Or if we've started out with a hash-based route, but we're currently
	        // in a browser where it could be `pushState`-based instead...
	        } else if (this._hasPushState && this.atRoot()) {
	          this.navigate(this.getHash(), {replace: true});
	        }
	
	        }
	
	      // Proxy an iframe to handle location events if the browser doesn't
	      // support the `hashchange` event, HTML5 history, or the user wants
	      // `hashChange` but not `pushState`.
	      if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
	        this.iframe = document.createElement('iframe');
	        this.iframe.src = 'javascript:0';
	        this.iframe.style.display = 'none';
	        this.iframe.tabIndex = -1;
	        var body = document.body;
	        // Using `appendChild` will throw on IE < 9 if the document is not ready.
	        var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
	        iWindow.document.open();
	        iWindow.document.close();
	        iWindow.location.hash = '#' + this.fragment;
	      }
	
	      // Add a cross-platform `addEventListener` shim for older browsers.
	      var addEventListener = window.addEventListener || function (eventName, listener) {
	        return attachEvent('on' + eventName, listener);
	      };
	      // Depending on whether we're using pushState or hashes, and whether
	      // 'onhashchange' is supported, determine how we check the URL state.
	      if (this._usePushState) {
	        addEventListener('popstate', this.checkUrl, false);
	      } else if (this._useHashChange && !this.iframe) {
	        addEventListener('hashchange', this.checkUrl, false);
	      } else if (this._wantsHashChange) {
	        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
	      }
	      if (!this.options.silent) return this.loadUrl();
	    },
	
	    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
	    // but possibly useful for unit testing Routers.
	    stop: function() {
	      // Add a cross-platform `removeEventListener` shim for older browsers.
	      var removeEventListener = window.removeEventListener || function (eventName, listener) {
	        return detachEvent('on' + eventName, listener);
	      };
	      // Remove window listeners.
	      if (this._usePushState) {
	        removeEventListener('popstate', this.checkUrl, false);
	      } else if (this._useHashChange && !this.iframe) {
	        removeEventListener('hashchange', this.checkUrl, false);
	      }
	      // Clean up the iframe if necessary.
	      if (this.iframe) {
	        document.body.removeChild(this.iframe);
	        this.iframe = null;
	      }
	      // Some environments will throw when clearing an undefined interval.
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
	      // If the user pressed the back button, the iframe's hash will have
	      // changed and we should use that for comparison.
	      if (current === this.fragment && this.iframe) {
	        current = this.getHash(this.iframe.contentWindow);
	      }
	      if (current === this.fragment) return false;
	      if (this.iframe) this.navigate(current);
	      this.loadUrl();
	    },
	
	    // Attempt to load the current URL fragment. If a route succeeds with a
	    // match, returns `true`. If no defined routes matches the fragment,
	    // returns `false`.
	    loadUrl: function(fragment) {
	      // If the root doesn't match, no routes can match either.
	      if (!this.matchRoot()) return false;
	      fragment = this.fragment = this.getFragment(fragment);
	      return _.some(this.handlers, function(handler) {
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
	
	      // Normalize the fragment.
	      fragment = this.getFragment(fragment || '');
	
	      // Don't include a trailing slash on the root.
	      var root = this.root;
	      if (fragment === '' || fragment.charAt(0) === '?') {
	        root = root.slice(0, -1) || '/';
	      }
	      var url = root + fragment;
	      // Strip the hash and decode for matching.
	      fragment = this.decodeFragment(fragment.replace(pathStripper, ''));
	
	      if (this.fragment === fragment) return;
	      this.fragment = fragment;
	
	
	      // If pushState is available, we use it to set the fragment as a real URL.
	      if (this._usePushState) {
	        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
	
	      // If hash changes haven't been explicitly disabled, update the hash
	      // fragment to store history.
	      } else if (this._wantsHashChange) {
	        this._updateHash(this.location, fragment, options.replace);
	        if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
	          var iWindow = this.iframe.contentWindow;
	          // Opening and closing the iframe tricks IE7 and earlier to push a
	          // history entry on hash-tag change.  When replace is true, we don't
	          // want this.
	          if (!options.replace) {
	            iWindow.document.open();
	            iWindow.document.close();
	          }
	
	          this._updateHash(iWindow.location, fragment, options.replace);
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
	
	  return Backbone;
	
	}));
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

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

	'use strict';
	
	var _ = __webpack_require__( 5 );
	
	var Events = {};
	
	// So hard to believe :) You won't. Optimized JIT-friendly event trigger functions to be used from model.set
	// Two specialized functions for event triggering...
	Events.trigger1 = function( self, name, a ){
	    var _events = self._events;
	    if( _events ){
	        _fireEvent1( _events[ name ], a );
	        _fireEvent2( _events.all, name, a );
	    }
	};
	
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
	
	Events.onAll = function( self, callback, context ){
	    var record = {callback: callback, context: context, ctx: context || self},
	        _events = self._events || ( self._events = {} ),
	        events = _events.all;
	
	    if( events ){
	        events.push( record );
	    }
	    else{
	        _events.all = [ record ];
	    }
	
	    return self;
	};
	
	Events.offAll = function( self, callback, context) {
	    var retain, ev, events, j, k;
	    if( !self._events ) return self;
	
	    if (events = self._events.all ) {
	        self._events.all = retain = [];
	
	        if( callback || context ) {
	            for (j = 0, k = events.length; j < k; j++) {
	                ev = events[j];
	                if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
	                    (context && context !== ev.context)) {
	                    retain.push(ev);
	                }
	            }
	        }
	
	        if (!retain.length) delete self._events.all;
	    }
	
	    return self;
	};
	
	// ...and specialized functions with triggering loops. Crappy JS JIT loves these small functions and code duplication.
	function _fireEvent1( events, a ){
	    if( events )
	        for( var i = 0, l = events.length, ev; i < l; i ++ )
	            (ev = events[i]).callback.call(ev.ctx, a );
	}
	
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
	
	// Backbone.Events
	// ---------------
	
	// A module that can be mixed in to *any object* in order to provide it with
	// a custom event channel. You may bind a callback to an event with `on` or
	// remove with `off`; `trigger`-ing an event fires all callbacks in
	// succession.
	//
	//     var object = {};
	//     _.extend(object, Backbone.Events);
	//     object.on('expand', function(){ alert('expanded'); });
	//     object.trigger('expand');
	//
	
	// Regular expression used to split event strings.
	var eventSplitter = /\s+/;
	
	// Iterates over the standard `event, callback` (as well as the fancy multiple
	// space-separated events `"change blur", callback` and jQuery-style event
	// maps `{event: callback}`).
	var eventsApi = function(iteratee, events, name, callback, opts) {
	    var i = 0, names;
	    if (name && typeof name === 'object') {
	        // Handle event maps.
	        if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
	        for (names = _.keys(name); i < names.length ; i++) {
	            events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
	        }
	    } else if (name && eventSplitter.test(name)) {
	        // Handle space separated event names by delegating them individually.
	        for (names = name.split(eventSplitter); i < names.length; i++) {
	            events = iteratee(events, names[i], callback, opts);
	        }
	    } else {
	        // Finally, standard events.
	        events = iteratee(events, name, callback, opts);
	    }
	    return events;
	};
	
	// Bind an event to a `callback` function. Passing `"all"` will bind
	// the callback to all events fired.
	Events.on = function(name, callback, context) {
	    return internalOn(this, name, callback, context);
	};
	
	// Guard the `listening` argument from the public API.
	var internalOn = function(obj, name, callback, context, listening) {
	    obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
	        context: context,
	        ctx: obj,
	        listening: listening
	    });
	
	    if (listening) {
	        var listeners = obj._listeners || (obj._listeners = {});
	        listeners[listening.id] = listening;
	    }
	
	    return obj;
	};
	
	// Inversion-of-control versions of `on`. Tell *this* object to listen to
	// an event in another object... keeping track of what it's listening to
	// for easier unbinding later.
	Events.listenTo =  function(obj, name, callback) {
	    if (!obj) return this;
	    var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
	    var listeningTo = this._listeningTo || (this._listeningTo = {});
	    var listening = listeningTo[id];
	
	    // This object is not listening to any other events on `obj` yet.
	    // Setup the necessary references to track the listening callbacks.
	    if (!listening) {
	        var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
	        listening = listeningTo[id] = {obj: obj, objId: id, id: thisId, listeningTo: listeningTo, count: 0};
	    }
	
	    // Bind callbacks on obj, and keep track of them on listening.
	    internalOn(obj, name, callback, this, listening);
	    return this;
	};
	
	// The reducing API that adds a callback to the `events` object.
	var onApi = function(events, name, callback, options) {
	    if (callback) {
	        var handlers = events[name] || (events[name] = []);
	        var context = options.context, ctx = options.ctx, listening = options.listening;
	        if (listening) listening.count++;
	
	        handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
	    }
	    return events;
	};
	
	// Remove one or many callbacks. If `context` is null, removes all
	// callbacks with that function. If `callback` is null, removes all
	// callbacks for the event. If `name` is null, removes all bound
	// callbacks for all events.
	Events.off =  function(name, callback, context) {
	    if (!this._events) return this;
	    this._events = eventsApi(offApi, this._events, name, callback, {
	        context: context,
	        listeners: this._listeners
	    });
	    return this;
	};
	
	// Tell this object to stop listening to either specific events ... or
	// to every object it's currently listening to.
	Events.stopListening =  function(obj, name, callback) {
	    var listeningTo = this._listeningTo;
	    if (!listeningTo) return this;
	
	    var ids = obj ? [obj._listenId] : _.keys(listeningTo);
	
	    for (var i = 0; i < ids.length; i++) {
	        var listening = listeningTo[ids[i]];
	
	        // If listening doesn't exist, this object is not currently
	        // listening to obj. Break out early.
	        if (!listening) break;
	
	        listening.obj.off(name, callback, this);
	    }
	    if (_.isEmpty(listeningTo)) this._listeningTo = void 0;
	
	    return this;
	};
	
	// The reducing API that removes a callback from the `events` object.
	var offApi = function(events, name, callback, options) {
	    if (!events) return;
	
	    var i = 0, listening;
	    var context = options.context, listeners = options.listeners;
	
	    // Delete all events listeners and "drop" events.
	    if (!name && !callback && !context) {
	        var ids = _.keys(listeners);
	        for (; i < ids.length; i++) {
	            listening = listeners[ids[i]];
	            delete listeners[listening.id];
	            delete listening.listeningTo[listening.objId];
	        }
	        return;
	    }
	
	    var names = name ? [name] : _.keys(events);
	    for (; i < names.length; i++) {
	        name = names[i];
	        var handlers = events[name];
	
	        // Bail out if there are no events stored.
	        if (!handlers) break;
	
	        // Replace events if there are any remaining.  Otherwise, clean up.
	        var remaining = [];
	        for (var j = 0; j < handlers.length; j++) {
	            var handler = handlers[j];
	            if (
	                callback && callback !== handler.callback &&
	                callback !== handler.callback._callback ||
	                context && context !== handler.context
	            ) {
	                remaining.push(handler);
	            } else {
	                listening = handler.listening;
	                if (listening && --listening.count === 0) {
	                    delete listeners[listening.id];
	                    delete listening.listeningTo[listening.objId];
	                }
	            }
	        }
	
	        // Update tail event if the list has any events.  Otherwise, clean up.
	        if (remaining.length) {
	            events[name] = remaining;
	        } else {
	            delete events[name];
	        }
	    }
	    if (_.size(events)) return events;
	};
	
	// Bind an event to only be triggered a single time. After the first time
	// the callback is invoked, its listener will be removed. If multiple events
	// are passed in using the space-separated syntax, the handler will fire
	// once for each event, not once for a combination of all events.
	Events.once =  function(name, callback, context) {
	    // Map the event into a `{event: once}` object.
	    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
	    return this.on(events, void 0, context);
	};
	
	// Inversion-of-control versions of `once`.
	Events.listenToOnce =  function(obj, name, callback) {
	    // Map the event into a `{event: once}` object.
	    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
	    return this.listenTo(obj, events);
	};
	
	// Reduces the event callbacks into a map of `{event: onceWrapper}`.
	// `offer` unbinds the `onceWrapper` after it has been called.
	var onceMap = function(map, name, callback, offer) {
	    if (callback) {
	        var once = map[name] = _.once(function() {
	            offer(name, once);
	            callback.apply(this, arguments);
	        });
	        once._callback = callback;
	    }
	    return map;
	};
	
	// Trigger one or many events, firing all bound callbacks. Callbacks are
	// passed the same arguments as `trigger` is, apart from the event name
	// (unless you're listening on `"all"`, which will cause your callback to
	// receive the true name of the event as the first argument).
	Events.trigger =  function(name) {
	    if (!this._events) return this;
	
	    var length = Math.max(0, arguments.length - 1);
	    var args = Array(length);
	    for (var i = 0; i < length; i++) args[i] = arguments[i + 1];
	
	    eventsApi(triggerApi, this._events, name, void 0, args);
	    return this;
	};
	
	// Handles triggering the appropriate event callbacks.
	var triggerApi = function(objEvents, name, cb, args) {
	    if (objEvents) {
	        var events = objEvents[name];
	        var allEvents = objEvents.all;
	        if (events && allEvents) allEvents = allEvents.slice();
	        if (events) triggerEvents(events, args);
	        if (allEvents) triggerEvents(allEvents, [name].concat(args));
	    }
	    return objEvents;
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
	
	// Aliases for backwards compatibility.
	Events.bind   = Events.on;
	Events.unbind = Events.off;
	
	// Allow the `Backbone` object to serve as a global event bus, for folks who
	// want global "pubsub" in a convenient place.
	module.exports = Events;

/***/ },
/* 8 */
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
	    error    = __webpack_require__( 9 ),
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
	    }
	
	    if( model._changed ) model._changed = null;
	
	    var options   = {},
	        prevValue = current[ key ],
	        val       = attrSpec.transform( value, options, model, key );
	
	    current[ key ] = val;
	
	    if( attrSpec.isChanged( prevValue, val ) ){
	        model._pending = options;
	        trigger3( model, 'change:' + key, model, val, options );
	    }
	
	    if( changing ){
	        return model;
	    }
	
	    while( model._pending ){
	        options        = model._pending;
	        model._pending = false;
	        model._changeToken = {};
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
	    }
	
	    if( this._changed ) this._changed = null;
	
	    this.__begin();
	    var res = a_fun.apply( context || this, args );
	    this.__commit();
	
	    if( notChanging ){
	        while( this._pending ){
	            options       = this._pending;
	            this._pending = false;
	            this._changeToken = {};
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
	    }
	
	    if( model._changed ) model._changed = null;
	
	    // For each `set` attribute, update or delete the current value.
	    // Todo: optimize for complete attrs set. Iterate through attributes names array,
	    // or (may be better) create precompiled loop unrolled forEach, extracting specs
	    // and values.
	    // Beware of single attr update with options. Need deep refactoring to remove penalty.
	    for( var attr in attrs ){
	        var attrSpec  = attrSpecs[ attr ],
	            isChanged = attrSpec ? attrSpec.isChanged : genericIsChanged,
	            val       = unset ? undefined : attrs[ attr ];
	
	        if( isChanged( current[ attr ], val ) ){
	            changes.push( attr );
	        }
	
	        current[ attr ] = val;
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
	            model._changeToken = {};
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
/* 9 */
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
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	// Options wrapper for chained and safe type specs...
	// --------------------------------------------------
	__webpack_require__( 3 );
	
	var trigger3         = __webpack_require__( 2 ).Events.trigger3,
	    modelSet         = __webpack_require__( 8 ),
	    error            = __webpack_require__( 9 ),
	    genericIsChanged = modelSet.isChanged,
	    setSingleAttr    = modelSet.setSingleAttr;
	
	var primitiveTypes = {
	    string  : String,
	    number  : Number,
	    boolean : Boolean
	};
	
	// list of simple accessor methods available in options
	var availableOptions = [ 'triggerWhenChanged', 'changeEvents', 'parse', 'clone', 'toJSON', 'value', 'cast', 'create', 'name', 'value',
	                         'type', 'validate' ];
	
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
	
	    check : function( check, error ){
	        var prevValidate = this._options.validate;
	
	        var validate = prevValidate ? function( model, value, name ){
	            var prevError = prevValidate( model, value, name );
	            if( prevError ) return prevError;
	
	            if( !check.call( model, value, name ) ){
	                return error || name + ' is not valid';
	            }
	        } : function( model, value, name ){
	            if( !check.call( model, value, name ) ){
	                return error || name + ' is not valid';
	            }
	        };
	
	        this._options.validate = validate;
	
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
	
	        //TODO: It looks like a bug. Remove.
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
	
	    validate : function( model, value, name ){},
	
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
	                // TODO: Looks like extra check. Need to remove. Everything should be proxied.
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
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _ = __webpack_require__( 5 );
	
	module.exports = {
	    properties : {
	        validationError : {
	            enumerable : false,
	            get : function(){
	                var errors = this._validationError || ( this._validationError = new ValidationError() );
	                return errors.update( this );
	            }
	        }
	    },
	
	    _validationError : null,
	
	    validate : function(){},
	
	    _validateNested : function( errors ){
	        return 0;
	    },
	
	    getValidationError : function( key ){
	        var error = this.validationError;
	        return ( key ? error && error.nested[ key ] : error ) || null;
	    },
	
	    /**
	     * Extended Backbone API
	     * @param {string} key - nested object key
	     * @returns {boolean}
	     */
	    isValid : function( key ){
	        return !this.getValidationError( key );
	    },
	
	    _invalidate : function( options ){
	        var error;
	        if( options.validate && ( error = this.validationError ) ){
	            this.trigger( 'invalid', this, error, _.extend( { validationError : error }, options ) );
	            return true;
	        }
	    }
	};
	
	function ValidationError(){
	    this._changeToken = {};
	    this.length       = 0;
	    this.nested       = {};
	    this.error        = null;
	}
	
	ValidationError.prototype.update = function( obj ){
	    if( this._changeToken !== obj._changeToken ){
	        this.length = obj._validateNested( this.nested = {} );
	
	        if( this.error = obj.validate( obj ) ){
	            this.length++;
	        }
	
	        this._changeToken = obj._changeToken;
	    }
	
	    return this.length ? this : null;
	};

/***/ },
/* 12 */
/***/ function(module, exports) {

	/**
	 * Backbone.js 1.2.3 REST implementation
	 * (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Backbone may be freely distributed under the MIT license.
	 *
	 * With validation patches - NestedTypes validation semantic is applied. (c) Vlad Balin, 2015.
	 */
	
	exports.Model = {
	    // Fetch the model from the server, merging the response with the model's
	    // local attributes. Any changed attributes will trigger a "change" event.
	    fetch : function( options ){
	        options         = _.extend( { parse : true }, options );
	        var model       = this;
	        var success     = options.success;
	        options.success = function( resp ){
	            var serverAttrs = options.parse ? model.parse( resp, options ) : resp;
	            model.set( serverAttrs, options );
	            if( model._invalidate( options ) ) return false;
	
	            if( success ) success.call( options.context, model, resp, options );
	            model.trigger( 'sync', model, resp, options );
	        };
	
	        wrapError( this, options );
	        return this.sync( 'read', this, options );
	    },
	
	    // Proxy `Backbone.sync` by default -- but override this if you need
	    // custom syncing semantics for *this* particular model.
	    sync : function(){
	        // Abort and pending IO request. Just one is allowed at the time.
	        var _this = this;
	        if( _this._xhr ){
	            _this._xhr.abort();
	        }
	
	        return this._xhr = exports.sync.apply( this, arguments )
	            .always( function(){ _this.xhr = void 0; });
	    },
	
	    // Set a hash of model attributes, and sync the model to the server.
	    // If the server returns an attributes hash that differs, the model's
	    // state will be `set` again.
	    save : function( key, val, options ){
	        // Handle both `"key", value` and `{key: value}` -style arguments.
	        var attrs;
	        if( key == null || typeof key === 'object' ){
	            attrs   = key;
	            options = val;
	        }
	        else{
	            (attrs = {})[ key ] = val;
	        }
	
	        options  = _.extend( { validate : true, parse : true }, options );
	        var wait = options.wait;
	
	        // If we're not waiting and attributes exist, save acts as
	        // `set(attr).save(null, opts)` with validation. Otherwise, check if
	        // the model will be valid when the attributes, if any, are set.
	        if( attrs && !wait ){
	            this.set( attrs, options );
	        }
	
	        if( this._invalidate( options ) ){
	            if( attrs && wait ) this.set( attrs, options );
	            return exports.errorPromise( this.validationError );
	        }
	
	        // After a successful server-side save, the client is (optionally)
	        // updated with the server-side state.
	        var model       = this;
	        var success     = options.success;
	        var attributes  = this.attributes;
	        options.success = function( resp ){
	            // Ensure attributes are restored during synchronous saves.
	            model.attributes = attributes;
	            var serverAttrs  = options.parse ? model.parse( resp, options ) : resp;
	            if( wait ) serverAttrs = _.extend( {}, attrs, serverAttrs );
	
	
	            if( serverAttrs ){
	                model.set( serverAttrs, options );
	                if( model._invalidate( options ) ) return false;
	            }
	
	            if( success ) success.call( options.context, model, resp, options );
	            model.trigger( 'sync', model, resp, options );
	        };
	        wrapError( this, options );
	
	        // Set temporary attributes if `{wait: true}` to properly find new ids.
	        if( attrs && wait ) this.attributes = _.extend( {}, attributes, attrs );
	
	        var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
	        if( method === 'patch' && !options.attrs ) options.attrs = attrs;
	        var xhr = this.sync( method, this, options );
	
	        // Restore attributes.
	        this.attributes = attributes;
	
	        return xhr;
	    },
	
	    // Destroy this model on the server if it was already persisted.
	    // Optimistically removes the model from its collection, if it has one.
	    // If `wait: true` is passed, waits for the server to respond before removal.
	    destroy : function( options ){
	        options     = options ? _.clone( options ) : {};
	        var model   = this;
	        var success = options.success;
	        var wait    = options.wait;
	
	        var destroy = function(){
	            model.stopListening();
	            model.trigger( 'destroy', model, model.collection, options );
	        };
	
	        options.success = function( resp ){
	            if( wait ) destroy();
	            if( success ) success.call( options.context, model, resp, options );
	            if( !model.isNew() ) model.trigger( 'sync', model, resp, options );
	        };
	
	        var xhr = false;
	        if( this.isNew() ){
	            _.defer( options.success );
	        }
	        else{
	            wrapError( this, options );
	            xhr = this.sync( 'delete', this, options );
	        }
	        if( !wait ) destroy();
	        return xhr;
	    },
	
	    urlRoot : '',
	
	    // Default URL for the model's representation on the server -- if you're
	    // using Backbone's restful methods, override this to change the endpoint
	    // that will be called.
	    url : function(){
	        var base =
	                _.result( this, 'urlRoot' ) ||
	                _.result( this.collection, 'url' ) ||
	                urlError();
	        if( this.isNew() ) return base;
	        var id = this.get( this.idAttribute );
	        return base.replace( /[^\/]$/, '$&/' ) + encodeURIComponent( id );
	    }
	};
	
	exports.Collection = {
	    url : '',
	
	    // Fetch the default set of models for this collection, resetting the
	    // collection when they arrive. If `reset: true` is passed, the response
	    // data will be passed through the `reset` method instead of `set`.
	    fetch : function( options ){
	        options         = _.extend( { parse : true }, options );
	        var success     = options.success;
	        var collection  = this;
	        options.success = function( resp ){
	            var method = options.reset ? 'reset' : 'set';
	            collection[ method ]( resp, options );
	            if( collection._invalidate( options ) ) return false;
	
	            if( success ) success.call( options.context, collection, resp, options );
	            collection.trigger( 'sync', collection, resp, options );
	        };
	
	        wrapError( this, options );
	        return this.sync( 'read', this, options );
	    },
	
	    // Proxy `Backbone.sync` by default -- but override this if you need
	    // custom syncing semantics for *this* particular model.
	    sync : function(){
	        return exports.sync.apply( this, arguments );
	    }
	};
	
	// Throw an error when a URL is needed, and none is supplied.
	function urlError(){
	    throw new Error( 'A "url" property or function must be specified' );
	}
	
	// Wrap an optional error callback with a fallback error event.
	function wrapError( model, options ){
	    var error     = options.error;
	    options.error = function( resp ){
	        if( error ) error.call( options.context, model, resp, options );
	        model.trigger( 'error', model, resp, options );
	    };
	}
	
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
	exports.sync = function( method, model, options ){
	    var type = methodMap[ method ];
	    // Default options, unless specified.
	    _.defaults(options || (options = {}), {
	      emulateHTTP: Backbone.emulateHTTP,
	      emulateJSON: Backbone.emulateJSON
	    });
	
	    // Default JSON-request options.
	    var params = { type : type, dataType : 'json' };
	
	    // Ensure that we have a URL.
	    if( !options.url ){
	        params.url = _.result( model, 'url' ) || urlError();
	    }
	
	    // Ensure that we have the appropriate request data.
	    if( options.data == null && model && (method === 'create' || method === 'update' || method === 'patch') ){
	        params.contentType = 'application/json';
	        params.data        = JSON.stringify( options.attrs || model.toJSON( options ) );
	    }
	
	    // For older servers, emulate JSON by encoding the request into an HTML-form.
	    if( options.emulateJSON ){
	        params.contentType = 'application/x-www-form-urlencoded';
	        params.data        = params.data ? { model : params.data } : {};
	    }
	
	    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
	    // And an `X-HTTP-Method-Override` header.
	    if( options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH') ){
	        params.type = 'POST';
	        if( options.emulateJSON ) params.data._method = type;
	        var beforeSend     = options.beforeSend;
	        options.beforeSend = function( xhr ){
	            xhr.setRequestHeader( 'X-HTTP-Method-Override', type );
	            if( beforeSend ) return beforeSend.apply( this, arguments );
	        };
	    }
	
	    // Don't process data on a non-GET request.
	    if( params.type !== 'GET' && !options.emulateJSON ){
	        params.processData = false;
	    }
	
	    // Pass along `textStatus` and `errorThrown` from jQuery.
	    var error     = options.error;
	    options.error = function( xhr, textStatus, errorThrown ){
	        options.textStatus  = textStatus;
	        options.errorThrown = errorThrown;
	        if( error ) error.call( options.context, xhr, textStatus, errorThrown );
	    };
	
	    // Make the request, allowing the user to override any Ajax options.
	    var xhr = options.xhr = exports.ajax( _.extend( params, options ) );
	    model.trigger( 'request', model, xhr, options );
	    return xhr;
	};
	
	// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
	var methodMap = {
	    'create' : 'POST',
	    'update' : 'PUT',
	    'patch'  : 'PATCH',
	    'delete' : 'DELETE',
	    'read'   : 'GET'
	};
	
	// Set the default implementation of `Backbone.ajax` to proxy through to `$`.
	// Override this if you'd like to use a different library.
	exports.ajax = function(){
	    return exports.$.ajax.apply( exports.$, arguments );
	};
	
	exports.errorPromise = function( error ){
	    var x = exports.$.Deferred();
	    x.reject( error );
	    return x;
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__( 5 );
	
	var slice = Array.prototype.slice;
	
	exports.Model = {
	    pick    : function(){ return _.pick( this, slice.call( arguments ) ); },
	
	    escape : function( attr ){
	        return _.escape( this[ attr ] );
	    },
	
	    matches : function( attrs ){
	        return !!_.iteratee( attrs, this )( this );
	    }
	};
	
	addUnderscoreMethods( exports.Model, '_clonedProps', {
	    keys: 1, values: 1, pairs: 1, invert: 1,
	    omit: 0, chain: 1, isEmpty: 1
	});
	
	( exports.Model, [ 'keys', 'values', 'pairs', 'invert', 'chain', 'isEmpty' ] );
	
	exports.Collection = {};
	
	addUnderscoreMethods( exports.Collection, 'models', {
	    forEach  : 3, each : 3, map : 3, collect : 3, reduce : 4,
	    foldl    : 4, inject : 4, reduceRight : 4, foldr : 4, find : 3, findIndex : 3, findLastIndex : 3, detect : 3, filter : 3,
	    select   : 3, reject : 3, every : 3, all : 3, some : 3, any : 3, include : 3, includes : 3,
	    contains : 3, invoke : 0, max : 3, min : 3, toArray : 1, size : 1, first : 3,
	    head     : 3, take : 3, initial : 3, rest : 3, tail : 3, drop : 3, last : 3,
	    without  : 0, difference : 0, indexOf : 3, shuffle : 1, lastIndexOf : 3,
	    isEmpty  : 1, chain : 1, sample : 3, partition : 3, groupBy : 3, countBy : 3,
	    sortBy   : 3, indexBy : 3
	});
	
	
	function addUnderscoreMethods(Mixin, attribute, methods ) {
	    _.each(methods, function(length, method) {
	        if (_[method]) Mixin[method] = addMethod(length, method, attribute);
	    });
	}
	
	// Proxy Backbone class methods to Underscore functions, wrapping the model's
	// `attributes` object or collection's `models` array behind the scenes.
	//
	// collection.filter(function(model) { return model.get('age') > 10 });
	// collection.each(this.addView);
	//
	// `Function#apply` can be slow so we use the method's arg count, if we know it.
	function addMethod(length, method, attribute) {
	    switch (length) {
	        case 1: return function() {
	            return _[method](this[attribute]);
	        };
	        case 2: return function(value) {
	            return _[method](this[attribute], value);
	        };
	        case 3: return function(iteratee, context) {
	            var value = this[ attribute ],
	                callback = cb(iteratee, this);
	
	            return arguments.length > 1 ?
	                   _[method]( value, callback, context)
	                : _[method]( value, callback );
	        };
	        case 4: return function(iteratee, defaultVal, context) {
	            var value = this[ attribute ],
	                callback = cb(iteratee, this);
	
	            return arguments.length > 1 ?
	                   _[method]( value, callback, defaultVal, context )
	                : _[method](value, callback );
	        };
	        default: return function() {
	            var args = slice.call(arguments);
	            args.unshift(this[attribute]);
	            return _[method].apply(_, args);
	        };
	    }
	}
	
	// Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
	function cb(iteratee, instance) {
	    if (_.isFunction(iteratee)) return iteratee;
	    if (_.isObject(iteratee) && !(iteratee instanceof instance.model )) return _.matches(iteratee);
	    if (_.isString(iteratee)) return function(model) { return model.get(iteratee); };
	    return iteratee;
	}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var _               = __webpack_require__( 5 ),
	    Backbone        = __webpack_require__( 2 ),
	    Model           = __webpack_require__( 1 ),
	    ValidationMixin = __webpack_require__( 11 ),
	    RestMixin       = __webpack_require__( 12 ).Collection,
	    UnderscoreMixin = __webpack_require__( 13 );
	
	var Events   = Backbone.Events,
	    trigger1 = Events.trigger1,
	    trigger2 = Events.trigger2,
	    trigger3 = Events.trigger3;
	
	var Commons               = __webpack_require__( 15 ),
	    toModel               = Commons.toModel,
	    dispose               = Commons.dispose,
	    ModelEventsDispatcher = Commons.ModelEventsDispatcher;
	
	var Add          = __webpack_require__( 16 ),
	    MergeOptions = Add.MergeOptions,
	    add          = Add.add,
	    set          = Add.set,
	    emptySet     = Add.emptySet;
	
	var Remove     = __webpack_require__( 17 ),
	    removeOne  = Remove.removeOne,
	    removeMany = Remove.removeMany;
	
	CollectionProto = Backbone.Collection.prototype;
	
	// transactional wrapper for collections
	function transaction( func ){
	    return function(){
	        this.__changing++ || ( this._changed = false );
	
	        var res = func.apply( this, arguments );
	
	        if( !--this.__changing && this._changed ){
	            this._changeToken = {};
	            trigger1( this, 'changes', this );
	        }
	
	        return res;
	    };
	}
	
	// wrapper for standard collections modification methods
	// wrap call in transaction and convert singular args
	function method( method ){
	    return function( a_models, a_options ){
	        this.__changing++ || ( this._changed = false );
	
	        var options = a_options || {},
	            models  = options.parse ? this.parse( a_models, options ) : a_models;
	
	        var res = models ? (
	            models instanceof Array ?
	            method.call( this, models, options )
	                : method.call( this, [ models ], options )[ 0 ]
	        ) : method.call( this, [], options );
	
	        if( !--this.__changing && this._changed ){
	            this._changeToken = {};
	            options.silent || trigger1( this, 'changes', this );
	        }
	
	        return res;
	    }
	}
	
	function handleChange(){
	    if( this.__changing ){
	        this._changed = true;
	    }
	    else{
	        this._changeToken = {};
	        trigger1( this, 'changes', this );
	    }
	}
	
	function SilentOptions( a_options ){
	    var options = a_options || {};
	    this.parse  = options.parse;
	    this.sort   = options.sort;
	}
	
	SilentOptions.prototype.silent = true;
	
	function CreateOptions( options, collection ){
	    MergeOptions.call( this, options, collection );
	    if( options ){
	        _.defaults( this, options );
	    }
	}
	
	module.exports = Backbone.Collection.extend( {
	    mixins : [ ValidationMixin, RestMixin, UnderscoreMixin.Collection ],
	
	    triggerWhenChanged : 'changes',
	    _listenToChanges   : 'update change reset',
	    __class            : 'Collection',
	
	    model : Model,
	
	    _owner : null,
	    _store : null,
	
	    __changing   : 0,
	    _changed     : false,
	    _changeToken : {},
	
	    _dispatcher : null,
	
	    properties : {
	        length : {
	            enumerable : false,
	            get : function(){
	                return this.models.length;
	            }
	        }
	    },
	
	    _validateNested : function( errors ){
	        var models = this.models,
	            length = 0;
	
	        for( var i = 0; i < models.length; i++ ){
	            var model = models[ i ],
	                error = model.validationError;
	
	            if( error ){
	                errors[ model.cid ] = error;
	                length++;
	            }
	        }
	
	        return length;
	    },
	
	    modelId : function( attrs ){
	        return attrs[ this.model.prototype.idAttribute || 'id' ];
	    },
	
	    constructor : function( models, a_options ){
	        var options = a_options || {};
	
	        this.__changing   = 0;
	        this._changed     = false;
	        this._changeToken = {};
	        this._owner       = this._store = null;
	
	        this.model      = options.model || this.model;
	        if (options.comparator !== void 0) this.comparator = options.comparator;
	
	        this.models = [];
	        this._byId  = {};
	
	        if( models ) this.reset( models, new SilentOptions( options ) );
	
	        this.listenTo( this, this._listenToChanges, handleChange );
	
	        this.initialize.apply( this, arguments );
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
	
	    get : function( obj ){
	        if( obj == null ){ return void 0; }
	
	        if( typeof obj === 'object' ){
	            return this._byId[ obj[ this.model.prototype.idAttribute ] ] || this._byId[ obj.cid ];
	        }
	
	        return this._byId[ obj ];
	    },
	
	    set : method( function( models, options ){
	        return this.length ?
	               set( this, models, options ) :
	               emptySet( this, models, options );
	    } ),
	
	    reset : method( function( a_models, a_options ){
	        var options        = a_options || {},
	            previousModels = dispose( this );
	
	        var models = emptySet( this, a_models, new SilentOptions( options ) );
	
	        options.silent || trigger2( this, 'reset', this, _.defaults( { previousModels : previousModels }, options ) );
	
	        return models;
	    } ),
	
	    // Add a model to the end of the collection.
	    push: function(model, options) {
	        return this.add(model, _.extend({ at: this.length }, options ));
	    },
	
	    add : method( function( models, options ){
	        return this.length ?
	               add( this, models, options )
	            : emptySet( this, models, options );
	    } ),
	
	    sort : transaction( CollectionProto.sort ),
	
	// Methods with singular fast-path
	//------------------------------------------------
	    // Remove a model, or a list of models from the set.
	    remove : transaction( function( a_models, a_options ){
	        var options = a_options || {};
	
	        if( a_models ){
	            return a_models instanceof Array ?
	                   removeMany( this, a_models, options )
	                : removeOne( this, a_models, options );
	        }
	    } ),
	
	    // TODO: move to REST mixin
	    create : function( a_model, a_options ){
	        var options = new CreateOptions( a_options, this ),
	            model   = toModel( this, a_model, options );
	
	        if( !options.wait ) add( this, [ model ], options );
	        var collection  = this;
	        var success     = options.success;
	        options.success = function( model, resp, callbackOpts ){
	            if( options.wait ) add( collection, [ model ], callbackOpts );
	            if( success ) success.call( callbackOpts.context, model, resp, callbackOpts );
	        };
	
	        model.save( null, options );
	        return model;
	    },
	
	    _onModelEvent : function( event, model, collection, options ){
	        // lazy initialize dispatcher...
	        var dispatcher = this._dispatcher || ( this._dispatcher = new ModelEventsDispatcher( this.model ) ),
	            handler    = dispatcher[ event ] || trigger3;
	
	        handler( this, event, model, collection, options );
	    },
	
	    at : function( index ){
	        if( index < 0 ) index += this.length;
	        return this.models[ index ];
	    },
	
	    deepClone : function(){ return this.clone( { deep : true } ); },
	
	    clone : function( options ){
	        var models = options && options.deep ?
	                     this.map( function( model ){
	                         return model.clone( options );
	                     } ) : this.models;
	
	        return new this.constructor( models, { model : this.model, comparator : this.comparator } );
	    },
	
	    transaction : function( func, self, args ){
	        return transaction( func ).apply( self || this, args );
	    },
	
	    getModelIds : function(){ return _.pluck( this.models, 'id' ); },
	
	    createSubset : function( models, options ){
	        var SubsetOf = this.constructor.subsetOf( this ).createAttribute().type;
	        var subset   = new SubsetOf( models, options );
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
	        var This        = Backbone.Collection.extend.apply( this, arguments );
	        This.__subsetOf = null;
	        return This;
	    }
	} );

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Helper functions
	 */
	
	var Events   = __webpack_require__( 2 ).Events,
	    trigger3 = Events.trigger3,
	    trigger2 = Events.trigger2,
	    onAll    = Events.onAll,
	    offAll    = Events.offAll;
	
	var _ = __webpack_require__( 5 );
	
	var silence = { silent : true };
	
	module.exports = {
	    SilentOptions : SilentOptions,
	    silence       : silence,
	
	    addReference    : addReference,
	    removeReference : removeReference,
	
	    addIndex    : addIndex,
	    removeIndex : removeIndex,
	
	    dispose : dispose,
	
	    toModel : toModel,
	
	    ModelEventsDispatcher : ModelEventsDispatcher
	};
	
	function SilentOptions( a_options ){
	    var options = a_options || {};
	    this.parse  = options.parse;
	    this.sort   = options.sort;
	}
	
	SilentOptions.prototype = silence;
	
	
	// Ownership and events subscription
	function addReference( collection, model ){
	    model.collection || ( model.collection = collection );
	    onAll( model, collection._onModelEvent, collection );
	    return model;
	}
	
	function removeReference( collection, model ){
	    if( collection === model.collection ){
	        model.collection = void 0;
	    }
	
	    offAll( model, collection._onModelEvent, collection );
	}
	
	function dispose( collection ){
	    var models = collection.models;
	
	    collection.models = [];
	    collection._byId  = {};
	
	    for( var i = 0; i < models.length; i++ ){
	        removeReference( collection, models[ i ] );
	    }
	
	    return models;
	}
	
	// Index management
	function addIndex( _byId, model ){
	    _byId[ model.cid ] = model;
	    var id             = model.id;
	    if( id != null ){
	        _byId[ id ] = model;
	    }
	}
	
	function removeIndex( _byId, model ){
	    delete _byId[ model.cid ];
	    var id = model.id;
	    if( id != null ){
	        delete _byId[ id ];
	    }
	}
	
	function ModelOptions( options, collection ){
	    this.parse      = options.parse;
	    this.collection = collection;
	}
	
	// convert argument to model. Return false if fails.
	function toModel( collection, attrs, a_options ){
	    // Only subtype of current collection model is allowed
	    var Model = collection.model;
	    if( attrs instanceof Model ) return attrs;
	
	    var options = new ModelOptions( a_options, collection );
	
	    // Use abstract class factory if defined.
	    return Model.create ? Model.create( attrs, options ) : new Model( attrs, options );
	}
	
	function ModelEventsDispatcher( model ){
	    this[ 'change:' + model.prototype.idAttribute ] = _updateIdAttr;
	}
	
	ModelEventsDispatcher.prototype = {
	    change  : trigger2,
	    sync    : trigger2,
	    add     : _triggerWhenRelevant,
	    remove  : _triggerWhenRelevant,
	    destroy : function( self, event, model, collection, options ){
	        self.remove( model, options );
	        trigger3( self, event, model, collection, options );
	    }
	};
	
	function _triggerWhenRelevant( self, event, model, collection, options ){
	    if( collection === self ){
	        trigger3( self, event, model, collection, options );
	    }
	}
	
	function _updateIdAttr( self, event, model, collection, options ){
	    var _byId = self._byId;
	
	    _byId[ model._previousAttributes[ model.idAttribute ] ] = void 0;
	    var id                                            = model.id;
	    id == null || ( _byId[ id ] = model );
	
	    trigger3( self, event, model, collection, options );
	}

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Add models to collection, if models with the same id doesn't belong to collection
	 * options:
	 *  - silent = false
	 *  - sort = true
	 *  - at = null
	 *  - pass through other options
	 */
	var Events   = __webpack_require__( 2 ).Events,
	    trigger2 = Events.trigger2,
	    trigger3 = Events.trigger3;
	
	var Commons         = __webpack_require__( 15 ),
	    addIndex        = Commons.addIndex,
	    addReference    = Commons.addReference,
	    removeReference = Commons.removeReference,
	    toModel         = Commons.toModel,
	    silence         = Commons.silence;
	
	var MergeOptions = exports.MergeOptions = function( a_options, collection ){
	    var options = a_options || {};
	
	    this.silent = options.silent;
	    this.parse  = options.parse;
	    this.merge  = options.merge;
	
	    // at option
	    var at = options.at;
	    if( at != null ){
	        this.sort = false;
	
	        // if at is given, it overrides sorting option...
	        at = +at;
	        if( at < 0 ) at += collection.length + 1;
	        if( at < 0 ) at = 0;
	        if( at > collection.length ) at = collection.length;
	
	        this.at    = at;
	        this.index = null;
	    }
	    else{
	        this.sort = collection.comparator && options.sort !== false;
	    }
	};
	
	MergeOptions.prototype = {
	    notify : function( collection, added, sorted ){
	        var at       = this.at,
	            inserted = at != null;
	
	        for( var i = 0; i < added.length; i++ ){
	            var model = added[ i ];
	            if( inserted ) this.index = at++;
	            trigger3( model, 'add', model, collection, this );
	        }
	
	        sorted && trigger2( collection, 'sort', collection, this );
	
	        if( added.length ){
	            trigger2( collection, 'update', collection, this );
	        }
	    }
	};
	
	exports.add = function add( collection, items, a_options ){
	    var options = new MergeOptions( a_options, collection );
	
	    var _changed        = collection._changed;
	    collection._changed = false;
	
	    var added = _append( collection, items, options );
	
	    var changed  = collection._changed || added.length,
	        needSort = options.sort && changed;
	
	    collection._changed = changed || _changed;
	
	    if( options.at != null ){
	        _move( collection.models, options.at, added );
	    }
	    else if( needSort ){
	        collection.sort( silence );
	    }
	
	    options.silent || options.notify( collection, added, needSort );
	
	    return added;
	};
	
	// append data to model and index
	function _append( collection, a_items, a_options ){
	    var models      = collection.models,
	        _byId       = collection._byId,
	        merge       = a_options.merge,
	        parse       = a_options.parse,
	        idAttribute = collection.model.prototype.idAttribute,
	        prevLength = models.length;
	
	    for( var i = 0; i < a_items.length; i++ ){
	        var item  = a_items[ i ],
	            model = item ? _byId[ item[ idAttribute ] ] || _byId[ item.cid ] : null;
	
	        if( model ){
	            if( merge && item !== model ){
	                var attrs = item.attributes || item;
	                if( parse ) attrs = model.parse( attrs, a_options );
	                model.set( attrs, a_options );
	            }
	        }
	        else{
	            model = toModel( collection, item, a_options );
	
	            models.push( model );
	            addReference( collection, model );
	            addIndex( _byId, model );
	        }
	    }
	
	    return models.slice( prevLength );
	}
	
	function _move( source, at, added ){
	    for( var j = source.length - 1, i = j - added.length; i >= at; i--, j-- ){
	        source[ j ] = source[ i ];
	    }
	
	    for( i = 0, j = at; i < added.length; i++, j++ ){
	        source[ j ] = added[ i ];
	    }
	}
	
	
	exports.emptySet = function emptySet( collection, items, a_options, silent ){
	    var options = new MergeOptions( a_options, collection );
	
	    if( silent ){
	        options.silent = silent;
	    }
	
	    var added = _reallocateEmpty( collection, items, options );
	
	    collection._changed || ( collection._changed = added.length );
	
	    var needSort = options.sort && added.length;
	    if( needSort ) collection.sort( silence );
	
	    options.silent || options.notify( collection, added, needSort );
	
	    return added;
	};
	
	function _reallocateEmpty( self, source, options ){
	    var len         = source ? source.length : 0,
	        models      = Array( len ),
	        _byId       = {},
	        idAttribute = self.model.prototype.idAttribute;
	
	    for( var i = 0, j = 0; i < len; i++ ){
	        var src = source[ i ];
	
	        if( src && ( _byId[ src[ idAttribute ] ] || _byId[ src.cid ] ) ){
	            continue;
	        }
	
	        var model = toModel( self, src, options );
	
	        addReference( self, model );
	        models[ j++ ] = model;
	        addIndex( _byId, model );
	
	    }
	
	    models.length = j;
	    self._byId    = _byId;
	
	    return self.models = models;
	}
	
	exports.set = function set( collection, items, a_options ){
	    var options = new MergeOptions( a_options, collection );
	
	    var _changed        = collection._changed;
	    collection._changed = false;
	
	    var previous = collection.models,
	        added    = _reallocate( collection, items, options );
	
	    var removed        = collection.models.length - added.length < previous.length,
	        addedOrChanged = collection._changed || added.length,
	        needSort       = options.sort && addedOrChanged;
	
	    collection._changed = addedOrChanged || removed || _changed;
	
	    if( needSort ){ collection.sort( silence ) }
	
	    if( removed ){
	        _garbageCollect( collection, previous, options );
	    }
	
	    // Unless silenced, it's time to fire all appropriate add/sort events.
	    options.silent || options.notify( collection, added, needSort );
	
	    // Return the added (or merged) model (or models).
	    return collection.models;
	};
	
	// Remove references from models missing in collection's index
	// Send 'remove' events if no silent
	function _garbageCollect( collection, previous, options ){
	    var _byId  = collection._byId,
	        silent = options.silent;
	
	    // Filter out removed models and remove them from the index...
	    for( var i = 0; i < previous.length; i++ ){
	        var model = previous[ i ];
	
	        if( !_byId[ model.cid ] ){
	            silent || trigger3( model, 'remove', model, collection, options );
	            removeReference( collection, model );
	        }
	    }
	}
	
	// reallocate model and index
	function _reallocate( self, source, options ){
	    var models      = Array( source.length ),
	        _byId       = {},
	        merge       = options.merge == null ? true : options.merge,
	        _prevById   = self._byId,
	        idAttribute = self.model.prototype.idAttribute,
	        toAdd       = [];
	
	    // for each item in source set...
	    for( var i = 0, j = 0; i < source.length; i++ ){
	        var item  = source[ i ],
	            model = null;
	
	        if( item ){
	            var id  = item[ idAttribute ],
	                cid = item.cid;
	
	            if( _byId[ id ] || _byId[ cid ] ) continue;
	
	            model = _prevById[ id ] || _prevById[ cid ];
	        }
	
	        if( model ){
	            if( merge && item !== model ){
	                var attrs = item.attributes || item;
	                if( options.parse ) attrs = model.parse( attrs, options );
	                model.set( attrs, options );
	            }
	        }
	        else{
	            model = toModel( self, item, options );
	            addReference( self, model );
	            toAdd.push( model );
	        }
	
	        models[ j++ ] = model;
	        addIndex( _byId, model );
	    }
	
	    models.length = j;
	    self.models   = models;
	    self._byId    = _byId;
	
	    return toAdd;
	}

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Remove single element from collection
	 * el: ModelId | ModelCid | Model | ModelAttrs
	 * Options:
	 *      - silent : Boolean = false
	 */
	
	var Commons         = __webpack_require__( 15 ),
	    removeIndex     = Commons.removeIndex,
	    removeReference = Commons.removeReference;
	
	var Events   = __webpack_require__( 2 ).Events,
	    trigger3 = Events.trigger3,
	    trigger2 = Events.trigger2;
	
	function RemoveOptions( options ){
	    this.silent = options.silent;
	}
	
	RemoveOptions.prototype = {
	    add    : false,
	    remove : true,
	    merge  : false
	};
	
	exports.removeOne = function removeOne( collection, el, a_options ){
	    var options = new RemoveOptions( a_options );
	
	    var model = collection.get( el );
	    if( model ){
	        var models = collection.models,
	            // TODO: for sorted collection, find element with binary search.
	            at     = _.indexOf( models, model ),
	            silent = options.silent;
	
	        models.splice( at, 1 );
	
	        removeIndex( collection._byId, model );
	
	        silent || trigger3( model, 'remove', model, collection, options );
	
	        removeReference( collection, model );
	
	        silent || trigger2( collection, 'update', collection, options );
	
	        return model;
	    }
	};
	
	/** Optimized for removing many elements
	 * 1. Remove elements from the index, checking for duplicates
	 * 2. Create new models array matching index
	 * 3. Send notifications and remove references
	 */
	exports.removeMany = function removeMany( collection, toRemove, a_options ){
	    var options = new RemoveOptions( a_options );
	
	    var removed = _removeFromIndex( collection, toRemove );
	
	    _reallocate( collection, removed.length );
	
	    _removeModels( collection, removed, options );
	
	    options.silent || !removed.length || trigger2( collection, 'update', collection, options );
	
	    return removed;
	};
	
	// remove models from the index...
	function _removeFromIndex( collection, toRemove ){
	    var removed = Array( toRemove.length ),
	        _byId   = collection._byId;
	
	    for( var i = 0, j = 0; i < toRemove.length; i++ ){
	        var model = collection.get( toRemove[ i ] );
	        if( model ){
	            removed[ j++ ] = model;
	            removeIndex( _byId, model );
	        }
	    }
	
	    removed.length = j;
	
	    return removed;
	}
	
	// Allocate new models array removing models not present in the index.
	function _reallocate( collection, removed ){
	    var prev   = collection.models,
	        models = collection.models = Array( prev.length - removed ),
	        _byId = collection._byId;
	
	    for( var i = 0, j = 0; i < prev.length; i++ ){
	        var model = prev[ i ];
	
	        if( _byId[ model.cid ] ){
	            models[ j++ ] = model;
	        }
	    }
	
	    models.length = j;
	}
	
	function _removeModels( collection, removed, options ){
	    var silent = options.silent;
	    for( var i = 0; i < removed.length; i++ ){
	        var model = removed[ i ];
	        silent || trigger3( model, 'remove', model, collection, options );
	        removeReference( collection, model );
	    }
	}

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	// Nested Relations
	//=================
	
	var bbVersion  = __webpack_require__( 2 ).VERSION,
	    attribute  = __webpack_require__( 10 ),
	    error      = __webpack_require__( 9 ),
	    Collection = __webpack_require__( 14 ),
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
	        validate : function( model, value, name ){},
	        isChanged : function( a, b ){
	            // refs are equal when their id is equal.
	            var aId = a && ( a.id == null ? a : a.id ),
	                bId = b && ( b.id == null ? b : b.id );
	
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
	
	function adjustOptions( models, options ){
	    var adjust = { merge : false };
	
	    if( models ){
	        if( models instanceof Array && models.length && typeof models[ 0 ] !== 'object' ){
	            adjust.merge = adjust.parse = true;
	        }
	    }
	
	    return _.defaults( adjust, options );
	}
	
	var refsCollectionSpec = {
	    _listenToChanges : 'update reset', // don't bubble changes from models
	    __class          : 'Collection.subsetOf',
	
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
	
	    set : function( models, options ){
	        return CollectionProto.set.call( this, models, adjustOptions( models, options ) );
	    },
	
	    add : function( models, options ){
	        return CollectionProto.add.call( this, models, adjustOptions( models, options ) );
	    },
	
	    reset : function( models, options ){
	        return CollectionProto.reset.call( this, models, adjustOptions( models, options ) );
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
	        validate : function( model, value, name ){},
	        get : function( refs ){
	            !refs || refs.resolvedWith || refs.resolve( getMaster.call( this ) );
	            return refs;
	        }
	    } );
	};


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	// Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
	// (c) 2011 Colin Snover <http://zetafleet.com>
	// Released under MIT license.
	
	// Attribute Type definitions for core JS types
	// ============================================
	var attribute  = __webpack_require__( 10 ),
	    modelSet   = __webpack_require__( 8 ),
	    Model      = __webpack_require__( 1 ),
	    errors     = __webpack_require__( 9 ),
	    Collection = __webpack_require__( 14 );
	
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
	
	    validate : function( model, value, name ){
	        if( isNaN( +value ) ) return 'Invalid Date';
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
	
	var PrimitiveType = attribute.Type.extend( {
	    create : function(){ return this.type(); },
	
	    toJSON : function( value ){ return value; },
	    cast   : function( value ){ return value == null ? null : this.type( value ); },
	
	    isChanged : function( a, b ){ return a !== b; },
	
	    clone : function( value ){ return value; }
	} );
	
	PrimitiveType.attach( Boolean, String );
	
	PrimitiveType.extend({
	    validate : function( model, value, name ){
	        if( value !== value || value === Infinity || value === -Infinity ) return name + ' is invalid number';
	    }
	} ).attach( Integer, Number );
	
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
	    create : function( attrs, options ){
	        var Type = this.type;
	        return Type.create ? Type.create( attrs, options ) : new Type( attrs, options );
	    },
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
	
	    validate : function( model, value, name ){
	        var error = value && value.validationError;
	        if( error ) return error;
	    },
	
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
	                value = this.create( value, options );
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
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var Backbone   = __webpack_require__( 2 ),
	    $          = Backbone.$;
	    Model      = __webpack_require__( 1 ),
	    Collection = __webpack_require__( 14 ),
	    RestMixin  = __webpack_require__( 12 ),
	    _          = __webpack_require__( 5 );
	
	var _store = null;
	
	var Store = exports.Model = Model.extend({
	  // end store lookup sequence on this class
	  getStore : function(){ return this; },
	
	  sync : function(){ return RestMixin.sync.apply( Backbone, arguments ); },
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
	                element.fetch = function() {
	                    return self._resolved[ name ] = fetch.apply( this, arguments );
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
	
	    // fetch specified items, or all items if called without arguments.
	    // returns first jquery promise.
	    fetchOnce : function(){
	        var xhr         = [],
	            self        = this,
	            objsToFetch = arguments.length ? arguments : _.keys( this.attributes );
	
	        _.each( objsToFetch, function( name ){
	            var attr = this.attributes[ name ];
	            self._resolved[ name ] || attr && attr.fetch && xhr.push( attr.fetch() );
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
	                    if( !this._resolved[name] ) {
	                        value.fetch && value.fetch();
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