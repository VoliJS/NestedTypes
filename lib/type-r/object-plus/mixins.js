var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { log, assign, omit, getPropertyDescriptor, getBaseClass, defaults, transform } from './tools';
var Mixable = (function () {
    function Mixable() {
        this.initialize.apply(this, arguments);
    }
    Mixable.prototype.initialize = function () { };
    Mixable.create = function (a, b) {
        return new this(a, b);
    };
    Mixable.mixins = function () {
        var mixins = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            mixins[_i] = arguments[_i];
        }
        var proto = this.prototype, mergeRules = this._mixinRules || {}, _appliedMixins = this._appliedMixins = (this._appliedMixins || []).slice();
        for (var _a = 0, mixins_1 = mixins; _a < mixins_1.length; _a++) {
            var mixin = mixins_1[_a];
            if (mixin instanceof Array) {
                return Mixable.mixins.apply(this, mixin);
            }
            if (_appliedMixins.indexOf(mixin) >= 0)
                continue;
            _appliedMixins.push(mixin);
            if (typeof mixin === 'function') {
                defaults(this, mixin);
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
            args[_i] = arguments[_i];
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
            log.error("[Class Defininition] Class must have class extensions to use @define decorator. Use '@extendable' before @define, or extend the base class with class extensions.", definition);
            return this;
        }
        this.predefine();
        var proto = this.prototype;
        var protoProps = omit(definition, 'properties', 'mixins', 'mixinRules'), _a = definition.properties, properties = _a === void 0 ? {} : _a, mixins = definition.mixins, mixinRules = definition.mixinRules;
        assign(proto, protoProps);
        assign(this, staticProps);
        properties && Object.defineProperties(proto, transform({}, properties, toPropertyDescriptor));
        mixinRules && this.mixinRules(mixinRules);
        if (this._mixinRules) {
            var baseProto = getBaseClass(this);
            for (var _i = 0, _b = Object.keys(proto); _i < _b.length; _i++) {
                var name_1 = _b[_i];
                if (name_1 !== 'constructor' && this._mixinRules.hasOwnProperty(name_1) && name_1 in baseProto) {
                    proto[name_1] = mergeProp(proto[name_1], baseProto[name_1], this._mixinRules[name_1]);
                }
            }
        }
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
                __extends(_Subclass, _super);
                function _Subclass() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return _Subclass;
            }(this));
        }
        return spec ? Subclass.define(spec, statics) : Subclass.predefine();
    };
    Mixable.predefine = function () {
        var BaseClass = getBaseClass(this);
        if (BaseClass.create === this.create) {
            this.create = Mixable.create;
        }
        this.__super__ = BaseClass.prototype;
        return this;
    };
    return Mixable;
}());
export { Mixable };
Mixable._mixinRules = { properties: 'merge' };
function toPropertyDescriptor(x) {
    if (x) {
        return typeof x === 'function' ? { get: x } : x;
    }
}
export function mixinRules(rules) {
    return createDecorator('mixinRules', rules);
}
export function mixins() {
    var list = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        list[_i] = arguments[_i];
    }
    return createDecorator('mixins', list);
}
export function extendable(Type) {
    Mixable.mixTo(Type);
}
export function predefine(Constructor) {
    Constructor.predefine();
}
export function define(spec) {
    if (typeof spec === 'function') {
        spec.define({});
    }
    else {
        return createDecorator('define', spec);
    }
}
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
    var x = assign({}, a);
    return mergeProps(x, b, rules);
}
var mergeFunctions = {
    pipe: function (a, b) {
        return function (x) {
            return a.call(this, b.call(this, x));
        };
    },
    mergeSequence: function (a, b) {
        return function () {
            return defaults(a.call(this), b.call(this));
        };
    },
    overwrite: function (a, b) {
        return b;
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
export function mergeProps(target, source, rules) {
    if (rules === void 0) { rules = {}; }
    for (var _i = 0, _a = Object.keys(source); _i < _a.length; _i++) {
        var name_2 = _a[_i];
        if (name_2 === 'constructor')
            continue;
        var sourceProp = Object.getOwnPropertyDescriptor(source, name_2), destProp = getPropertyDescriptor(target, name_2), value = destProp && destProp.value;
        if (value != null) {
            var rule = rules[name_2];
            if (rule) {
                target[name_2] = mergeProp(value, sourceProp.value, rule);
            }
        }
        else {
            Object.defineProperty(target, name_2, sourceProp);
        }
    }
    return target;
}
function mergeProp(destVal, sourceVal, rule) {
    return typeof rule === 'object' ?
        mergeObjects(destVal, sourceVal, rule) : (rule === 'merge' ?
        mergeObjects(destVal, sourceVal) :
        mergeFunctions[rule](destVal, sourceVal));
}
//# sourceMappingURL=mixins.js.map