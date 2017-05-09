import { setAttribute, Record } from '../transaction';
import { tools } from '../../object-plus';
var notEqual = tools.notEqual, assign = tools.assign;
var AnyType = (function () {
    function AnyType(name, a_options) {
        this.name = name;
        this.getHook = null;
        this.options = a_options;
        var options = assign({ getHooks: [], transforms: [], changeHandlers: [] }, a_options);
        options.getHooks = options.getHooks.slice();
        options.transforms = options.transforms.slice();
        options.changeHandlers = options.changeHandlers.slice();
        var value = options.value, type = options.type, parse = options.parse, toJSON = options.toJSON, changeEvents = options.changeEvents, validate = options.validate, getHooks = options.getHooks, transforms = options.transforms, changeHandlers = options.changeHandlers;
        this.value = value;
        this.type = type;
        this.propagateChanges = changeEvents !== false;
        this.parse = parse;
        this.toJSON = toJSON === void 0 ? this.toJSON : toJSON;
        this.validate = validate || this.validate;
        if (options.isRequired) {
            this.validate = wrapIsRequired(this.validate);
        }
        transforms.unshift(this.convert);
        if (this.get)
            getHooks.unshift(this.get);
        this.initialize.call(this, options);
        if (getHooks.length) {
            var getHook_1 = this.getHook = getHooks.reduce(chainGetHooks);
            var validate_1 = this.validate;
            this.validate = function (record, value, key) {
                return validate_1.call(this, record, getHook_1.call(record, value, key), key);
            };
        }
        if (transforms.length) {
            this.transform = transforms.reduce(chainTransforms);
        }
        if (changeHandlers.length) {
            this.handleChange = changeHandlers.reduce(chainChangeHandlers);
        }
    }
    AnyType.create = function (options, name) {
        var type = options.type, AttributeCtor = options._attribute || (type ? type._attribute : AnyType);
        return new AttributeCtor(name, options);
    };
    AnyType.prototype.canBeUpdated = function (prev, next, options) { };
    AnyType.prototype.transform = function (value, options, prev, model) { return value; };
    AnyType.prototype.convert = function (value, options, prev, model) { return value; };
    AnyType.prototype.isChanged = function (a, b) {
        return notEqual(a, b);
    };
    AnyType.prototype.handleChange = function (next, prev, model) { };
    AnyType.prototype.create = function () { return new this.type(); };
    AnyType.prototype.clone = function (value, record) {
        if (value && typeof value === 'object') {
            if (value.clone)
                return value.clone();
            var proto = Object.getPrototypeOf(value);
            if (proto === Object.prototype || proto === Array.prototype) {
                return JSON.parse(JSON.stringify(value));
            }
        }
        return value;
    };
    AnyType.prototype.dispose = function (record, value) {
        this.handleChange(void 0, value, record);
    };
    AnyType.prototype.validate = function (record, value, key) { };
    AnyType.prototype.toJSON = function (value, key) {
        return value && value.toJSON ? value.toJSON() : value;
    };
    AnyType.prototype.createPropertyDescriptor = function () {
        var _a = this, name = _a.name, getHook = _a.getHook;
        if (name !== 'id') {
            return {
                set: function (value) {
                    setAttribute(this, name, value);
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
    AnyType.prototype.initialize = function (name, options) { };
    AnyType.prototype._log = function (level, text, value, record) {
        tools.log[level]("[Attribute Update] " + record.getClassName() + "." + this.name + ": " + text, value, 'Attributes spec:', record._attributes);
    };
    return AnyType;
}());
export { AnyType };
Record.prototype._attributes = { id: AnyType.create({ value: void 0 }, 'id') };
Record.prototype.defaults = function (attrs) {
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
        return nextHook.call(this, prevHook.call(this, value, name), name);
    };
}
function chainTransforms(prevTransform, nextTransform) {
    return function (value, options, prev, model) {
        return nextTransform.call(this, prevTransform.call(this, value, options, prev, model), options, prev, model);
    };
}
function wrapIsRequired(validate) {
    return function (record, value, key) {
        return value ? validate.call(this, record, value, key) : 'Required';
    };
}
//# sourceMappingURL=generic.js.map