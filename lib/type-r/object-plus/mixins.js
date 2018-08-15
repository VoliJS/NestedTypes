import * as tslib_1 from "tslib";
import { assign, hashMap, getBaseClass, defaults, transform } from './tools';
import { __extends } from 'tslib';
var Mixable = (function () {
    function Mixable() {
    }
    Mixable.define = function (protoProps, staticProps) {
        if (protoProps === void 0) { protoProps = {}; }
        var BaseClass = getBaseClass(this);
        staticProps && assign(this, staticProps);
        var mixins = protoProps.mixins, defineMixin = tslib_1.__rest(protoProps, ["mixins"]);
        mixins && this.mixins.merge(mixins);
        this.mixins.mergeObject(this.prototype, defineMixin, true);
        this.mixins.mergeObject(this.prototype, this.mixins.getStaticDefinitions(BaseClass), true);
        this.onDefine && this.onDefine(this.mixins.definitions, BaseClass);
        this.mixins.mergeInheritedMembers(BaseClass);
        return this;
    };
    Mixable.extend = function (spec, statics) {
        var TheSubclass;
        if (spec && spec.hasOwnProperty('constructor')) {
            TheSubclass = spec.constructor;
            __extends(TheSubclass, this);
        }
        else {
            TheSubclass = (function (_super) {
                tslib_1.__extends(Subclass, _super);
                function Subclass() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return Subclass;
            }(this));
        }
        predefine(TheSubclass);
        spec && TheSubclass.define(spec, statics);
        return TheSubclass;
    };
    return Mixable;
}());
export { Mixable };
export function predefine(Constructor) {
    var BaseClass = getBaseClass(Constructor);
    Constructor.__super__ = BaseClass.prototype;
    Constructor.define || MixinsState.get(Mixable).populate(Constructor);
    MixinsState.get(Constructor);
    Constructor.onExtend && Constructor.onExtend(BaseClass);
}
export function define(ClassOrDefinition) {
    if (typeof ClassOrDefinition === 'function') {
        predefine(ClassOrDefinition);
        ClassOrDefinition.define();
    }
    else {
        return function (Ctor) {
            predefine(Ctor);
            Ctor.define(ClassOrDefinition);
        };
    }
}
export function definitions(rules) {
    return function (Class) {
        var mixins = MixinsState.get(Class);
        mixins.definitionRules = defaults(hashMap(), rules, mixins.definitionRules);
    };
}
export function propertyListDecorator(listName) {
    return function propList(proto, name) {
        var list = proto.hasOwnProperty(listName) ?
            proto[listName] : (proto[listName] = (proto[listName] || []).slice());
        list.push(name);
    };
}
export function definitionDecorator(definitionKey, value) {
    return function (proto, name) {
        var _a, _b;
        MixinsState
            .get(proto.constructor)
            .mergeObject(proto, (_a = {},
            _a[definitionKey] = (_b = {},
                _b[name] = value,
                _b),
            _a));
    };
}
var MixinsState = (function () {
    function MixinsState(Class) {
        this.Class = Class;
        this.definitions = {};
        var mixins = getBaseClass(Class).mixins;
        this.mergeRules = (mixins && mixins.mergeRules) || hashMap();
        this.definitionRules = (mixins && mixins.definitionRules) || hashMap();
        this.appliedMixins = (mixins && mixins.appliedMixins) || [];
    }
    MixinsState.get = function (Class) {
        var mixins = Class.mixins;
        return mixins && Class === mixins.Class ? mixins :
            Class.mixins = new MixinsState(Class);
    };
    MixinsState.prototype.getStaticDefinitions = function (BaseClass) {
        var definitions = hashMap(), Class = this.Class;
        return transform(definitions, this.definitionRules, function (rule, name) {
            if (BaseClass[name] !== Class[name]) {
                return Class[name];
            }
        });
    };
    MixinsState.prototype.merge = function (mixins) {
        var proto = this.Class.prototype, mergeRules = this.mergeRules;
        var appliedMixins = this.appliedMixins = this.appliedMixins.slice();
        for (var _i = 0, mixins_1 = mixins; _i < mixins_1.length; _i++) {
            var mixin = mixins_1[_i];
            if (Array.isArray(mixin)) {
                this.merge(mixin);
            }
            else if (appliedMixins.indexOf(mixin) < 0) {
                appliedMixins.push(mixin);
                if (typeof mixin === 'function') {
                    this.mergeObject(this.Class, mixin);
                    var sourceMixins = mixin.mixins;
                    if (sourceMixins) {
                        this.mergeRules = defaults(hashMap(), this.mergeRules, sourceMixins.mergeRules);
                        this.definitionRules = defaults(hashMap(), this.definitionRules, sourceMixins.definitionRules);
                        this.appliedMixins = this.appliedMixins.concat(sourceMixins.appliedMixins);
                    }
                    this.mergeObject(proto, mixin.prototype);
                }
                else {
                    this.mergeObject(proto, mixin);
                }
            }
        }
    };
    MixinsState.prototype.populate = function () {
        var ctors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            ctors[_i] = arguments[_i];
        }
        for (var _a = 0, ctors_1 = ctors; _a < ctors_1.length; _a++) {
            var Ctor = ctors_1[_a];
            MixinsState.get(Ctor).merge([this.Class]);
        }
    };
    MixinsState.prototype.mergeObject = function (dest, source, unshift) {
        var _this = this;
        forEachOwnProp(source, function (name) {
            var sourceProp = Object.getOwnPropertyDescriptor(source, name);
            var rule;
            if (rule = _this.definitionRules[name]) {
                assignProperty(_this.definitions, name, sourceProp, rule, unshift);
            }
            if (!rule || rule === mixinRules.protoValue) {
                assignProperty(dest, name, sourceProp, _this.mergeRules[name], unshift);
            }
        });
    };
    MixinsState.prototype.mergeInheritedMembers = function (BaseClass) {
        var _a = this, mergeRules = _a.mergeRules, Class = _a.Class;
        if (mergeRules) {
            var proto = Class.prototype, baseProto = BaseClass.prototype;
            for (var name_1 in mergeRules) {
                var rule = mergeRules[name_1];
                if (proto.hasOwnProperty(name_1) && name_1 in baseProto) {
                    proto[name_1] = resolveRule(proto[name_1], baseProto[name_1], rule);
                }
            }
        }
    };
    return MixinsState;
}());
export { MixinsState };
var dontMix = {
    function: hashMap({
        length: true,
        prototype: true,
        caller: true,
        arguments: true,
        name: true,
        __super__: true
    }),
    object: hashMap({
        constructor: true
    })
};
function forEachOwnProp(object, fun) {
    var ignore = dontMix[typeof object];
    for (var _i = 0, _a = Object.keys(object); _i < _a.length; _i++) {
        var name_2 = _a[_i];
        ignore[name_2] || fun(name_2);
    }
}
export var mixins = function () {
    var list = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        list[_i] = arguments[_i];
    }
    return (function (Class) { return MixinsState.get(Class).merge(list); });
};
export var mixinRules = (function (rules) { return (function (Class) {
    var mixins = MixinsState.get(Class);
    mixins.mergeRules = defaults(rules, mixins.mergeRules);
}); });
mixinRules.value = function (a, b) { return a; };
mixinRules.protoValue = function (a, b) { return a; };
mixinRules.merge = function (a, b) { return defaults({}, a, b); };
mixinRules.pipe = function (a, b) { return (function (x) {
    return a.call(this, b.call(this, x));
}); };
mixinRules.defaults = function (a, b) { return (function () {
    return defaults(a.apply(this, arguments), b.apply(this, arguments));
}); };
mixinRules.classFirst = function (a, b) { return (function () {
    a.apply(this, arguments);
    b.apply(this, arguments);
}); };
mixinRules.classLast = function (a, b) { return (function () {
    b.apply(this, arguments);
    a.apply(this, arguments);
}); };
mixinRules.every = function (a, b) { return (function () {
    return a.apply(this, arguments) && b.apply(this, arguments);
}); };
mixinRules.some = function (a, b) { return (function () {
    return a.apply(this, arguments) || b.apply(this, arguments);
}); };
function assignProperty(dest, name, sourceProp, rule, unshift) {
    if (dest.hasOwnProperty(name)) {
        var destProp = Object.getOwnPropertyDescriptor(dest, name);
        if (destProp.configurable && 'value' in destProp) {
            dest[name] = unshift ?
                resolveRule(sourceProp.value, destProp.value, rule) :
                resolveRule(destProp.value, sourceProp.value, rule);
        }
    }
    else {
        Object.defineProperty(dest, name, sourceProp);
    }
}
function resolveRule(dest, source, rule) {
    if (dest === void 0)
        return source;
    if (!rule || source === void 0)
        return dest;
    return rule(dest, source);
}
//# sourceMappingURL=mixins.js.map