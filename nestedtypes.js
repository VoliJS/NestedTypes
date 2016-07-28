(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("underscore"), require("jquery"));
	else if(typeof define === 'function' && define.amd)
		define(["underscore", "jquery"], factory);
	else if(typeof exports === 'object')
		exports["Nested"] = factory(require("underscore"), require("jquery"));
	else
		root["Nested"] = factory(root["_"], root["$"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_29__, __WEBPACK_EXTERNAL_MODULE_30__) {
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

	"use strict";
	var object_plus_1 = __webpack_require__(1);
	var src_1 = __webpack_require__(6);
	var BackboneShim = __webpack_require__(28);
	var rest_1 = __webpack_require__(31);
	var src_2 = __webpack_require__(6);
	var Nested = {};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Nested;
	object_plus_1.assign(Nested, BackboneShim, object_plus_1.Events, {
	    Backbone: BackboneShim,
	    Class: object_plus_1.Mixable,
	    attribute: attribute,
	    options: attribute,
	    value: function (value) {
	        return attribute({ value: value });
	    },
	    parseReference: relations.parseReference,
	    Collection: src_1.Collection,
	    Model: src_1.Model,
	    RestModel: rest_1.RestModel,
	    RestCollection: rest_1.RestCollection,
	    Store: src_2.Store,
	    LazyStore: src_2.Store.Lazy,
	    defaults: function (x) {
	        return src_1.Model.defaults(x);
	    },
	    transaction: function (fun) {
	        return function () {
	            return this.transaction(fun, this, arguments);
	        };
	    }
	});
	Nested.Events = object_plus_1.Events;
	object_plus_1.Mixable.mixins(object_plus_1.Events);
	object_plus_1.Mixable.mixTo(Nested.View, Nested.Router, Nested.History);
	Nested.Class = object_plus_1.Mixable;
	Object.defineProperties(Nested, {
	    'sync': linkProperty(Rest, 'sync'),
	    'errorPromise': linkProperty(Rest, 'errorPromise'),
	    'ajax': linkProperty(Rest, 'ajax'),
	    'history': linkProperty(BackboneShim, 'history'),
	    'store': linkProperty(src_2.Store, 'global'),
	    '$': {
	        get: function () { return BackboneShim.$; },
	        set: function (value) { BackboneShim.$ = Rest.$ = value; }
	    }
	});
	function linkProperty(Namespace, name) {
	    return {
	        get: function () { return Namespace[name]; },
	        set: function (value) { Namespace[name] = value; }
	    };
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(2));
	__export(__webpack_require__(3));
	__export(__webpack_require__(4));


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	var Log = (function () {
	    function Log() {
	        this.level = 2;
	    }
	    Log.prototype.error = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        console.error.apply(console, args);
	    };
	    Log.prototype.warn = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        if (this.level > 0)
	            console.warn.apply(console, args);
	    };
	    Log.prototype.info = function () {
	        if (this.level > 1)
	            console.info.apply(console, arguments);
	    };
	    Log.prototype.debug = function () {
	        if (this.level > 2)
	            console.log.apply(console, arguments);
	    };
	    return Log;
	}());
	exports.log = new Log();
	function isValidJSON(value) {
	    if (value === null) {
	        return true;
	    }
	    switch (typeof value) {
	        case 'number':
	        case 'string':
	        case 'boolean':
	            return true;
	        case 'object':
	            var proto = Object.getPrototypeOf(value);
	            if (proto === Object.prototype || proto === Array.prototype) {
	                return every(value, isValidJSON);
	            }
	    }
	    return false;
	}
	exports.isValidJSON = isValidJSON;
	function getBaseClass(Class) {
	    return Object.getPrototypeOf(Class.prototype).constructor;
	}
	exports.getBaseClass = getBaseClass;
	function isEmpty(obj) {
	    if (obj) {
	        for (var key in obj) {
	            if (obj.hasOwnProperty(key)) {
	                return false;
	            }
	        }
	    }
	    return true;
	}
	exports.isEmpty = isEmpty;
	function someArray(arr, fun) {
	    var result;
	    for (var i = 0; i < arr.length; i++) {
	        if (result = fun(arr[i], i)) {
	            return result;
	        }
	    }
	}
	function someObject(obj, fun) {
	    var result;
	    for (var key in obj) {
	        if (obj.hasOwnProperty(key)) {
	            if (result = fun(obj[key], key)) {
	                return result;
	            }
	        }
	    }
	}
	function some(obj, fun) {
	    if (Object.getPrototypeOf(obj) === ArrayProto) {
	        return someArray(obj, fun);
	    }
	    else {
	        return someObject(obj, fun);
	    }
	}
	exports.some = some;
	function every(obj, predicate) {
	    return !some(obj, function (x) { return !predicate(x); });
	}
	exports.every = every;
	function getPropertyDescriptor(obj, prop) {
	    var desc;
	    for (var proto = obj; !desc && proto; proto = Object.getPrototypeOf(proto)) {
	        desc = Object.getOwnPropertyDescriptor(obj, prop);
	    }
	    return desc;
	}
	exports.getPropertyDescriptor = getPropertyDescriptor;
	function omit(source) {
	    var dest = {}, discard = {};
	    for (var i = 1; i < arguments.length; i++) {
	        discard[arguments[i]] = true;
	    }
	    for (var name in source) {
	        if (!discard[name] && source.hasOwnProperty(name)) {
	            dest[name] = source[name];
	        }
	    }
	    return dest;
	}
	exports.omit = omit;
	function transform(dest, source, fun) {
	    for (var name in source) {
	        if (source.hasOwnProperty(name)) {
	            var value = fun(source[name], name);
	            value === void 0 || (dest[name] = value);
	        }
	    }
	    return dest;
	}
	exports.transform = transform;
	function fastAssign(dest, source) {
	    for (var name in source) {
	        dest[name] = source[name];
	    }
	    return dest;
	}
	exports.fastAssign = fastAssign;
	function fastDefaults(dest, source) {
	    for (var name in source) {
	        if (dest[name] === void 0) {
	            dest[name] = source[name];
	        }
	    }
	    return dest;
	}
	exports.fastDefaults = fastDefaults;
	function forAllArgs(fun) {
	    return function (dest) {
	        var sources = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            sources[_i - 1] = arguments[_i];
	        }
	        for (var i = 0; i < sources.length; i++) {
	            var source = sources[i];
	            source && fun(dest, source);
	        }
	        return dest;
	    };
	}
	exports.assign = forAllArgs(function (dest, source) {
	    for (var name in source) {
	        if (source.hasOwnProperty(name)) {
	            dest[name] = source[name];
	        }
	    }
	});
	exports.defaults = forAllArgs(function (dest, source) {
	    for (var name in source) {
	        if (source.hasOwnProperty(name) && dest[name] === void 0) {
	            dest[name] = source[name];
	        }
	    }
	});
	function keys(o) {
	    return o ? Object.keys(o) : [];
	}
	exports.keys = keys;
	function once(func) {
	    var memo, first = true;
	    return function () {
	        if (first) {
	            first = false;
	            memo = func.apply(this, arguments);
	            func = null;
	        }
	        return memo;
	    };
	}
	exports.once = once;
	var ArrayProto = Array.prototype, DateProto = Date.prototype, ObjectProto = Object.prototype;
	function notEqual(a, b) {
	    if (a === b)
	        return false;
	    if (a && b && typeof a == 'object' && typeof b == 'object') {
	        var protoA = Object.getPrototypeOf(a);
	        if (protoA !== Object.getPrototypeOf(b))
	            return true;
	        switch (protoA) {
	            case DateProto: return +a !== +b;
	            case ArrayProto: return arraysNotEqual(a, b);
	            case ObjectProto:
	            case null:
	                return objectsNotEqual(a, b);
	        }
	    }
	    return true;
	}
	exports.notEqual = notEqual;
	function objectsNotEqual(a, b) {
	    var keysA = Object.keys(a);
	    if (keysA.length !== Object.keys(b).length)
	        return true;
	    for (var i = 0; i < keysA.length; i++) {
	        var key = keysA[i];
	        if (!b.hasOwnProperty(key) || notEqual(a[key], b[key])) {
	            return true;
	        }
	    }
	    return false;
	}
	function arraysNotEqual(a, b) {
	    if (a.length !== b.length)
	        return true;
	    for (var i = 0; i < a.length; i++) {
	        if (notEqual(a[i], b[i]))
	            return true;
	    }
	    return false;
	}
	var numericKeys = [1, 4, 5, 6, 7, 10, 11], msDatePattern = /\/Date\(([0-9]+)\)\//, isoDatePattern = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;
	function safeParseDate(date) {
	    var msDate, timestamp, struct, minutesOffset = 0;
	    if (msDate = msDatePattern.exec(date)) {
	        timestamp = Number(msDate[1]);
	    }
	    else if ((struct = isoDatePattern.exec(date))) {
	        for (var i = 0, k; (k = numericKeys[i]); ++i) {
	            struct[k] = +struct[k] || 0;
	        }
	        struct[2] = (+struct[2] || 1) - 1;
	        struct[3] = +struct[3] || 1;
	        if (struct[8] !== 'Z' && struct[9] !== undefined) {
	            minutesOffset = struct[10] * 60 + struct[11];
	            if (struct[9] === '+') {
	                minutesOffset = 0 - minutesOffset;
	            }
	        }
	        timestamp =
	            Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
	    }
	    else {
	        timestamp = Date.parse(date);
	    }
	    return timestamp;
	}
	function fastParseDate(date) {
	    var msDate = msDatePattern.exec(date);
	    return msDate ? Number(msDate[1]) : Date.parse(date);
	}
	function supportsDate(date) {
	    return !isNaN(Date.parse(date));
	}
	var parseDate = supportsDate('2011-11-29T15:52:30.5') &&
	    supportsDate('2011-11-29T15:52:30.52') &&
	    supportsDate('2011-11-29T15:52:18.867') &&
	    supportsDate('2011-11-29T15:52:18.867Z') &&
	    supportsDate('2011-11-29T15:52:18.867-03:30') ? fastParseDate : safeParseDate;
	exports.parseDate = parseDate;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var tools_1 = __webpack_require__(2);
	var Mixable = (function () {
	    function Mixable() {
	    }
	    Mixable.create = function (a, b, c) {
	        return new this(a, b, c);
	    };
	    Mixable.mixins = function () {
	        var mixins = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            mixins[_i - 0] = arguments[_i];
	        }
	        var proto = this.prototype, mergeRules = this._mixinRules || {};
	        for (var _a = 0, mixins_1 = mixins; _a < mixins_1.length; _a++) {
	            var mixin = mixins_1[_a];
	            if (mixin instanceof Array) {
	                Mixable.mixins.apply(this, mixin);
	            }
	            else if (typeof mixin === 'function') {
	                tools_1.defaults(this, mixin);
	                mergeProps(proto, mixin.prototype, mergeRules);
	            }
	            else {
	                mergeProps(proto, mixin, mergeRules);
	            }
	        }
	        return this;
	    };
	    Mixable.mixTo = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
	            var Ctor = args_1[_a];
	            Mixable.mixins.call(Ctor, this);
	        }
	        return this;
	    };
	    Mixable.mixinRules = function (mixinRules) {
	        var Base = Object.getPrototypeOf(this.prototype).constructor;
	        if (Base._mixinRules) {
	            mergeProps(mixinRules, Base._mixinRules);
	        }
	        this._mixinRules = mixinRules;
	        return this;
	    };
	    Mixable.define = function (definition, staticProps) {
	        if (definition === void 0) { definition = {}; }
	        if (!this.define) {
	            tools_1.log.error("[Class.define] Class must have class extensions to use @define decorator. Use '@extendable' before @define, or extend the base class with class extensions.", definition);
	            return this;
	        }
	        this.predefine();
	        var proto = this.prototype;
	        var protoProps = tools_1.omit(definition, 'properties', 'mixins', 'mixinRules'), _a = definition.properties, properties = _a === void 0 ? {} : _a, mixins = definition.mixins, mixinRules = definition.mixinRules;
	        tools_1.assign(proto, protoProps);
	        tools_1.assign(this, staticProps);
	        properties && Object.defineProperties(proto, tools_1.transform({}, properties, toPropertyDescriptor));
	        mixinRules && this.mixinRules(mixinRules);
	        mixins && this.mixins(mixins);
	        return this;
	    };
	    Mixable.extend = function (spec, statics) {
	        var Subclass;
	        if (spec && spec.hasOwnProperty('constructor')) {
	            Subclass = spec.constructor;
	            __extends(Subclass, this);
	        }
	        else {
	            Subclass = (function (_super) {
	                __extends(Subclass, _super);
	                function Subclass() {
	                    _super.apply(this, arguments);
	                }
	                return Subclass;
	            }(this));
	        }
	        return spec ? Subclass.define(spec, statics) : Subclass.predefine();
	    };
	    Mixable.predefine = function () {
	        var BaseClass = tools_1.getBaseClass(this);
	        if (BaseClass.create === this.create) {
	            this.create = Mixable.create;
	        }
	        return this;
	    };
	    Mixable._mixinRules = { properties: 'merge' };
	    return Mixable;
	}());
	exports.Mixable = Mixable;
	function toPropertyDescriptor(x) {
	    if (x) {
	        return typeof x === 'function' ? { get: x } : x;
	    }
	}
	function mixinRules(rules) {
	    return createDecorator('mixinRules', rules);
	}
	exports.mixinRules = mixinRules;
	function mixins() {
	    var list = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        list[_i - 0] = arguments[_i];
	    }
	    return createDecorator('mixins', list);
	}
	exports.mixins = mixins;
	function extendable(Type) {
	    Mixable.mixTo(Type);
	}
	exports.extendable = extendable;
	function predefine(Constructor) {
	    Constructor.predefine();
	}
	exports.predefine = predefine;
	function define(spec) {
	    return createDecorator('define', spec);
	}
	exports.define = define;
	function createDecorator(name, spec) {
	    return function (Ctor) {
	        if (Ctor[name]) {
	            Ctor[name](spec);
	        }
	        else {
	            Mixable[name].call(Ctor, spec);
	        }
	    };
	}
	function mergeObjects(a, b, rules) {
	    var x = tools_1.assign({}, a);
	    return mergeProps(x, b, rules);
	}
	var mergeFunctions = {
	    pipe: function (a, b) {
	        return function (x) {
	            return a.call(this, b.call(this, x));
	        };
	    },
	    sequence: function (a, b) {
	        return function () {
	            a.apply(this, arguments);
	            b.apply(this, arguments);
	        };
	    },
	    reverse: function (a, b) {
	        return function () {
	            b.apply(this, arguments);
	            a.apply(this, arguments);
	        };
	    },
	    every: function (a, b) {
	        return function () {
	            return a.apply(this, arguments) && b.apply(this, arguments);
	        };
	    },
	    some: function (a, b) {
	        return function () {
	            return a.apply(this, arguments) || b.apply(this, arguments);
	        };
	    }
	};
	function mergeProps(target, source, rules) {
	    if (rules === void 0) { rules = {}; }
	    for (var _i = 0, _a = Object.keys(source); _i < _a.length; _i++) {
	        var name_1 = _a[_i];
	        var sourceProp = Object.getOwnPropertyDescriptor(source, name_1), destProp = tools_1.getPropertyDescriptor(target, name_1);
	        if (destProp) {
	            var rule = rules[name_1], value = destProp.value;
	            if (rule && value) {
	                target[name_1] = typeof rule === 'object' ?
	                    mergeObjects(value, sourceProp.value, rule) : (rule === 'merge' ?
	                    mergeObjects(value, sourceProp.value) :
	                    mergeFunctions[rule](value, sourceProp.value));
	            }
	        }
	        else {
	            Object.defineProperty(target, name_1, sourceProp);
	        }
	    }
	    return target;
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
	    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	    return c > 3 && r && Object.defineProperty(target, key, r), r;
	};
	var Mixins = __webpack_require__(3);
	var Tools = __webpack_require__(2);
	var EventMaps = __webpack_require__(5);
	var eventmaps_1 = __webpack_require__(5);
	exports.EventMap = eventmaps_1.EventMap;
	var mixins = Mixins.mixins, define = Mixins.define, extendable = Mixins.extendable;
	var omit = Tools.omit, once = Tools.once, isEmpty = Tools.isEmpty, keys = Tools.keys;
	var EventHandler = EventMaps.EventHandler, trigger0 = EventMaps.trigger0, trigger1 = EventMaps.trigger1, trigger2 = EventMaps.trigger2, trigger3 = EventMaps.trigger3;
	var eventSplitter = /\s+/;
	var _idCount = 0;
	function uniqueId() {
	    return 'l' + _idCount++;
	}
	var Messenger = (function () {
	    function Messenger(cid) {
	        this._events = void 0;
	        this.cid = this.cidPrefix + cid;
	    }
	    Messenger.define = function (protoProps, staticProps) {
	        var spec = omit(protoProps || {}, 'localEvents');
	        if (protoProps) {
	            var localEvents = protoProps.localEvents, _localEvents = protoProps._localEvents;
	            if (localEvents || _localEvents) {
	                var eventsMap = new eventmaps_1.EventMap(this.prototype._localEvents);
	                localEvents && eventsMap.addEventsMap(localEvents);
	                _localEvents && eventsMap.merge(_localEvents);
	                spec._localEvents = eventsMap;
	            }
	        }
	        return Mixins.Mixable.define.call(this, spec, staticProps);
	    };
	    Messenger.prototype.on = function (name, callback, context) {
	        return internalOn(this, name, callback, context);
	    };
	    Messenger.prototype.off = function (name, callback, context) {
	        if (!this._events)
	            return this;
	        this._events = eventsApi(offApi, this._events, name, callback, new OffOptions(context, this._listeners));
	        return this;
	    };
	    Messenger.prototype.stopListening = function (obj, name, callback) {
	        var listeningTo = this._listeningTo;
	        if (!listeningTo)
	            return this;
	        var ids = obj ? [obj.cid] : keys(listeningTo);
	        for (var i = 0; i < ids.length; i++) {
	            var listening = listeningTo[ids[i]];
	            if (!listening)
	                break;
	            listening.obj.off(name, callback, this);
	        }
	        if (isEmpty(listeningTo))
	            this._listeningTo = void 0;
	        return this;
	    };
	    Messenger.prototype.listenTo = function (obj, name, callback) {
	        if (!obj)
	            return this;
	        var id = obj.cid || (obj.cid = uniqueId()), listeningTo = this._listeningTo || (this._listeningTo = {});
	        var listening = listeningTo[id];
	        if (!listening) {
	            var thisId = this.cid || (this.cid = uniqueId());
	            listening = listeningTo[id] = new ListeningTo(obj, id, thisId, listeningTo);
	        }
	        internalOn(obj, name, callback, this, listening);
	        return this;
	    };
	    Messenger.prototype.once = function (name, callback, context) {
	        var events = eventsApi(onceMap, {}, name, callback, this.off.bind(this));
	        return this.on(events, void 0, context);
	    };
	    Messenger.prototype.listenToOnce = function (obj, name, callback) {
	        var events = eventsApi(onceMap, {}, name, callback, this.stopListening.bind(this, obj));
	        return this.listenTo(obj, events);
	    };
	    Messenger.prototype.trigger = function (name, a, b, c) {
	        if (!this._events)
	            return this;
	        switch (arguments.length) {
	            case 1:
	                trigger0(this, name);
	                break;
	            case 2:
	                trigger1(this, name, a);
	                break;
	            case 3:
	                trigger2(this, name, a, b);
	                break;
	            case 4:
	                trigger3(this, name, a, b, c);
	                break;
	            default:
	                var allArgs = Array(arguments.length);
	                for (var i = 0; i < allArgs.length; i++) {
	                    allArgs[i] = arguments[i];
	                }
	                var _events = this._events;
	                var queue = _events[name];
	                if (queue)
	                    _fireEventAll(queue, allArgs.splice(0, 1));
	                if (queue = _events.all)
	                    _fireEventAll(queue, allArgs);
	        }
	        return this;
	    };
	    Messenger.prototype.dispose = function () {
	        this.stopListening();
	        this.off();
	    };
	    Messenger.trigger0 = EventMaps.trigger0;
	    Messenger.trigger1 = EventMaps.trigger1;
	    Messenger.trigger2 = EventMaps.trigger2;
	    Messenger.trigger3 = EventMaps.trigger3;
	    Messenger.on = EventMaps.on;
	    Messenger.off = EventMaps.off;
	    Messenger = __decorate([
	        define({
	            cidPrefix: 'l'
	        }),
	        extendable
	    ], Messenger);
	    return Messenger;
	}());
	exports.Messenger = Messenger;
	var slice = Array.prototype.slice;
	exports.Events = Messenger.prototype;
	function eventsApi(iteratee, events, name, callback, opts) {
	    var i = 0, names;
	    if (name && typeof name === 'object') {
	        if (callback !== void 0 && 'context' in opts && opts.context === void 0)
	            opts.context = callback;
	        for (names = keys(name); i < names.length; i++) {
	            events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
	        }
	    }
	    else if (name && eventSplitter.test(name)) {
	        for (names = name.split(eventSplitter); i < names.length; i++) {
	            events = iteratee(events, names[i], callback, opts);
	        }
	    }
	    else {
	        events = iteratee(events, name, callback, opts);
	    }
	    return events;
	}
	;
	var ListeningTo = (function () {
	    function ListeningTo(obj, objId, id, listeningTo) {
	        this.obj = obj;
	        this.objId = objId;
	        this.id = id;
	        this.listeningTo = listeningTo;
	        this.count = 0;
	    }
	    return ListeningTo;
	}());
	function internalOn(obj, name, callback, context, listening) {
	    obj._events = eventsApi(onApi, obj._events || {}, name, callback, new EventHandler(context, obj, listening));
	    if (listening) {
	        var listeners = obj._listeners || (obj._listeners = {});
	        listeners[listening.id] = listening;
	    }
	    return obj;
	}
	;
	function onApi(events, name, callback, options) {
	    if (callback) {
	        var handlers = events[name], toAdd = [options.clone(callback)];
	        events[name] = handlers ? handlers.concat(toAdd) : toAdd;
	    }
	    return events;
	}
	;
	var OffOptions = (function () {
	    function OffOptions(context, listeners) {
	        this.context = context;
	        this.listeners = listeners;
	    }
	    return OffOptions;
	}());
	function offApi(events, name, callback, options) {
	    if (!events)
	        return;
	    var i = 0, listening;
	    var context = options.context, listeners = options.listeners;
	    if (!name && !callback && !context) {
	        var ids = keys(listeners);
	        for (; i < ids.length; i++) {
	            listening = listeners[ids[i]];
	            delete listeners[listening.id];
	            delete listening.listeningTo[listening.objId];
	        }
	        return {};
	    }
	    var names = name ? [name] : keys(events);
	    for (; i < names.length; i++) {
	        name = names[i];
	        var handlers = events[name];
	        if (!handlers)
	            break;
	        var remaining = [];
	        for (var j = 0; j < handlers.length; j++) {
	            var handler = handlers[j];
	            if (callback && callback !== handler.callback &&
	                callback !== handler.callback._callback ||
	                context && context !== handler.context) {
	                remaining.push(handler);
	            }
	            else {
	                listening = handler.listening;
	                if (listening && --listening.count === 0) {
	                    delete listeners[listening.id];
	                    delete listening.listeningTo[listening.objId];
	                }
	            }
	        }
	        if (remaining.length) {
	            events[name] = remaining;
	        }
	        else {
	            delete events[name];
	        }
	    }
	    return events;
	}
	;
	function onceMap(map, name, callback, offer) {
	    if (callback) {
	        var _once_1 = map[name] = once(function () {
	            offer(name, _once_1);
	            callback.apply(this, arguments);
	        });
	        _once_1._callback = callback;
	    }
	    return map;
	}
	;
	function _fireEventAll(events, a) {
	    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
	        var ev = events_1[_i];
	        ev.callback.call(ev.ctx, a);
	    }
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	exports.eventSplitter = /\s+/;
	var EventHandler = (function () {
	    function EventHandler(context, ctx, listening, callback) {
	        this.context = context;
	        this.ctx = ctx;
	        this.listening = listening;
	        this.callback = callback;
	    }
	    EventHandler.prototype.clone = function (callback) {
	        var _a = this, context = _a.context, listening = _a.listening;
	        if (listening)
	            listening.count++;
	        return new EventHandler(context, context || this.ctx, listening, callback);
	    };
	    return EventHandler;
	}());
	exports.EventHandler = EventHandler;
	var EventMap = (function () {
	    function EventMap(map) {
	        this.handlers = [];
	        if (map) {
	            if (map instanceof EventMap) {
	                this.handlers = map.handlers.slice();
	            }
	            else {
	                map && this.addEventsMap(map);
	            }
	        }
	    }
	    EventMap.prototype.merge = function (map) {
	        this.handlers = this.handlers.concat(map.handlers);
	    };
	    EventMap.prototype.addEventsMap = function (map) {
	        for (var names in map) {
	            this.addEvent(names, map[names]);
	        }
	    };
	    EventMap.prototype.bubbleEvents = function (names) {
	        for (var _i = 0, _a = names.split(exports.eventSplitter); _i < _a.length; _i++) {
	            var name_1 = _a[_i];
	            this.addEvent(name_1, getBubblingHandler(name_1));
	        }
	    };
	    EventMap.prototype.addEvent = function (names, callback) {
	        var handlers = this.handlers;
	        for (var _i = 0, _a = names.split(exports.eventSplitter); _i < _a.length; _i++) {
	            var name_2 = _a[_i];
	            handlers.push(new EventDescriptor(name_2, callback));
	        }
	    };
	    EventMap.prototype.subscribe = function (target, source) {
	        var _events = source._events || (source._events = {});
	        for (var _i = 0, _a = this.handlers; _i < _a.length; _i++) {
	            var event_1 = _a[_i];
	            _on(_events, event_1.name, event_1.callback, target);
	        }
	    };
	    EventMap.prototype.unsubscribe = function (target, source) {
	        var _events = source._events;
	        if (_events) {
	            for (var _i = 0, _a = this.handlers; _i < _a.length; _i++) {
	                var event_2 = _a[_i];
	                _off(_events, event_2.name, event_2.callback, target);
	            }
	        }
	    };
	    return EventMap;
	}());
	exports.EventMap = EventMap;
	var EventDescriptor = (function () {
	    function EventDescriptor(name, callback) {
	        this.name = name;
	        if (callback === true) {
	            this.callback = getBubblingHandler(name);
	        }
	        else if (typeof callback === 'string') {
	            this.callback =
	                function localCallback() {
	                    var handler = this[callback];
	                    handler && handler.apply(this, arguments);
	                };
	        }
	        else {
	            this.callback = callback;
	        }
	    }
	    return EventDescriptor;
	}());
	function on(self, name, callback, context) {
	    var _events = self._events || (self._events = {});
	    _on(_events, name, callback, context);
	}
	exports.on = on;
	function off(self, name, callback, context) {
	    var _events = self._events;
	    _events && _off(_events, name, callback, context);
	}
	exports.off = off;
	function trigger0(self, name) {
	    var _events = self._events;
	    if (_events) {
	        var queue = _events[name], all = _events.all;
	        if (queue)
	            _fireEvent0(queue);
	        if (all)
	            _fireEvent1(all, name);
	    }
	}
	exports.trigger0 = trigger0;
	;
	function trigger1(self, name, a) {
	    var _events = self._events;
	    if (_events) {
	        var queue = _events[name], all = _events.all;
	        if (queue)
	            _fireEvent1(queue, a);
	        if (all)
	            _fireEvent2(all, name, a);
	    }
	}
	exports.trigger1 = trigger1;
	;
	function trigger2(self, name, a, b) {
	    var _events = self._events;
	    if (_events) {
	        var queue = _events[name], all = _events.all;
	        if (queue)
	            _fireEvent2(queue, a, b);
	        if (all)
	            _fireEvent3(all, name, a, b);
	    }
	}
	exports.trigger2 = trigger2;
	;
	function trigger3(self, name, a, b, c) {
	    var _events = self._events;
	    if (_events) {
	        var queue = _events[name], all = _events.all;
	        if (queue)
	            _fireEvent3(queue, a, b, c);
	        if (all)
	            _fireEvent4(all, name, a, b, c);
	    }
	}
	exports.trigger3 = trigger3;
	;
	function _fireEvent0(events) {
	    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
	        var ev = events_1[_i];
	        ev.callback.call(ev.ctx);
	    }
	}
	function _fireEvent1(events, a) {
	    for (var _i = 0, events_2 = events; _i < events_2.length; _i++) {
	        var ev = events_2[_i];
	        ev.callback.call(ev.ctx, a);
	    }
	}
	function _fireEvent2(events, a, b) {
	    for (var _i = 0, events_3 = events; _i < events_3.length; _i++) {
	        var ev = events_3[_i];
	        ev.callback.call(ev.ctx, a, b);
	    }
	}
	function _fireEvent3(events, a, b, c) {
	    for (var _i = 0, events_4 = events; _i < events_4.length; _i++) {
	        var ev = events_4[_i];
	        ev.callback.call(ev.ctx, a, b, c);
	    }
	}
	function _fireEvent4(events, a, b, c, d) {
	    for (var _i = 0, events_5 = events; _i < events_5.length; _i++) {
	        var ev = events_5[_i];
	        ev.callback.call(ev.ctx, a, b, c, d);
	    }
	}
	function _on(_events, name, callback, context, ctx) {
	    var events = _events[name], handler = new EventHandler(context, ctx || context, null, callback);
	    if (events) {
	        events.push(handler);
	    }
	    else {
	        _events[name] = [handler];
	    }
	}
	;
	function _off(_events, name, callback, context) {
	    var events = _events[name];
	    if (events) {
	        var retain = [];
	        for (var _i = 0, events_6 = events; _i < events_6.length; _i++) {
	            var ev = events_6[_i];
	            if ((callback && callback !== ev.callback) || context !== ev.context) {
	                retain.push(ev);
	            }
	        }
	        _events[name] = retain.length ? retain : void 0;
	    }
	}
	;
	var _bubblingHandlers = {};
	function getBubblingHandler(event) {
	    return _bubblingHandlers[event] || (_bubblingHandlers[event] = function (a, b, c) {
	        switch (arguments.length) {
	            case 0:
	                trigger0(this, event);
	                break;
	            case 1:
	                trigger1(this, event, a);
	                break;
	            case 2:
	                trigger2(this, event, a, b);
	                break;
	            case 3:
	                trigger3(this, event, a, b, c);
	                break;
	            default:
	                var args = [event, a, b, c];
	                for (var i = 3; i < arguments.length; i++) {
	                    args.push(arguments[i]);
	                }
	                this.trigger.apply(this, args);
	        }
	    });
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	var tools = __webpack_require__(1);
	exports.tools = tools;
	var record_1 = __webpack_require__(7);
	var record_2 = __webpack_require__(7);
	exports.Model = record_2.Record;
	var events_1 = __webpack_require__(4);
	exports.on = events_1.Events.on, exports.off = events_1.Events.off, exports.trigger = events_1.Events.trigger, exports.once = events_1.Events.once, exports.listenTo = events_1.Events.listenTo, exports.stopListening = events_1.Events.stopListening, exports.listenToOnce = events_1.Events.listenToOnce;
	var collection_1 = __webpack_require__(17);
	exports.Collection = collection_1.Collection;
	__export(__webpack_require__(3));
	__export(__webpack_require__(4));
	var mixins_2 = __webpack_require__(3);
	exports.Class = mixins_2.Mixable;
	var relations_1 = __webpack_require__(22);
	exports.Store = relations_1.Store;
	function value(x) {
	    return new record_1.ChainableAttributeSpec({ value: x });
	}
	exports.value = value;
	function transaction(method) {
	    return function () {
	        var _this = this;
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        var result;
	        this.transaction(function () {
	            result = method.apply(_this, args);
	        });
	        return result;
	    };
	}
	exports.transaction = transaction;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var transaction_1 = __webpack_require__(8);
	exports.Record = transaction_1.Record;
	var object_plus_1 = __webpack_require__(1);
	var define_1 = __webpack_require__(12);
	var typespec_1 = __webpack_require__(14);
	exports.ChainableAttributeSpec = typespec_1.ChainableAttributeSpec;
	var nestedTypes_1 = __webpack_require__(15);
	exports.TransactionalType = nestedTypes_1.TransactionalType;
	__webpack_require__(16);
	transaction_1.Record.define = function (protoProps, staticProps) {
	    var BaseConstructor = object_plus_1.getBaseClass(this), baseProto = BaseConstructor.prototype;
	    if (protoProps) {
	        var definition = define_1.compile(getAttributes(protoProps), baseProto._attributes);
	        if (protoProps.properties === false) {
	            definition.properties = {};
	        }
	        object_plus_1.assign(definition.properties, protoProps.properties || {});
	        object_plus_1.defaults(definition, object_plus_1.omit(protoProps, 'attributes', 'collection'));
	        object_plus_1.Mixable.define.call(this, definition, staticProps);
	        defineCollection.call(this, protoProps && protoProps.collection);
	    }
	    return this;
	};
	transaction_1.Record.predefine = function () {
	    object_plus_1.Mixable.predefine.call(this);
	    this.Collection = object_plus_1.getBaseClass(this).Collection.extend();
	    this.Collection.prototype.model = this;
	    return this;
	};
	transaction_1.Record._attribute = nestedTypes_1.TransactionalType;
	function getAttributes(_a) {
	    var defaults = _a.defaults, attributes = _a.attributes, idAttribute = _a.idAttribute;
	    var definition = typeof defaults === 'function' ? defaults() : attributes || defaults || {};
	    if (idAttribute && !(idAttribute in definition)) {
	        definition[idAttribute] = void 0;
	    }
	    return definition;
	}
	function defineCollection(collection) {
	    var BaseCollection = object_plus_1.getBaseClass(this).Collection;
	    var CollectionConstructor;
	    if (typeof collection === 'function') {
	        CollectionConstructor = collection;
	    }
	    else {
	        CollectionConstructor = this.Collection;
	        if (collection)
	            CollectionConstructor.define(collection);
	    }
	    CollectionConstructor.prototype.model = this;
	    this.Collection = CollectionConstructor;
	}


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
	    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	    return c > 3 && r && Object.defineProperty(target, key, r), r;
	};
	var object_plus_1 = __webpack_require__(1);
	var transactions_1 = __webpack_require__(9);
	var trigger3 = transactions_1.Transactional.trigger3;
	var _cidCounter = 0;
	var Record = (function (_super) {
	    __extends(Record, _super);
	    function Record(a_values, a_options, owner) {
	        var _this = this;
	        _super.call(this, _cidCounter++, owner);
	        var options = a_options || {}, values = (options.parse ? this.parse(a_values) : a_values) || {};
	        var attributes = options.clone ? cloneAttributes(this, values) : this.defaults(values);
	        this.forEachAttr(attributes, function (value, key, attr) {
	            var next = attributes[key] = attr.transform(value, options, void 0, _this);
	            attr.handleChange(next, void 0, _this);
	        });
	        this.attributes = this._previousAttributes = attributes;
	        this.initialize(a_values, a_options);
	        if (this._localEvents)
	            this._localEvents.subscribe(this, this);
	    }
	    Record.define = function (protoProps, staticProps) {
	        return transactions_1.Transactional.define(protoProps, staticProps);
	    };
	    Record.defaults = function (attrs) {
	        return this.extend({ attributes: attrs });
	    };
	    Record.prototype.previousAttributes = function () { return new this.Attributes(this._previousAttributes); };
	    Object.defineProperty(Record.prototype, "changed", {
	        get: function () {
	            var changed = this._changedAttributes;
	            if (!changed) {
	                var prev = this._previousAttributes;
	                changed = {};
	                var _a = this, _attributes = _a._attributes, attributes = _a.attributes;
	                for (var _i = 0, _b = this._keys; _i < _b.length; _i++) {
	                    var key = _b[_i];
	                    var value = attributes[key];
	                    if (_attributes[key].isChanged(value, prev[key])) {
	                        changed[key] = value;
	                    }
	                }
	                this._changedAttributes = changed;
	            }
	            return changed;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Record.prototype.changedAttributes = function (diff) {
	        if (!diff)
	            return this.hasChanged() ? object_plus_1.assign({}, this.changed) : false;
	        var val, changed = false, old = this._transaction ? this._previousAttributes : this.attributes, attrSpecs = this._attributes;
	        for (var attr in diff) {
	            if (!attrSpecs[attr].isChanged(old[attr], (val = diff[attr])))
	                continue;
	            (changed || (changed = {}))[attr] = val;
	        }
	        return changed;
	    };
	    Record.prototype.hasChanged = function (key) {
	        var _previousAttributes = this._previousAttributes;
	        if (!_previousAttributes)
	            return false;
	        return key ?
	            this._attributes[key].isChanged(this.attributes[key], _previousAttributes[key]) :
	            !object_plus_1.isEmpty(this.changed);
	    };
	    Record.prototype.previous = function (key) {
	        if (key) {
	            var _previousAttributes = this._previousAttributes;
	            if (_previousAttributes)
	                return _previousAttributes[key];
	        }
	        return null;
	    };
	    Record.prototype.isNew = function () {
	        return this.id === void 0;
	    };
	    Record.prototype.has = function (key) {
	        return this[key] != void 0;
	    };
	    Record.prototype.unset = function (key, options) {
	        this.set(key, void 0, options);
	        return this;
	    };
	    Record.prototype.clear = function (options) {
	        var _this = this;
	        this.transaction(function () {
	            _this.forEachAttr(_this.attributes, function (value, key) { return _this[key] = void 0; });
	        }, options);
	    };
	    Record.prototype.getOwner = function () {
	        var owner = this._owner;
	        return this._ownerKey ? owner : owner && owner._owner;
	    };
	    Object.defineProperty(Record.prototype, "id", {
	        get: function () { return this.attributes[this.idAttribute]; },
	        set: function (x) { setAttribute(this, this.idAttribute, x); },
	        enumerable: true,
	        configurable: true
	    });
	    Record.prototype.Attributes = function (x) { this.id = x.id; };
	    Record.prototype.forEachAttr = function (attrs, iteratee) {
	        var _attributes = this._attributes;
	        for (var name_1 in attrs) {
	            var spec = _attributes[name_1];
	            if (spec) {
	                iteratee(attrs[name_1], name_1, spec);
	            }
	            else {
	                object_plus_1.log.warn('[Unknown Attribute]', this, 'Unknown record attribute "' + name_1 + '" is ignored:', attrs);
	            }
	        }
	    };
	    Record.prototype.each = function (iteratee, context) {
	        var fun = arguments.length === 2 ? function (v, k) { return iteratee.call(context, v, k); } : iteratee, _a = this, attributes = _a.attributes, _keys = _a._keys;
	        for (var _i = 0, _keys_1 = _keys; _i < _keys_1.length; _i++) {
	            var key = _keys_1[_i];
	            var value = attributes[key];
	            if (value !== void 0)
	                fun(value, key);
	        }
	    };
	    Record.prototype._toJSON = function () { return {}; };
	    Record.prototype._parse = function (data) { return data; };
	    Record.prototype.defaults = function (values) { return {}; };
	    Record.prototype.initialize = function (values, options) { };
	    Record.prototype.clone = function (owner) {
	        return new this.constructor(this.attributes, { clone: true }, owner);
	    };
	    Record.prototype._validateNested = function (errors) {
	        var _this = this;
	        var length = 0;
	        this.forEachAttr(this.attributes, function (value, name, attribute) {
	            var error = attribute.validate(_this, value, name);
	            if (error) {
	                errors[name] = error;
	                length++;
	            }
	        });
	        return length;
	    };
	    Record.prototype.get = function (key) {
	        return this[key];
	    };
	    Record.prototype.toJSON = function () {
	        var _this = this;
	        var json = {};
	        this.forEachAttr(this.attributes, function (value, key, _a) {
	            var toJSON = _a.toJSON;
	            if (toJSON && value !== void 0) {
	                json[key] = toJSON.call(_this, value, key);
	            }
	        });
	        return json;
	    };
	    Record.prototype.parse = function (data) {
	        return this._parse(data);
	    };
	    Record.prototype.set = function (a, b, c) {
	        if (typeof a === 'string') {
	            if (c) {
	                return _super.prototype.set.call(this, (_a = {}, _a[a] = b, _a), c);
	            }
	            else {
	                setAttribute(this, a, b);
	                return this;
	            }
	        }
	        else {
	            return _super.prototype.set.call(this, a, b);
	        }
	        var _a;
	    };
	    Record.prototype.transaction = function (fun, options) {
	        if (options === void 0) { options = {}; }
	        var isRoot = begin(this);
	        fun.call(this, this);
	        isRoot && transactions_1.commit(this);
	    };
	    Record.prototype._createTransaction = function (a_values, options) {
	        var _this = this;
	        if (options === void 0) { options = {}; }
	        var isRoot = begin(this), changes = [], nested = [], attributes = this.attributes, values = options.parse ? this.parse(a_values) : a_values, merge = !options.reset;
	        if (Object.getPrototypeOf(values) === Object.prototype) {
	            this.forEachAttr(values, function (value, key, attr) {
	                var prev = attributes[key];
	                if (merge && attr.canBeUpdated(prev, value)) {
	                    var nestedTransaction = prev._createTransaction(value, options);
	                    if (nestedTransaction) {
	                        nested.push(nestedTransaction);
	                        changes.push(key);
	                    }
	                    return;
	                }
	                var next = attr.transform(value, options, prev, _this);
	                attributes[key] = next;
	                if (attr.isChanged(next, prev)) {
	                    changes.push(key);
	                    attr.handleChange(next, prev, _this);
	                }
	            });
	        }
	        else {
	            object_plus_1.log.error('[Type Error]', this, 'Record update rejected (', values, '). Incompatible type.');
	        }
	        if ((nested.length || changes.length) && markAsDirty(this, options)) {
	            return new RecordTransaction(this, isRoot, nested, changes);
	        }
	        isRoot && transactions_1.commit(this);
	    };
	    Record.prototype._onChildrenChange = function (child, options) {
	        this.forceAttributeChange(child._ownerKey, options);
	    };
	    Record.prototype.forceAttributeChange = function (key, options) {
	        if (options === void 0) { options = {}; }
	        var isRoot = begin(this);
	        if (markAsDirty(this, options)) {
	            trigger3(this, 'change:' + key, this, this.attributes[key], options);
	        }
	        isRoot && transactions_1.commit(this);
	    };
	    Object.defineProperty(Record.prototype, "collection", {
	        get: function () {
	            return this._ownerKey ? null : this._owner;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Record.prototype.dispose = function () {
	        var _this = this;
	        this.forEachAttr(this.attributes, function (value, key) {
	            if (value && _this === value._owner) {
	                value.dispose();
	            }
	        });
	        _super.prototype.dispose.call(this);
	    };
	    Record = __decorate([
	        object_plus_1.define({
	            cidPrefix: 'm',
	            idAttribute: 'id',
	            _keys: ['id']
	        })
	    ], Record);
	    return Record;
	}(transactions_1.Transactional));
	exports.Record = Record;
	;
	function begin(record) {
	    if (transactions_1.begin(record)) {
	        record._previousAttributes = new record.Attributes(record.attributes);
	        record._changedAttributes = null;
	        return true;
	    }
	    return false;
	}
	function markAsDirty(record, options) {
	    if (record._changedAttributes) {
	        record._changedAttributes = null;
	    }
	    return transactions_1.markAsDirty(record, options);
	}
	function cloneAttributes(record, a_attributes) {
	    var attributes = new record.Attributes(a_attributes);
	    record.forEachAttr(attributes, function (value, name, attr) {
	        attributes[name] = attr.clone(value);
	    });
	    return attributes;
	}
	function setAttribute(record, name, value) {
	    var isRoot = begin(record), options = {}, attributes = record.attributes, spec = record._attributes[name], prev = attributes[name];
	    if (spec.canBeUpdated(prev, value)) {
	        var nestedTransaction = prev._createTransaction(value, options);
	        if (nestedTransaction) {
	            nestedTransaction.commit(true);
	            markAsDirty(record, options);
	            trigger3(record, 'change:' + name, record, prev, options);
	        }
	    }
	    else {
	        var next = spec.transform(value, options, prev, record);
	        attributes[name] = next;
	        if (spec.isChanged(next, prev)) {
	            spec.handleChange(next, prev, record);
	            markAsDirty(record, options);
	            trigger3(record, 'change:' + name, record, next, options);
	        }
	    }
	    isRoot && transactions_1.commit(record);
	}
	exports.setAttribute = setAttribute;
	var RecordTransaction = (function () {
	    function RecordTransaction(object, isRoot, nested, changes) {
	        this.object = object;
	        this.isRoot = isRoot;
	        this.nested = nested;
	        this.changes = changes;
	    }
	    RecordTransaction.prototype.commit = function (isNested) {
	        var _a = this, nested = _a.nested, object = _a.object, changes = _a.changes;
	        for (var _i = 0, nested_1 = nested; _i < nested_1.length; _i++) {
	            var transaction = nested_1[_i];
	            transaction.commit(true);
	        }
	        var attributes = object.attributes, _isDirty = object._isDirty;
	        for (var _b = 0, changes_1 = changes; _b < changes_1.length; _b++) {
	            var key = changes_1[_b];
	            trigger3(object, 'change:' + key, object, attributes[key], _isDirty);
	        }
	        this.isRoot && transactions_1.commit(object, isNested);
	    };
	    return RecordTransaction;
	}());


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
	    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	    return c > 3 && r && Object.defineProperty(target, key, r), r;
	};
	var object_plus_1 = __webpack_require__(1);
	var validation_1 = __webpack_require__(10);
	var traversable_1 = __webpack_require__(11);
	var trigger2 = object_plus_1.Messenger.trigger2, trigger3 = object_plus_1.Messenger.trigger3;
	var Transactional = (function (_super) {
	    __extends(Transactional, _super);
	    function Transactional(cid, owner, ownerKey) {
	        _super.call(this, cid);
	        this._changeToken = {};
	        this._transaction = false;
	        this._isDirty = null;
	        this._validationError = void 0;
	        this._owner = owner;
	        this._ownerKey = ownerKey;
	    }
	    Transactional.prototype.transaction = function (fun, options) {
	        if (options === void 0) { options = {}; }
	        var isRoot = begin(this);
	        fun.call(this, this);
	        isRoot && commit(this);
	    };
	    Transactional.prototype.updateEach = function (iteratee, options) {
	        var isRoot = begin(this);
	        this.each(iteratee);
	        isRoot && commit(this);
	    };
	    Transactional.prototype.set = function (values, options) {
	        if (values) {
	            var transaction = this._createTransaction(values, options);
	            transaction && transaction.commit();
	        }
	        return this;
	    };
	    Transactional.prototype.parse = function (data) { return data; };
	    Transactional.prototype.deepGet = function (reference) {
	        return traversable_1.resolveReference(this, reference, function (object, key) { return object.get(key); });
	    };
	    Transactional.prototype.getOwner = function () {
	        return this._owner;
	    };
	    Transactional.prototype.getStore = function () {
	        var _owner = this._owner;
	        return _owner ? _owner.getStore() : this._defaultStore;
	    };
	    Transactional.prototype.map = function (iteratee, context) {
	        var arr = [], fun = arguments.length === 2 ? function (v, k) { return iteratee.call(context, v, k); } : iteratee;
	        this.each(function (val, key) {
	            var result = fun(val, key);
	            if (result !== void 0)
	                arr.push(result);
	        });
	        return arr;
	    };
	    Transactional.prototype.mapObject = function (iteratee, context) {
	        var obj = {}, fun = arguments.length === 2 ? function (v, k) { return iteratee.call(context, v, k); } : iteratee;
	        this.each(function (val, key) {
	            var result = iteratee(val, key);
	            if (result !== void 0)
	                obj[key] = result;
	        });
	        return obj;
	    };
	    Transactional.prototype.keys = function () {
	        return this.map(function (value, key) {
	            if (value !== void 0)
	                return key;
	        });
	    };
	    Transactional.prototype.values = function () {
	        return this.map(function (value) { return value; });
	    };
	    Object.defineProperty(Transactional.prototype, "validationError", {
	        get: function () {
	            var error = this._validationError || (this._validationError = new validation_1.ValidationError(this));
	            return error.length ? error : null;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Transactional.prototype._invalidate = function (options) {
	        var error;
	        if (options.validate && (error = this.validationError)) {
	            this.trigger('invalid', this, error, object_plus_1.assign({ validationError: error }, options));
	            return true;
	        }
	    };
	    Transactional.prototype.validate = function (obj) { };
	    Transactional.prototype.getValidationError = function (key) {
	        var error = this.validationError;
	        return (key ? error && error.nested[key] : error) || null;
	    };
	    Transactional.prototype.deepValidationError = function (reference) {
	        return traversable_1.resolveReference(this, reference, function (object, key) { return object.getValidationError(key); });
	    };
	    Transactional.prototype.eachValidationError = function (iteratee) {
	        var validationError = this.validationError;
	        validationError && validationError.eachError(iteratee, this);
	    };
	    Transactional.prototype.isValid = function (key) {
	        return !this.getValidationError(key);
	    };
	    Transactional = __decorate([
	        object_plus_1.define({
	            _changeEventName: 'change'
	        })
	    ], Transactional);
	    return Transactional;
	}(object_plus_1.Messenger));
	exports.Transactional = Transactional;
	function begin(object) {
	    return object._transaction ? false : (object._transaction = true);
	}
	exports.begin = begin;
	function markAsDirty(object, options) {
	    var dirty = !options.silent;
	    if (dirty)
	        object._isDirty = options;
	    object._changeToken = {};
	    object._validationError = void 0;
	    return dirty;
	}
	exports.markAsDirty = markAsDirty;
	function commit(object, isNested) {
	    var originalOptions = object._isDirty;
	    if (originalOptions) {
	        while (object._isDirty) {
	            var options = object._isDirty;
	            object._isDirty = null;
	            trigger2(object, object._changeEventName, object, options);
	        }
	        object._transaction = false;
	        var _owner = object._owner;
	        if (_owner && !isNested) {
	            _owner._onChildrenChange(object, originalOptions);
	        }
	    }
	    else {
	        object._isDirty = null;
	        object._transaction = false;
	    }
	}
	exports.commit = commit;
	function aquire(owner, child, key) {
	    if (!child._owner) {
	        child._owner = owner;
	        child._ownerKey = key;
	        return true;
	    }
	    return false;
	}
	exports.aquire = aquire;
	function free(owner, child) {
	    if (owner === child._owner) {
	        child._owner = void 0;
	        child._ownerKey = void 0;
	    }
	}
	exports.free = free;


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	var ValidationError = (function () {
	    function ValidationError(obj) {
	        this.length = obj._validateNested(this.nested = {});
	        if (this.error = obj.validate(obj)) {
	            this.length++;
	        }
	    }
	    ValidationError.prototype.each = function (iteratee) {
	        var _a = this, error = _a.error, nested = _a.nested;
	        if (error)
	            iteratee(error, null);
	        for (var key in nested) {
	            iteratee(nested[key], key);
	        }
	    };
	    ValidationError.prototype.eachError = function (iteratee, object) {
	        this.each(function (value, key) {
	            if (value instanceof ValidationError) {
	                value._traverse(iteratee, object.get(key));
	            }
	            else {
	                iteratee(value, key, object);
	            }
	        });
	    };
	    return ValidationError;
	}());
	exports.ValidationError = ValidationError;


/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	var referenceMask = /\~|\^|([^.]+)/g;
	var CompiledReference = (function () {
	    function CompiledReference(reference, splitTail) {
	        if (splitTail === void 0) { splitTail = false; }
	        var path = reference
	            .match(referenceMask)
	            .map(function (key) { return key === '~' ? 'getStore()' : (key === '^' ? 'getOwner()' : key); });
	        this.tail = splitTail && path.pop();
	        this.local = !path.length;
	        path.unshift('self');
	        this.resolve = new Function('self', "return " + path.join('.') + ";");
	    }
	    return CompiledReference;
	}());
	exports.CompiledReference = CompiledReference;
	function resolveReference(root, reference, action) {
	    var path = reference.match(referenceMask), skip = path.length - 1;
	    var self = root;
	    for (var i = 0; i < skip; i++) {
	        var key = path[i];
	        switch (key) {
	            case '~':
	                self = self.getStore();
	                break;
	            case '^':
	                self = self.getOwner();
	                break;
	            default: self = self.get(key);
	        }
	        if (!self)
	            return;
	    }
	    action(self, path[skip]);
	    return self;
	}
	exports.resolveReference = resolveReference;
	function referenceToObject(reference, value) {
	    var path = reference.split('.'), root = {}, last = path.length - 1;
	    var current = root;
	    for (var i = 0; i < last; i++) {
	        current = current[path[i]] = {};
	    }
	    current[path[last]] = value;
	    return root;
	}
	exports.referenceToObject = referenceToObject;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var attribute_1 = __webpack_require__(13);
	var object_plus_1 = __webpack_require__(1);
	var typespec_1 = __webpack_require__(14);
	var traversable_1 = __webpack_require__(11);
	function compile(rawSpecs, baseAttributes) {
	    var myAttributes = object_plus_1.transform({}, rawSpecs, createAttribute), allAttributes = object_plus_1.defaults({}, myAttributes, baseAttributes), Attributes = createCloneCtor(allAttributes), mixin = {
	        Attributes: Attributes,
	        _attributes: new Attributes(allAttributes),
	        properties: object_plus_1.transform({}, myAttributes, function (x) { return x.createPropertyDescriptor(); }),
	        defaults: createDefaults(allAttributes),
	        _toJSON: createToJSON(allAttributes),
	        _localEvents: createEventMap(myAttributes),
	        _keys: Object.keys(allAttributes)
	    };
	    var _parse = createParse(myAttributes, allAttributes);
	    if (_parse) {
	        mixin._parse = _parse;
	    }
	    if (!object_plus_1.log.level) {
	        mixin.forEachAttr = createForEach(allAttributes);
	    }
	    return mixin;
	}
	exports.compile = compile;
	function createAttribute(spec, name) {
	    return attribute_1.GenericAttribute.create(typespec_1.toAttributeDescriptor(spec), name);
	}
	function createEventMap(attrSpecs) {
	    var events;
	    for (var key in attrSpecs) {
	        var attribute = attrSpecs[key], _onChange = attribute.options._onChange;
	        if (_onChange) {
	            events || (events = new object_plus_1.EventMap());
	            events.addEvent('change:' + key, typeof _onChange === 'string' ?
	                createWatcherFromRef(_onChange, key) :
	                wrapWatcher(_onChange, key));
	        }
	    }
	    return events;
	}
	function wrapWatcher(watcher, key) {
	    return function (record, value) {
	        watcher.call(record, value, key);
	    };
	}
	function createWatcherFromRef(ref, key) {
	    var _a = new traversable_1.CompiledReference(ref, true), local = _a.local, resolve = _a.resolve, tail = _a.tail;
	    return local ?
	        function (record, value) {
	            record[tail](value, key);
	        } :
	        function (record, value) {
	            resolve(record)[tail](value, key);
	        };
	}
	function createForEach(attrSpecs) {
	    var statements = ['var v, _a=this._attributes;'];
	    for (var name_1 in attrSpecs) {
	        statements.push("( v = a." + name_1 + " ) === void 0 || f( v, \"" + name_1 + "\", _a." + name_1 + " );");
	    }
	    return new Function('a', 'f', statements.join(''));
	}
	exports.createForEach = createForEach;
	function createCloneCtor(attrSpecs) {
	    var statements = [];
	    for (var name_2 in attrSpecs) {
	        statements.push("this." + name_2 + " = x." + name_2 + ";");
	    }
	    var CloneCtor = new Function("x", statements.join(''));
	    CloneCtor.prototype = Object.prototype;
	    return CloneCtor;
	}
	exports.createCloneCtor = createCloneCtor;
	function createDefaults(attrSpecs) {
	    var assign_f = ['var v;'], create_f = [];
	    function appendExpr(name, expr) {
	        assign_f.push("this." + name + " = ( v = a." + name + " ) === void 0 ? " + expr + " : v;");
	        create_f.push("this." + name + " = " + expr + ";");
	    }
	    for (var name_3 in attrSpecs) {
	        var attrSpec = attrSpecs[name_3], value = attrSpec.value, type = attrSpec.type;
	        if (value === void 0 && type) {
	            appendExpr(name_3, "i." + name_3 + ".create()");
	        }
	        else {
	            if (object_plus_1.isValidJSON(value)) {
	                appendExpr(name_3, JSON.stringify(value));
	            }
	            else if (value === void 0) {
	                appendExpr(name_3, 'void 0');
	            }
	            else {
	                appendExpr(name_3, "i." + name_3 + ".value");
	            }
	        }
	    }
	    var CreateDefaults = new Function('i', create_f.join('')), AssignDefaults = new Function('a', 'i', assign_f.join(''));
	    CreateDefaults.prototype = AssignDefaults.prototype = Object.prototype;
	    return function (attrs) {
	        return attrs ? new AssignDefaults(attrs, this._attributes) : new CreateDefaults(this._attributes);
	    };
	}
	function createParse(allAttrSpecs, attrSpecs) {
	    var statements = ['var a=this._attributes;'], create = false;
	    for (var name_4 in allAttrSpecs) {
	        var local = attrSpecs[name_4];
	        if (local && local.parse)
	            create = true;
	        if (allAttrSpecs[name_4].parse) {
	            var s = "r." + name_4 + " === void 0 ||( r." + name_4 + " = a." + name_4 + ".parse.call( this, r." + name_4 + ", \"" + name_4 + "\") );";
	            statements.push(s);
	        }
	    }
	    if (create) {
	        statements.push('return r;');
	        return new Function('r', statements.join(''));
	    }
	}
	function createToJSON(attrSpecs) {
	    var statements = ["var json = {},v=this.attributes,a=this._attributes;"];
	    for (var key in attrSpecs) {
	        var toJSON = attrSpecs[key].toJSON;
	        if (toJSON) {
	            statements.push("json." + key + " = a." + key + ".toJSON.call( this, v." + key + ", '" + key + "' );");
	        }
	    }
	    statements.push("return json;");
	    return new Function(statements.join(''));
	}


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var transaction_1 = __webpack_require__(8);
	var object_plus_1 = __webpack_require__(1);
	var GenericAttribute = (function () {
	    function GenericAttribute(name, options) {
	        this.name = name;
	        this.options = options;
	        this.getHook = null;
	        var value = options.value, type = options.type, parse = options.parse, toJSON = options.toJSON, _a = options.getHooks, getHooks = _a === void 0 ? [] : _a, _b = options.transforms, transforms = _b === void 0 ? [] : _b, _c = options.changeHandlers, changeHandlers = _c === void 0 ? [] : _c, validate = options.validate;
	        this.value = value;
	        this.type = type;
	        this.parse = parse;
	        this.toJSON = toJSON === void 0 ? this.toJSON : toJSON;
	        this.validate = validate || this.validate;
	        transforms.unshift(this.convert);
	        if (this.get)
	            getHooks.unshift(this.get);
	        this.initialize.call(this, options);
	        if (getHooks.length) {
	            this.getHook = getHooks.reduce(chainGetHooks);
	        }
	        if (transforms.length) {
	            this.transform = transforms.reduce(chainTransforms);
	        }
	        if (changeHandlers.length) {
	            this.handleChange = changeHandlers.reduce(chainChangeHandlers);
	        }
	    }
	    GenericAttribute.create = function (options, name) {
	        var type = options.type, AttributeCtor = options._attribute || (type ? type._attribute : GenericAttribute);
	        return new AttributeCtor(name, options);
	    };
	    GenericAttribute.prototype.canBeUpdated = function (prev, next) {
	        return false;
	    };
	    GenericAttribute.prototype.transform = function (value, options, prev, model) { return value; };
	    GenericAttribute.prototype.convert = function (value, options, model) { return value; };
	    GenericAttribute.prototype.isChanged = function (a, b) {
	        return object_plus_1.notEqual(a, b);
	    };
	    GenericAttribute.prototype.handleChange = function (next, prev, model) { };
	    GenericAttribute.prototype.create = function () { return new this.type(); };
	    GenericAttribute.prototype.clone = function (value, options) {
	        if (options === void 0) { options = {}; }
	        if (value && typeof value === 'object') {
	            if (value.clone) {
	                return value.clone(options);
	            }
	            if (options.deep) {
	                var proto = Object.getPrototypeOf(value);
	                if (proto === Object.prototype || proto === Array.prototype) {
	                    return JSON.parse(JSON.stringify(value));
	                }
	            }
	        }
	        return value;
	    };
	    GenericAttribute.prototype.validate = function (record, value, key) { };
	    GenericAttribute.prototype.toJSON = function (value, key) {
	        return value && value.toJSON ? value.toJSON() : value;
	    };
	    GenericAttribute.prototype.createPropertyDescriptor = function () {
	        var _a = this, name = _a.name, getHook = _a.getHook;
	        if (name !== 'id') {
	            return {
	                set: function (value) {
	                    transaction_1.setAttribute(this, name, value);
	                },
	                get: getHook ?
	                    function () {
	                        return getHook.call(this, this.attributes[name], name);
	                    } :
	                    function () {
	                        return this.attributes[name];
	                    }
	            };
	        }
	    };
	    GenericAttribute.prototype.initialize = function (name, options) { };
	    return GenericAttribute;
	}());
	exports.GenericAttribute = GenericAttribute;
	transaction_1.Record.prototype._attributes = { id: GenericAttribute.create({ value: void 0 }, 'id') };
	transaction_1.Record.prototype.defaults = function (attrs) {
	    if (attrs === void 0) { attrs = {}; }
	    return { id: attrs.id };
	};
	function chainChangeHandlers(prevHandler, nextHandler) {
	    return function (next, prev, model) {
	        prevHandler.call(this, next, prev, model);
	        nextHandler.call(this, next, prev, model);
	    };
	}
	function chainGetHooks(prevHook, nextHook) {
	    return function (value, name) {
	        return nextHook.call(prevHook.call(value, name), name);
	    };
	}
	function chainTransforms(prevTransform, nextTransform) {
	    return function (value, options, prev, model) {
	        return nextTransform.call(this, prevTransform.call(this, value, options, prev, model), options, prev, model);
	    };
	}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var transactions_1 = __webpack_require__(9);
	var object_plus_1 = __webpack_require__(1);
	var ChainableAttributeSpec = (function () {
	    function ChainableAttributeSpec(options) {
	        if (options === void 0) { options = {}; }
	        this.options = { getHooks: [], transforms: [], changeHandlers: [] };
	        object_plus_1.assign(this.options, options);
	    }
	    ChainableAttributeSpec.prototype.check = function (check, error) {
	        function validate(model, value, name) {
	            if (!check.call(model, value, name)) {
	                return error || check.error || name + ' is not valid';
	            }
	        }
	        var prev = this.options.validate;
	        this.options.validate = prev ? (function (model, value, name) {
	            return prev(model, value, name) || validate(model, value, name);
	        }) : validate;
	        return this;
	    };
	    ChainableAttributeSpec.prototype.triggerWhenChanged = function (events) {
	        return this;
	    };
	    ChainableAttributeSpec.prototype.watcher = function (ref) {
	        this.options._onChange = ref;
	        return this;
	    };
	    ChainableAttributeSpec.prototype.parse = function (fun) {
	        this.options.parse = fun;
	        return this;
	    };
	    ChainableAttributeSpec.prototype.toJSON = function (fun) {
	        this.options.toJSON = fun;
	        return this;
	    };
	    ChainableAttributeSpec.prototype.get = function (fun) {
	        this.options.getHooks.push(fun);
	        return this;
	    };
	    ChainableAttributeSpec.prototype.set = function (fun) {
	        this.options.transforms.push(function (next, options, prev, model) {
	            if (this.isChanged(next, prev)) {
	                var changed = fun.call(model, next, name);
	                return changed === void 0 ? prev : changed;
	            }
	            return prev;
	        });
	        return this;
	    };
	    ChainableAttributeSpec.prototype.events = function (map) {
	        var eventMap = new object_plus_1.EventMap(map);
	        this.options.changeHandlers.push(function (next, prev, record) {
	            prev && eventMap.unsubscribe(record, prev);
	            next && eventMap.subscribe(record, next);
	        });
	        return this;
	    };
	    Object.defineProperty(ChainableAttributeSpec.prototype, "has", {
	        get: function () { return this; },
	        enumerable: true,
	        configurable: true
	    });
	    ChainableAttributeSpec.prototype.value = function (x) {
	        this.options.value = x;
	        return this;
	    };
	    return ChainableAttributeSpec;
	}());
	exports.ChainableAttributeSpec = ChainableAttributeSpec;
	Function.prototype.value = function (x) {
	    return new ChainableAttributeSpec({ type: this, value: x });
	};
	Object.defineProperty(Function.prototype, 'has', {
	    get: function () {
	        return this._has || new ChainableAttributeSpec({ type: this });
	    },
	    set: function (value) { this._has = value; }
	});
	function toAttributeDescriptor(spec) {
	    var attrSpec;
	    if (typeof spec === 'function') {
	        attrSpec = new ChainableAttributeSpec({ type: spec });
	    }
	    else if (spec && spec instanceof ChainableAttributeSpec) {
	        attrSpec = spec;
	    }
	    else {
	        var type = inferType(spec);
	        if (type && type.prototype instanceof transactions_1.Transactional) {
	            attrSpec = type.shared.value(spec);
	        }
	        else {
	            attrSpec = new ChainableAttributeSpec({ type: type, value: spec });
	        }
	    }
	    return attrSpec.options;
	}
	exports.toAttributeDescriptor = toAttributeDescriptor;
	function inferType(value) {
	    switch (typeof value) {
	        case 'number':
	            return Number;
	        case 'string':
	            return String;
	        case 'boolean':
	            return Boolean;
	        case 'undefined':
	            return void 0;
	        case 'object':
	            return value ? value.constructor : Object;
	    }
	}


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var transaction_1 = __webpack_require__(8);
	var attribute_1 = __webpack_require__(13);
	var transactions_1 = __webpack_require__(9);
	var object_plus_1 = __webpack_require__(1);
	var TransactionalType = (function (_super) {
	    __extends(TransactionalType, _super);
	    function TransactionalType() {
	        _super.apply(this, arguments);
	    }
	    TransactionalType.prototype.canBeUpdated = function (prev, next) {
	        return prev && next && !(next instanceof this.type);
	    };
	    TransactionalType.prototype.convert = function (value, options, record) {
	        return value == null || value instanceof this.type ? value : this.type.create(value, options, record);
	    };
	    TransactionalType.prototype.validate = function (record, value) {
	        var error = value && value.validationError;
	        if (error)
	            return error;
	    };
	    TransactionalType.prototype.create = function () {
	        return new this.type();
	    };
	    TransactionalType.prototype.initialize = function (options) {
	        options.changeHandlers.unshift(this._handleChange);
	    };
	    TransactionalType.prototype._handleChange = function (next, prev, record) {
	        prev && transactions_1.free(record, prev);
	        if (next && !transactions_1.aquire(record, next, this.name)) {
	            object_plus_1.log.error('[Aggregation error] Assigned value already has an owner. Use shared attribute type.');
	        }
	    };
	    return TransactionalType;
	}(attribute_1.GenericAttribute));
	exports.TransactionalType = TransactionalType;
	transaction_1.Record._attribute = TransactionalType;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var attribute_1 = __webpack_require__(13);
	var object_plus_1 = __webpack_require__(1);
	var ConstructorType = (function (_super) {
	    __extends(ConstructorType, _super);
	    function ConstructorType() {
	        _super.apply(this, arguments);
	    }
	    ConstructorType.prototype.convert = function (value) {
	        return value == null || value instanceof this.type ? value : new this.type(value);
	    };
	    ConstructorType.prototype.clone = function (value, options) {
	        return value.clone ? value.clone(value, options) : this.convert(JSON.parse(JSON.stringify(value)));
	    };
	    return ConstructorType;
	}(attribute_1.GenericAttribute));
	Function.prototype._attribute = ConstructorType;
	var DateProto = Date.prototype;
	var DateType = (function (_super) {
	    __extends(DateType, _super);
	    function DateType() {
	        _super.apply(this, arguments);
	    }
	    DateType.prototype.convert = function (value) {
	        return typeof value === 'string' ? new Date(object_plus_1.parseDate(value)) : (value == null || value instanceof Date ? value : new Date(value));
	    };
	    DateType.prototype.validate = function (model, value, name) {
	        if (isNaN(+value))
	            return name + ' is Invalid Date';
	    };
	    DateType.prototype.toJSON = function (value) { return value && value.toJSON(); };
	    DateType.prototype.isChanged = function (a, b) { return (a && +a) !== (b && +b); };
	    DateType.prototype.clone = function (value) { return value && new Date(+value); };
	    return DateType;
	}(attribute_1.GenericAttribute));
	Date._attribute = DateType;
	var PrimitiveType = (function (_super) {
	    __extends(PrimitiveType, _super);
	    function PrimitiveType() {
	        _super.apply(this, arguments);
	    }
	    PrimitiveType.prototype.create = function () { return this.type(); };
	    PrimitiveType.prototype.toJSON = function (value) { return value; };
	    PrimitiveType.prototype.convert = function (value) { return value == null ? value : this.type(value); };
	    PrimitiveType.prototype.isChanged = function (a, b) { return a !== b; };
	    PrimitiveType.prototype.clone = function (value) { return value; };
	    return PrimitiveType;
	}(attribute_1.GenericAttribute));
	exports.PrimitiveType = PrimitiveType;
	Boolean._attribute = String._attribute = PrimitiveType;
	var NumericType = (function (_super) {
	    __extends(NumericType, _super);
	    function NumericType() {
	        _super.apply(this, arguments);
	    }
	    NumericType.prototype.validate = function (model, value, name) {
	        if (!isFinite(value)) {
	            return name + ' is not valid number';
	        }
	    };
	    return NumericType;
	}(PrimitiveType));
	exports.NumericType = NumericType;
	Number._attribute = NumericType;
	if (window) {
	    window.Integer = function (x) { return x ? Math.round(x) : 0; };
	    window.Integer._attribute = NumericType;
	}
	var ArrayType = (function (_super) {
	    __extends(ArrayType, _super);
	    function ArrayType() {
	        _super.apply(this, arguments);
	    }
	    ArrayType.prototype.toJSON = function (value) { return value; };
	    ArrayType.prototype.convert = function (value) {
	        if (value == null || Array.isArray(value))
	            return value;
	        return [];
	    };
	    return ArrayType;
	}(attribute_1.GenericAttribute));
	exports.ArrayType = ArrayType;
	Array._attribute = ArrayType;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
	    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	    return c > 3 && r && Object.defineProperty(target, key, r), r;
	};
	var object_plus_1 = __webpack_require__(1);
	var transactions_1 = __webpack_require__(9);
	var record_1 = __webpack_require__(7);
	var commons_1 = __webpack_require__(18);
	var add_1 = __webpack_require__(19);
	var set_1 = __webpack_require__(20);
	var remove_1 = __webpack_require__(21);
	var trigger2 = transactions_1.Transactional.trigger2;
	var _count = 0;
	var silentOptions = { silent: true };
	var Collection = (function (_super) {
	    __extends(Collection, _super);
	    function Collection(records, options) {
	        if (options === void 0) { options = {}; }
	        _super.call(this, _count++);
	        this.models = [];
	        this._byId = {};
	        this.model = options.model || this.model;
	        this.idAttribute = this.model.prototype.idAttribute;
	        if (options.comparator !== void 0) {
	            this.comparator = options.comparator;
	        }
	        if (records) {
	            var elements = toElements(this, records, options);
	            set_1.emptySetTransaction(this, elements, options, true);
	        }
	        this.initialize.apply(this, arguments);
	        if (this._localEvents)
	            this._localEvents.subscribe(this, this);
	    }
	    Collection.prototype.createSubset = function (models, options) {
	        var SubsetOf = this.constructor.subsetOf(this).options.type;
	        var subset = new SubsetOf(models, options);
	        subset.resolve(this);
	        return subset;
	    };
	    Collection.predefine = function () {
	        this._SubsetOf = null;
	        transactions_1.Transactional.predefine();
	        return this;
	    };
	    Collection.define = function (protoProps, staticProps) {
	        var spec = object_plus_1.omit(protoProps, 'elementsEvents', 'localEvents');
	        if (protoProps.elementsEvents) {
	            var eventsMap = new object_plus_1.EventMap(this.prototype._elementsEvents);
	            eventsMap.addEventsMap(protoProps.elementsEvents);
	            spec._elementsEvents = eventsMap;
	        }
	        return transactions_1.Transactional.define.call(this, spec, staticProps);
	    };
	    Object.defineProperty(Collection.prototype, "comparator", {
	        get: function () { return this._comparator; },
	        set: function (x) {
	            var _this = this;
	            var compare;
	            switch (typeof x) {
	                case 'string':
	                    this._comparator = function (a, b) {
	                        var aa = a[x], bb = b[x];
	                        if (aa === bb)
	                            return 0;
	                        return aa < bb ? -1 : +1;
	                    };
	                    break;
	                case 'function':
	                    if (x.length === 1) {
	                        this._comparator = function (a, b) {
	                            var aa = x.call(_this, a), bb = x.call(_this, b);
	                            if (aa === bb)
	                                return 0;
	                            return aa < bb ? -1 : +1;
	                        };
	                    }
	                    else {
	                        this._comparator = function (a, b) { return x.call(_this, a, b); };
	                    }
	                    break;
	                default:
	                    this._comparator = null;
	            }
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Collection.prototype.getStore = function () {
	        return this._store || (this._store = this._owner ? this._owner.getStore() : this._defaultStore);
	    };
	    Collection.prototype._onChildrenChange = function (record, options) {
	        if (options === void 0) { options = {}; }
	        var isRoot = transactions_1.begin(this), idAttribute = this.idAttribute;
	        if (record.hasChanged(idAttribute)) {
	            var _byId = this._byId;
	            delete _byId[record.previous(idAttribute)];
	            var id = record.id;
	            id == null || (_byId[id] = record);
	        }
	        if (transactions_1.markAsDirty(this, options)) {
	            trigger2(this, 'change', record, options);
	        }
	        isRoot && transactions_1.commit(this);
	    };
	    Collection.prototype.get = function (objOrId) {
	        if (objOrId == null)
	            return;
	        if (typeof objOrId === 'object') {
	            var id = objOrId[this.idAttribute];
	            return (id !== void 0 && this._byId[id]) || this._byId[objOrId.cid];
	        }
	        else {
	            return this._byId[objOrId];
	        }
	    };
	    Collection.prototype.each = function (iteratee, context) {
	        var fun = arguments.length === 2 ? function (v, k) { return iteratee.call(context, v, k); } : iteratee, models = this.models;
	        for (var i = 0; i < models.length; i++) {
	            fun(models[i], i);
	        }
	    };
	    Collection.prototype._validateNested = function (errors) {
	        var count = 0;
	        this.each(function (record) {
	            var error = record.validationError;
	            if (error) {
	                errors[record.cid] = error;
	                count++;
	            }
	        });
	        return count;
	    };
	    Collection.prototype.initialize = function () { };
	    Object.defineProperty(Collection.prototype, "length", {
	        get: function () { return this.models.length; },
	        enumerable: true,
	        configurable: true
	    });
	    Collection.prototype.first = function () { return this.models[0]; };
	    Collection.prototype.last = function () { return this.models[this.models.length - 1]; };
	    Collection.prototype.at = function (a_index) {
	        var index = a_index < 0 ? a_index + this.models.length : a_index;
	        return this.models[index];
	    };
	    Collection.prototype.clone = function (owner) {
	        var models = this.map(function (model) { return model.clone(); });
	        return new this.constructor(models, { model: this.model, comparator: this.comparator }, owner);
	    };
	    Collection.prototype.toJSON = function () {
	        return this.models.map(function (model) { return model.toJSON(); });
	    };
	    Collection.prototype.set = function (elements, options) {
	        if (elements === void 0) { elements = []; }
	        if (options === void 0) { options = {}; }
	        if (options.add !== void 0) {
	            object_plus_1.log.error("Collection.set doesn't support 'add' option, behaving as if options.add === true.");
	        }
	        if (options.reset) {
	            this.reset(elements, options);
	        }
	        else {
	            var transaction = this._createTransaction(elements, options);
	            transaction && transaction.commit();
	        }
	        return this;
	    };
	    Collection.prototype.reset = function (a_elements, options) {
	        if (options === void 0) { options = {}; }
	        var previousModels = commons_1.dispose(this);
	        if (a_elements) {
	            set_1.emptySetTransaction(this, toElements(this, a_elements, options), options, true);
	        }
	        options.silent || trigger2(this, 'reset', this, object_plus_1.defaults({ previousModels: previousModels }, options));
	        return this.models;
	    };
	    Collection.prototype.add = function (a_elements, options) {
	        if (options === void 0) { options = {}; }
	        var elements = toElements(this, a_elements, options), transaction = this.models.length ?
	            add_1.addTransaction(this, elements, options) :
	            set_1.emptySetTransaction(this, elements, options);
	        if (transaction) {
	            transaction.commit();
	            return transaction.added;
	        }
	    };
	    Collection.prototype.remove = function (recordsOrIds, options) {
	        if (options === void 0) { options = {}; }
	        if (recordsOrIds) {
	            return Array.isArray(recordsOrIds) ?
	                remove_1.removeMany(this, recordsOrIds, options) :
	                remove_1.removeOne(this, recordsOrIds, options);
	        }
	        return [];
	    };
	    Collection.prototype._createTransaction = function (a_elements, options) {
	        if (options === void 0) { options = {}; }
	        var elements = toElements(this, a_elements, options);
	        if (this.models.length) {
	            return options.remove === false ?
	                add_1.addTransaction(this, elements, options) :
	                set_1.setTransaction(this, elements, options);
	        }
	        else {
	            return set_1.emptySetTransaction(this, elements, options);
	        }
	    };
	    Collection.prototype.pluck = function (key) {
	        return this.models.map(function (model) { return model[key]; });
	    };
	    Collection.prototype.sort = function (options) {
	        if (options === void 0) { options = {}; }
	        if (commons_1.sortElements(this, options)) {
	            var isRoot = transactions_1.begin(this);
	            if (transactions_1.markAsDirty(this, options)) {
	                trigger2(this, 'sort', this, options);
	            }
	            isRoot && transactions_1.commit(this);
	        }
	        return this;
	    };
	    Collection.prototype.push = function (model, options) {
	        return this.add(model, object_plus_1.assign({ at: this.length }, options));
	    };
	    Collection.prototype.pop = function (options) {
	        var model = this.at(this.length - 1);
	        this.remove(model, options);
	        return model;
	    };
	    Collection.prototype.unshift = function (model, options) {
	        return this.add(model, object_plus_1.assign({ at: 0 }, options));
	    };
	    Collection.prototype.shift = function (options) {
	        var model = this.at(0);
	        this.remove(model, options);
	        return model;
	    };
	    Collection.prototype.slice = function () {
	        return slice.apply(this.models, arguments);
	    };
	    Collection.prototype.indexOf = function (modelOrId) {
	        var record = this.get(modelOrId);
	        return this.models.indexOf(record);
	    };
	    Collection.prototype.modelId = function (attrs) {
	        return attrs[this.model.prototype.idAttribute];
	    };
	    Collection.prototype.toggle = function (model, a_next) {
	        var prev = Boolean(this.get(model)), next = a_next === void 0 ? !prev : Boolean(a_next);
	        if (prev !== next) {
	            if (prev) {
	                this.remove(model);
	            }
	            else {
	                this.add(model);
	            }
	        }
	        return next;
	    };
	    Collection._attribute = record_1.TransactionalType;
	    Collection = __decorate([
	        object_plus_1.define({
	            cidPrefix: 'c',
	            model: record_1.Record,
	            _changeEventName: 'changes'
	        })
	    ], Collection);
	    return Collection;
	}(transactions_1.Transactional));
	exports.Collection = Collection;
	function toElements(collection, elements, options) {
	    var parsed = options.parse ? collection.parse(elements) : elements;
	    return Array.isArray(parsed) ? parsed : [parsed];
	}
	var slice = Array.prototype.slice;
	record_1.Record.Collection = Collection;


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var transactions_1 = __webpack_require__(9);
	var trigger2 = transactions_1.Transactional.trigger2, trigger3 = transactions_1.Transactional.trigger3;
	function dispose(collection) {
	    var models = collection.models;
	    collection.models = [];
	    collection._byId = {};
	    freeAll(collection, models);
	    return models;
	}
	exports.dispose = dispose;
	function aquire(owner, child) {
	    transactions_1.aquire(owner, child);
	    var _elementsEvents = owner._elementsEvents;
	    _elementsEvents && _elementsEvents.subscribe(owner, child);
	}
	exports.aquire = aquire;
	function free(owner, child) {
	    transactions_1.free(owner, child);
	    var _elementsEvents = owner._elementsEvents;
	    _elementsEvents && _elementsEvents.unsubscribe(owner, child);
	}
	exports.free = free;
	function freeAll(collection, children) {
	    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
	        var child = children_1[_i];
	        free(collection, child);
	    }
	    return children;
	}
	exports.freeAll = freeAll;
	function sortElements(collection, options) {
	    var _comparator = collection._comparator;
	    if (_comparator && options.sort !== false) {
	        collection.models.sort(_comparator);
	        return true;
	    }
	    return false;
	}
	exports.sortElements = sortElements;
	function addIndex(index, model) {
	    index[model.cid] = model;
	    var id = model.id;
	    if (id != null) {
	        index[id] = model;
	    }
	}
	exports.addIndex = addIndex;
	function removeIndex(index, model) {
	    delete index[model.cid];
	    var id = model.id;
	    if (id != null) {
	        delete index[id];
	    }
	}
	exports.removeIndex = removeIndex;
	function toModel(collection, attrs, options) {
	    var model = collection.model;
	    return attrs instanceof model ? attrs : model.create(attrs, options, collection);
	}
	exports.toModel = toModel;
	function convertAndAquire(collection, attrs, options) {
	    var model = collection.model, record = attrs instanceof model ? attrs : model.create(attrs, options, collection);
	    aquire(collection, record);
	    return record;
	}
	exports.convertAndAquire = convertAndAquire;
	var CollectionTransaction = (function () {
	    function CollectionTransaction(object, isRoot, added, removed, nested, sorted) {
	        this.object = object;
	        this.isRoot = isRoot;
	        this.added = added;
	        this.removed = removed;
	        this.nested = nested;
	        this.sorted = sorted;
	    }
	    CollectionTransaction.prototype.commit = function (isNested) {
	        var _a = this, nested = _a.nested, object = _a.object, _isDirty = object._isDirty;
	        for (var _i = 0, nested_1 = nested; _i < nested_1.length; _i++) {
	            var transaction = nested_1[_i];
	            transaction.commit(true);
	        }
	        for (var _b = 0, nested_2 = nested; _b < nested_2.length; _b++) {
	            var transaction = nested_2[_b];
	            trigger2(object, 'change', transaction.object, _isDirty);
	        }
	        var _c = this, added = _c.added, removed = _c.removed;
	        for (var _d = 0, added_1 = added; _d < added_1.length; _d++) {
	            var record = added_1[_d];
	            trigger3(record, 'add', record, object, _isDirty);
	            trigger3(object, 'add', record, object, _isDirty);
	        }
	        for (var _e = 0, removed_1 = removed; _e < removed_1.length; _e++) {
	            var record = removed_1[_e];
	            trigger3(record, 'remove', record, object, _isDirty);
	            trigger3(object, 'remove', record, object, _isDirty);
	        }
	        if (this.sorted) {
	            trigger2(object, 'sort', object, _isDirty);
	        }
	        if (added.length || removed.length) {
	            trigger2(object, 'update', object, _isDirty);
	        }
	        this.isRoot && transactions_1.commit(object, isNested);
	    };
	    return CollectionTransaction;
	}());
	exports.CollectionTransaction = CollectionTransaction;


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var transactions_1 = __webpack_require__(9);
	var commons_1 = __webpack_require__(18);
	function addTransaction(collection, items, options) {
	    var isRoot = transactions_1.begin(collection), nested = [];
	    var added = appendElements(collection, items, nested, options);
	    if (added.length || nested.length) {
	        var needSort = sortOrMoveElements(collection, added, options);
	        if (transactions_1.markAsDirty(collection, options)) {
	            return new commons_1.CollectionTransaction(collection, isRoot, added, [], nested, needSort);
	        }
	    }
	    isRoot && transactions_1.commit(collection);
	}
	exports.addTransaction = addTransaction;
	;
	function sortOrMoveElements(collection, added, options) {
	    var at = options.at;
	    if (at != null) {
	        var length_1 = collection.models.length - added.length;
	        at = Number(at);
	        if (at < 0)
	            at += length_1 + 1;
	        if (at < 0)
	            at = 0;
	        if (at > length_1)
	            at = length_1;
	        moveElements(collection.models, at, added);
	        return false;
	    }
	    return commons_1.sortElements(collection, options);
	}
	function moveElements(source, at, added) {
	    for (var j = source.length - 1, i = j - added.length; i >= at; i--, j--) {
	        source[j] = source[i];
	    }
	    for (i = 0, j = at; i < added.length; i++, j++) {
	        source[j] = added[i];
	    }
	}
	function appendElements(collection, a_items, nested, a_options) {
	    var models = collection.models, _byId = collection._byId, merge = a_options.merge, parse = a_options.parse, idAttribute = collection.model.prototype.idAttribute, prevLength = models.length;
	    for (var _i = 0, a_items_1 = a_items; _i < a_items_1.length; _i++) {
	        var item = a_items_1[_i];
	        var model = item ? _byId[item[idAttribute]] || _byId[item.cid] : null;
	        if (model) {
	            if (merge && item !== model) {
	                var attrs = item.attributes || item;
	                var transaction = model._createTransaction(attrs, a_options);
	                transaction && nested.push(transaction);
	            }
	        }
	        else {
	            model = commons_1.toModel(collection, item, a_options);
	            models.push(model);
	            commons_1.aquire(collection, model);
	            commons_1.addIndex(_byId, model);
	        }
	    }
	    return models.slice(prevLength);
	}


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var transactions_1 = __webpack_require__(9);
	var commons_1 = __webpack_require__(18);
	var silentOptions = { silent: true };
	function emptySetTransaction(collection, items, options, silent) {
	    var isRoot = transactions_1.begin(collection);
	    var added = _reallocateEmpty(collection, items, options);
	    if (added.length) {
	        var needSort = commons_1.sortElements(collection, options);
	        if (transactions_1.markAsDirty(collection, silent ? silentOptions : options)) {
	            return new commons_1.CollectionTransaction(collection, isRoot, added.slice(), [], [], needSort);
	        }
	    }
	    isRoot && transactions_1.commit(collection);
	}
	exports.emptySetTransaction = emptySetTransaction;
	;
	function setTransaction(collection, items, options) {
	    var isRoot = transactions_1.begin(collection), nested = [];
	    var previous = collection.models, added = _reallocate(collection, items, nested, options);
	    var reusedCount = collection.models.length - added.length, removed = reusedCount < previous.length ? (reusedCount ? _garbageCollect(collection, previous) :
	        commons_1.freeAll(collection, previous)) : [];
	    var addedOrChanged = nested.length || added.length, sorted = (addedOrChanged && commons_1.sortElements(collection, options)) || added.length || options.sorted;
	    if (addedOrChanged || removed.length || sorted) {
	        if (transactions_1.markAsDirty(collection, options)) {
	            return new commons_1.CollectionTransaction(collection, isRoot, added, removed, nested, sorted);
	        }
	    }
	    isRoot && transactions_1.commit(collection);
	}
	exports.setTransaction = setTransaction;
	;
	function _garbageCollect(collection, previous) {
	    var _byId = collection._byId, removed = [];
	    for (var _i = 0, previous_1 = previous; _i < previous_1.length; _i++) {
	        var record = previous_1[_i];
	        if (!_byId[record.cid]) {
	            removed.push(record);
	            commons_1.free(collection, record);
	        }
	    }
	    return removed;
	}
	function _reallocate(collection, source, nested, options) {
	    var models = Array(source.length), _byId = {}, merge = options.merge == null ? true : options.merge, _prevById = collection._byId, prevModels = collection.models, idAttribute = collection.model.prototype.idAttribute, toAdd = [], orderKept = true;
	    for (var i = 0, j = 0; i < source.length; i++) {
	        var item = source[i], model = null;
	        if (item) {
	            var id = item[idAttribute], cid = item.cid;
	            if (_byId[id] || _byId[cid])
	                continue;
	            model = _prevById[id] || _prevById[cid];
	        }
	        if (model) {
	            if (merge && item !== model) {
	                if (orderKept && prevModels[j] !== model)
	                    orderKept = false;
	                var attrs = item.attributes || item;
	                var transaction = model._createTransaction(attrs, options);
	                transaction && nested.push(transaction);
	            }
	        }
	        else {
	            model = commons_1.toModel(collection, item, options);
	            commons_1.aquire(collection, model);
	            toAdd.push(model);
	        }
	        models[j++] = model;
	        commons_1.addIndex(_byId, model);
	    }
	    models.length = j;
	    collection.models = models;
	    collection._byId = _byId;
	    if (!orderKept)
	        options.sorted = true;
	    return toAdd;
	}
	function _reallocateEmpty(self, source, options) {
	    var len = source ? source.length : 0, models = Array(len), _byId = {}, idAttribute = self.model.prototype.idAttribute;
	    for (var i = 0, j = 0; i < len; i++) {
	        var src = source[i];
	        if (src && (_byId[src[idAttribute]] || _byId[src.cid])) {
	            continue;
	        }
	        var model = commons_1.toModel(self, src, options);
	        commons_1.aquire(self, model);
	        models[j++] = model;
	        commons_1.addIndex(_byId, model);
	    }
	    models.length = j;
	    self._byId = _byId;
	    return self.models = models;
	}


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var commons_1 = __webpack_require__(18);
	var object_plus_1 = __webpack_require__(1);
	var transactions_1 = __webpack_require__(9);
	var trigger2 = object_plus_1.Messenger.trigger2, trigger3 = object_plus_1.Messenger.trigger3;
	function removeOne(collection, el, options) {
	    var model = collection.get(el);
	    if (model) {
	        var isRoot = transactions_1.begin(collection), models = collection.models;
	        models.splice(models.indexOf(model), 1);
	        commons_1.removeIndex(collection._byId, model);
	        var notify = transactions_1.markAsDirty(collection, options);
	        if (notify) {
	            trigger3(model, 'remove', model, collection, options);
	            trigger3(collection, 'remove', model, collection, options);
	        }
	        commons_1.free(collection, model);
	        notify && trigger2(collection, 'update', collection, options);
	        isRoot && transactions_1.commit(collection);
	        return model;
	    }
	}
	exports.removeOne = removeOne;
	;
	function removeMany(collection, toRemove, options) {
	    var removed = _removeFromIndex(collection, toRemove);
	    if (removed.length) {
	        var isRoot = transactions_1.begin(collection);
	        _reallocate(collection, removed.length);
	        if (transactions_1.markAsDirty(collection, options)) {
	            var transaction = new commons_1.CollectionTransaction(collection, isRoot, [], removed, [], false);
	            transaction.commit();
	        }
	        else {
	            isRoot && transactions_1.commit(collection);
	        }
	    }
	    return removed;
	}
	exports.removeMany = removeMany;
	;
	function _removeFromIndex(collection, toRemove) {
	    var removed = Array(toRemove.length), _byId = collection._byId;
	    for (var i = 0, j = 0; i < toRemove.length; i++) {
	        var model = collection.get(toRemove[i]);
	        if (model) {
	            removed[j++] = model;
	            commons_1.removeIndex(_byId, model);
	            commons_1.free(collection, model);
	        }
	    }
	    removed.length = j;
	    return removed;
	}
	function _reallocate(collection, removed) {
	    var prev = collection.models, models = collection.models = Array(prev.length - removed), _byId = collection._byId;
	    for (var i = 0, j = 0; i < prev.length; i++) {
	        var model = prev[i];
	        if (_byId[model.cid]) {
	            models[j++] = model;
	        }
	    }
	    models.length = j;
	}


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	__webpack_require__(23);
	__webpack_require__(25);
	__webpack_require__(26);
	var store_1 = __webpack_require__(27);
	exports.Store = store_1.Store;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var attribute_1 = __webpack_require__(13);
	var commons_1 = __webpack_require__(24);
	var record_1 = __webpack_require__(7);
	var typespec_1 = __webpack_require__(14);
	var RecordRefAttribute = (function (_super) {
	    __extends(RecordRefAttribute, _super);
	    function RecordRefAttribute() {
	        _super.apply(this, arguments);
	    }
	    RecordRefAttribute.prototype.toJSON = function (value) {
	        return value && typeof value === 'object' ? value.id : value;
	    };
	    RecordRefAttribute.prototype.clone = function (value) {
	        return value && typeof value === 'object' ? value.id : value;
	    };
	    RecordRefAttribute.prototype.isChanged = function (a, b) {
	        var aId = a && (a.id == null ? a : a.id), bId = b && (b.id == null ? b : b.id);
	        return aId !== bId;
	    };
	    RecordRefAttribute.prototype.validate = function (model, value, name) { };
	    return RecordRefAttribute;
	}(attribute_1.GenericAttribute));
	record_1.Record.from = function from(masterCollection) {
	    var getMasterCollection = commons_1.parseReference(masterCollection);
	    var typeSpec = new typespec_1.ChainableAttributeSpec({
	        value: null,
	        _attribute: RecordRefAttribute
	    });
	    typeSpec
	        .get(function (objOrId, name) {
	        if (typeof objOrId === 'object')
	            return objOrId;
	        var collection = getMasterCollection(this);
	        var record = null;
	        if (collection && collection.length) {
	            record = collection.get(objOrId) || null;
	            this.attributes[name] = record;
	            record && this._attributes[name].handleChange(record, null, this);
	        }
	        return record;
	    });
	    return typeSpec;
	};


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var traversable_1 = __webpack_require__(11);
	function parseReference(collectionRef) {
	    switch (typeof collectionRef) {
	        case 'function':
	            return function (root) { return collectionRef.call(root); };
	        case 'object':
	            return function () { return collectionRef; };
	        case 'string':
	            var resolve = (new traversable_1.CompiledReference(collectionRef)).resolve;
	            return resolve;
	    }
	}
	exports.parseReference = parseReference;


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var collection_1 = __webpack_require__(17);
	var object_plus_1 = __webpack_require__(1);
	var commons_1 = __webpack_require__(24);
	var record_1 = __webpack_require__(7);
	collection_1.Collection.subsetOf = function subsetOf(masterCollection) {
	    var CollectionConstructor = this, SubsetOf = this._SubsetOf || ((function (_super) {
	        __extends(SubsetOfCollection, _super);
	        function SubsetOfCollection(recordsOrIds, options) {
	            _super.call(this, recordsOrIds, subsetOptions(options));
	            this.resolvedWith = null;
	        }
	        SubsetOfCollection.prototype.add = function (elements, options) {
	            return _super.prototype.add.call(this, elements, subsetOptions(options));
	        };
	        SubsetOfCollection.prototype.reset = function (elements, options) {
	            return _super.prototype.add.call(this, elements, subsetOptions(options));
	        };
	        SubsetOfCollection.prototype._createTransaction = function (elements, options) {
	            return _super.prototype._createTransaction.call(this, elements, subsetOptions(options));
	        };
	        SubsetOfCollection.prototype.toJSON = function () {
	            return this.refs ?
	                this.refs.map(function (objOrId) { return objOrId.id || objOrId; }) :
	                this.models.map(function (model) { return model.id; });
	        };
	        SubsetOfCollection.prototype.clone = function (owner) {
	            var copy = new this.constructor(this.models, { model: this.model, comparator: this.comparator }, owner);
	            copy.resolvedWith = this.resolvedWith;
	            copy.refs = this.refs;
	            return copy;
	        };
	        SubsetOfCollection.prototype.parse = function (raw) {
	            var resolvedWith = this.resolvedWith, elements = Array.isArray(raw) ? raw : [raw], records = [];
	            if (resolvedWith) {
	                for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
	                    var element = elements_1[_i];
	                    var record = resolvedWith.get(element);
	                    if (record)
	                        records.push(record);
	                }
	            }
	            else {
	                this.refs = raw;
	            }
	            return records;
	        };
	        SubsetOfCollection.prototype.resolve = function (collection) {
	            if (collection && collection.length) {
	                this.resolvedWith = collection;
	                if (this.refs) {
	                    this.reset(this.refs, { silent: true });
	                    this.refs = null;
	                }
	            }
	            return this;
	        };
	        SubsetOfCollection.prototype.getModelIds = function () { return this.toJSON(); };
	        SubsetOfCollection.prototype.toggle = function (modelOrId, val) {
	            return _super.prototype.toggle.call(this, this.resolvedWith.get(modelOrId), val);
	        };
	        SubsetOfCollection.prototype.addAll = function () {
	            return this.reset(this.resolvedWith.models);
	        };
	        SubsetOfCollection.prototype.toggleAll = function () {
	            return this.length ? this.reset() : this.addAll();
	        };
	        return SubsetOfCollection;
	    }(CollectionConstructor)));
	    var getMasterCollection = commons_1.parseReference(masterCollection);
	    var typeSpec = new record_1.ChainableAttributeSpec({
	        type: SubsetOf,
	        validate: function (model, value, name) { },
	    });
	    typeSpec.get(function (refs) {
	        !refs || refs.resolvedWith || refs.resolve(getMasterCollection(this));
	        return refs;
	    });
	    return typeSpec;
	};
	function subsetOptions(options) {
	    var subsetOptions = { parse: true, merge: false };
	    if (options)
	        object_plus_1.fastDefaults(subsetOptions, options);
	    return subsetOptions;
	}


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var record_1 = __webpack_require__(7);
	var collection_1 = __webpack_require__(17);
	var attribute_1 = __webpack_require__(13);
	var transactions_1 = __webpack_require__(9);
	var object_plus_1 = __webpack_require__(1);
	var SharedType = (function (_super) {
	    __extends(SharedType, _super);
	    function SharedType() {
	        _super.apply(this, arguments);
	    }
	    SharedType.prototype.canBeUpdated = function (prev, next) {
	        return false;
	    };
	    SharedType.prototype.convert = function (value, options, record) {
	        if (value == null || value instanceof this.type)
	            return value;
	        object_plus_1.log.error("[Shared Attribute] Cannot assign value of incompatible type.", value, record);
	        return null;
	    };
	    SharedType.prototype.validate = function (record, value) {
	        var error = value && value.validationError;
	        if (error)
	            return error;
	    };
	    SharedType.prototype.create = function () {
	        return null;
	    };
	    SharedType.prototype._handleChange = function (next, prev, record) {
	        prev && transactions_1.Transactional.off(prev, prev._changeEventName, record._onChildrenChange, record);
	        next && transactions_1.Transactional.on(next, next._changeEventName, record._onChildrenChange, record);
	    };
	    SharedType.prototype.initialize = function (options) {
	        this.toJSON = null;
	        options.changeHandlers.unshift(this._handleChange);
	    };
	    return SharedType;
	}(attribute_1.GenericAttribute));
	exports.SharedType = SharedType;
	var createSharedTypeSpec = {
	    get: function () {
	        return new record_1.ChainableAttributeSpec({
	            value: null,
	            type: this,
	            _attribute: SharedType
	        });
	    }
	};
	Object.defineProperty(record_1.Record, 'shared', createSharedTypeSpec);
	Object.defineProperty(collection_1.Collection, 'shared', createSharedTypeSpec);


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var record_1 = __webpack_require__(7);
	var transactions_1 = __webpack_require__(9);
	var _store = null;
	var Store = (function (_super) {
	    __extends(Store, _super);
	    function Store() {
	        _super.apply(this, arguments);
	    }
	    Store.prototype.getStore = function () { return this; };
	    Store.prototype.get = function (name) {
	        var local = this[name];
	        if (local || this === _store)
	            return local;
	        return this._owner ? this._owner.get(name) : _store[name];
	    };
	    Object.defineProperty(Store, "global", {
	        get: function () { return _store; },
	        set: function (store) {
	            if (_store) {
	                _store.dispose();
	            }
	            transactions_1.Transactional.prototype._defaultStore = _store = store;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return Store;
	}(record_1.Record));
	exports.Store = Store;
	Store.global = new Store();


/***/ },
/* 28 */
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
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(29), __webpack_require__(30), exports], __WEBPACK_AMD_DEFINE_RESULT__ = function(_, $, exports) {
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
/* 29 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_29__;

/***/ },
/* 30 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_30__;

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
	    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	    return c > 3 && r && Object.defineProperty(target, key, r), r;
	};
	var sync_1 = __webpack_require__(32);
	var _ = __webpack_require__(29);
	var BackboneShim = __webpack_require__(28);
	var Backbone = BackboneShim;
	var src_1 = __webpack_require__(6);
	var defaults = src_1.tools.defaults;
	var RestCollection = (function (_super) {
	    __extends(RestCollection, _super);
	    function RestCollection() {
	        _super.apply(this, arguments);
	    }
	    RestCollection.prototype.fetch = function (options) {
	        options = _.extend({ parse: true }, options);
	        var success = options.success;
	        var collection = this;
	        options.success = function (resp) {
	            var method = options.reset ? 'reset' : 'set';
	            collection[method](resp, options);
	            if (collection._invalidate(options))
	                return false;
	            if (success)
	                success.call(options.context, collection, resp, options);
	            collection.trigger('sync', collection, resp, options);
	        };
	        wrapError(this, options);
	        return _sync('read', this, options);
	    };
	    RestCollection.prototype.sync = function () {
	        return sync_1.sync.apply(this, arguments);
	    };
	    RestCollection = __decorate([
	        src_1.define({
	            url: '',
	            itemEvents: {
	                destroy: function (model) { this.remove(model); }
	            }
	        })
	    ], RestCollection);
	    return RestCollection;
	}(src_1.Collection));
	exports.RestCollection = RestCollection;
	;
	var RestModel = (function (_super) {
	    __extends(RestModel, _super);
	    function RestModel() {
	        _super.apply(this, arguments);
	    }
	    RestModel.prototype.fetch = function (options) {
	        options = _.extend({ parse: true }, options);
	        var model = this;
	        var success = options.success;
	        options.success = function (serverAttrs) {
	            model.set(serverAttrs, options);
	            if (model._invalidate(options))
	                return false;
	            if (success)
	                success.call(options.context, model, serverAttrs, options);
	            model.trigger('sync', model, serverAttrs, options);
	        };
	        wrapError(this, options);
	        return _sync('read', this, options);
	    };
	    RestModel.prototype.sync = function () {
	        return sync_1.sync.apply(this, arguments);
	    };
	    RestModel.prototype.save = function (key, val, options) {
	        var attrs;
	        if (key == null || typeof key === 'object') {
	            attrs = key;
	            options = val;
	        }
	        else {
	            (attrs = {})[key] = val;
	        }
	        options = _.extend({ validate: true, parse: true }, options);
	        var wait = options.wait;
	        if (attrs && !wait) {
	            this.set(attrs, options);
	        }
	        if (this._invalidate(options)) {
	            if (attrs && wait)
	                this.set(attrs, options);
	            return sync_1.errorPromise(this.validationError);
	        }
	        var model = this;
	        var success = options.success;
	        var attributes = this.attributes;
	        options.success = function (serverAttrs) {
	            model.attributes = attributes;
	            if (wait)
	                serverAttrs = _.extend({}, attrs, serverAttrs);
	            if (serverAttrs) {
	                model.set(serverAttrs, options);
	                if (model._invalidate(options))
	                    return false;
	            }
	            if (success)
	                success.call(options.context, model, serverAttrs, options);
	            model.trigger('sync', model, serverAttrs, options);
	        };
	        wrapError(this, options);
	        if (attrs && wait)
	            this.attributes = _.extend({}, attributes, attrs);
	        var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
	        if (method === 'patch' && !options.attrs)
	            options.attrs = attrs;
	        var xhr = _sync(method, this, options);
	        this.attributes = attributes;
	        return xhr;
	    };
	    RestModel.prototype.destroy = function (options) {
	        options = options ? _.clone(options) : {};
	        var model = this;
	        var success = options.success;
	        var wait = options.wait;
	        var destroy = function () {
	            model.stopListening();
	            model.trigger('destroy', model, model.collection, options);
	        };
	        options.success = function (resp) {
	            if (wait)
	                destroy();
	            if (success)
	                success.call(options.context, model, resp, options);
	            if (!model.isNew())
	                model.trigger('sync', model, resp, options);
	        };
	        var xhr = false;
	        if (this.isNew()) {
	            _.defer(options.success);
	        }
	        else {
	            wrapError(this, options);
	            xhr = _sync('delete', this, options);
	        }
	        if (!wait)
	            destroy();
	        return xhr;
	    };
	    RestModel.prototype.url = function () {
	        var base = _.result(this, 'urlRoot') ||
	            _.result(this.collection, 'url') ||
	            sync_1.urlError();
	        if (this.isNew())
	            return base;
	        var id = this.get(this.idAttribute);
	        return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
	    };
	    RestModel = __decorate([
	        src_1.define({
	            collection: RestCollection,
	            urlRoot: ''
	        })
	    ], RestModel);
	    return RestModel;
	}(src_1.Model));
	exports.RestModel = RestModel;
	function _sync(method, _this, options) {
	    _this._xhr && _this._xhr.abort();
	    return _this._xhr = _this.sync(method, _this, options)
	        .always(function () { _this.xhr = void 0; });
	}
	function wrapError(model, options) {
	    var error = options.error;
	    options.error = function (resp) {
	        if (error)
	            error.call(options.context, model, resp, options);
	        model.trigger('error', model, resp, options);
	    };
	}


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var _ = __webpack_require__(29);
	var BackboneShim = __webpack_require__(28);
	var Backbone = BackboneShim;
	var src_1 = __webpack_require__(6);
	var defaults = src_1.tools.defaults;
	var methodMap = {
	    'create': 'POST',
	    'update': 'PUT',
	    'patch': 'PATCH',
	    'delete': 'DELETE',
	    'read': 'GET'
	};
	exports.$ = null;
	exports.errorPromise = function (error) {
	    var x = this.$.Deferred();
	    x.reject(error);
	    return x;
	};
	exports.ajax = function () {
	    return this.$.ajax.apply(this.$, arguments);
	};
	exports.sync = function (method, model, options) {
	    if (options === void 0) { options = {}; }
	    var type = methodMap[method];
	    defaults(options, {
	        emulateHTTP: Backbone.emulateHTTP,
	        emulateJSON: Backbone.emulateJSON
	    });
	    var params = { type: type, dataType: 'json' };
	    if (!options.url) {
	        params.url = _.result(model, 'url') || urlError();
	    }
	    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
	        params.contentType = 'application/json';
	        params.data = JSON.stringify(options.attrs || model.toJSON(options));
	    }
	    if (options.emulateJSON) {
	        params.contentType = 'application/x-www-form-urlencoded';
	        params.data = params.data ? { model: params.data } : {};
	    }
	    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
	        params.type = 'POST';
	        if (options.emulateJSON)
	            params.data._method = type;
	        var beforeSend = options.beforeSend;
	        options.beforeSend = function (xhr) {
	            xhr.setRequestHeader('X-HTTP-Method-Override', type);
	            if (beforeSend)
	                return beforeSend.apply(this, arguments);
	        };
	    }
	    if (params.type !== 'GET' && !options.emulateJSON) {
	        params.processData = false;
	    }
	    var error = options.error;
	    options.error = function (xhr, textStatus, errorThrown) {
	        options.textStatus = textStatus;
	        options.errorThrown = errorThrown;
	        if (error)
	            error.call(options.context, xhr, textStatus, errorThrown);
	    };
	    var xhr = options.xhr = this.ajax(_.extend(params, options));
	    model.trigger('request', model, xhr, options);
	    return xhr;
	};
	function urlError() {
	    throw new Error('A "url" property or function must be specified');
	}
	exports.urlError = urlError;


/***/ }
/******/ ])
});
;
//# sourceMappingURL=nestedtypes.js.map