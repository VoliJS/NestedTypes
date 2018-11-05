import { definitionDecorator, EventMap, tools } from '../object-plus';
import { Transactional } from '../transactions';
import { getMetatype } from './metatypes';
var assign = tools.assign;
var ChainableAttributeSpec = (function () {
    function ChainableAttributeSpec(options) {
        this.options = { getHooks: [], transforms: [], changeHandlers: [] };
        if (options)
            assign(this.options, options);
    }
    ChainableAttributeSpec.prototype.check = function (check, error) {
        function validate(model, value, name) {
            if (!check.call(model, value, name)) {
                var msg = error || check.error || name + ' is not valid';
                return typeof msg === 'function' ? msg.call(model, name) : msg;
            }
        }
        var prev = this.options.validate;
        return this.metadata({
            validate: prev ? (function (model, value, name) {
                return prev(model, value, name) || validate(model, value, name);
            }) : validate
        });
    };
    Object.defineProperty(ChainableAttributeSpec.prototype, "asProp", {
        get: function () {
            return definitionDecorator('attributes', this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChainableAttributeSpec.prototype, "as", {
        get: function () { return this.asProp; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChainableAttributeSpec.prototype, "isRequired", {
        get: function () {
            return this.required;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChainableAttributeSpec.prototype, "required", {
        get: function () {
            return this.metadata({ isRequired: true });
        },
        enumerable: true,
        configurable: true
    });
    ChainableAttributeSpec.prototype.endpoint = function (endpoint) {
        return this.metadata({ endpoint: endpoint });
    };
    ChainableAttributeSpec.prototype.watcher = function (ref) {
        return this.metadata({ _onChange: ref });
    };
    ChainableAttributeSpec.prototype.parse = function (fun) {
        return this.metadata({ parse: fun });
    };
    ChainableAttributeSpec.prototype.toJSON = function (fun) {
        return this.metadata({
            toJSON: typeof fun === 'function' ? fun : (fun ? function (x, k, o) { return x && x.toJSON(o); } : emptyFunction)
        });
    };
    ChainableAttributeSpec.prototype.get = function (fun) {
        return this.metadata({
            getHooks: this.options.getHooks.concat(fun)
        });
    };
    ChainableAttributeSpec.prototype.set = function (fun) {
        function handleSetHook(next, prev, record, options) {
            if (this.isChanged(next, prev)) {
                var changed = fun.call(record, next, this.name);
                return changed === void 0 ? prev : this.convert(changed, prev, record, options);
            }
            return prev;
        }
        return this.metadata({
            transforms: this.options.transforms.concat(handleSetHook)
        });
    };
    ChainableAttributeSpec.prototype.changeEvents = function (events) {
        return this.metadata({ changeEvents: events });
    };
    ChainableAttributeSpec.prototype.events = function (map) {
        var eventMap = new EventMap(map);
        function handleEventsSubscribtion(next, prev, record) {
            prev && prev.trigger && eventMap.unsubscribe(record, prev);
            next && next.trigger && eventMap.subscribe(record, next);
        }
        return this.metadata({
            changeHandlers: this.options.changeHandlers.concat(handleEventsSubscribtion)
        });
    };
    Object.defineProperty(ChainableAttributeSpec.prototype, "has", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    ChainableAttributeSpec.prototype.metadata = function (options) {
        var cloned = new ChainableAttributeSpec(this.options);
        assign(cloned.options, options);
        return cloned;
    };
    ChainableAttributeSpec.prototype.value = function (x) {
        return this.metadata({ value: x, hasCustomDefault: true });
    };
    ChainableAttributeSpec.from = function (spec) {
        var attrSpec;
        if (typeof spec === 'function') {
            attrSpec = type(spec);
        }
        else if (spec && spec instanceof ChainableAttributeSpec) {
            attrSpec = spec;
        }
        else {
            var type_1 = inferType(spec);
            if (type_1 && type_1.prototype instanceof Transactional) {
                attrSpec = type_1(type_1.shared).value(spec);
            }
            else {
                attrSpec = new ChainableAttributeSpec({ type: type_1, value: spec, hasCustomDefault: true });
            }
        }
        return attrSpec;
    };
    return ChainableAttributeSpec;
}());
export { ChainableAttributeSpec };
function emptyFunction() { }
export function type(type, value) {
    if (type instanceof ChainableAttributeSpec)
        return type;
    var defaultValue = value === void 0 ? getMetatype(type).defaultValue : value;
    return new ChainableAttributeSpec({
        type: type,
        value: defaultValue,
        hasCustomDefault: defaultValue !== void 0
    });
}
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
            return value ? value.constructor : void 0;
    }
}
export function createSharedTypeSpec(Constructor, Attribute) {
    if (!Constructor.hasOwnProperty('shared')) {
        Object.defineProperty(Constructor, 'shared', {
            get: function () {
                return new ChainableAttributeSpec({
                    value: null,
                    type: Constructor,
                    _metatype: Attribute
                });
            }
        });
    }
}
//# sourceMappingURL=attrDef.js.map