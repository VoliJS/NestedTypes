import { setAttribute } from './updates';
import { tools } from '../../object-plus';
var notEqual = tools.notEqual, assign = tools.assign;
var emptyOptions = {};
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
        if (!options.hasCustomDefault && type) {
            this.defaultValue = this.create;
        }
        else if (tools.isValidJSON(value)) {
            this.defaultValue = new Function("return " + JSON.stringify(value) + ";");
        }
        else {
            this.defaultValue = this.defaultValue;
        }
        this.propagateChanges = changeEvents !== false;
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
        this.transform = transforms.length ? transforms.reduce(chainTransforms) : this.transform;
        this.handleChange = changeHandlers.length ? changeHandlers.reduce(chainChangeHandlers) : this.handleChange;
        var _a = this, doInit = _a.doInit, doUpdate = _a.doUpdate;
        this.doInit = parse ? function (value, record, options) {
            return doInit.call(this, options.parse && value !== void 0 ? parse.call(record, value, this.name) : value, record, options);
        } : doInit;
        this.doUpdate = parse ? function (value, record, options, nested) {
            return doUpdate.call(this, options.parse && value !== void 0 ? parse.call(record, value, this.name) : value, record, options, nested);
        } : doUpdate;
    }
    AnyType.create = function (options, name) {
        var type = options.type, AttributeCtor = options._attribute || (type ? type._attribute : AnyType);
        return new AttributeCtor(name, options);
    };
    AnyType.prototype.canBeUpdated = function (prev, next, options) { };
    AnyType.prototype.transform = function (next, prev, model, options) { return next; };
    AnyType.prototype.convert = function (next, prev, model, options) { return next; };
    AnyType.prototype.isChanged = function (a, b) {
        return notEqual(a, b);
    };
    AnyType.prototype.handleChange = function (next, prev, model, options) { };
    AnyType.prototype.create = function () { return void 0; };
    AnyType.prototype.clone = function (value, record) {
        return value;
    };
    AnyType.prototype.dispose = function (record, value) {
        this.handleChange(void 0, value, record, emptyOptions);
    };
    AnyType.prototype.validate = function (record, value, key) { };
    AnyType.prototype.toJSON = function (value, key, options) {
        return value && value.toJSON ? value.toJSON(options) : value;
    };
    AnyType.prototype.createPropertyDescriptor = function () {
        var _a = this, name = _a.name, getHook = _a.getHook;
        if (name !== 'id') {
            return {
                set: function (value) {
                    setAttribute(this, name, value);
                },
                get: (getHook ?
                    function () {
                        return getHook.call(this, this.attributes[name], name);
                    } :
                    function () { return this.attributes[name]; })
            };
        }
    };
    AnyType.prototype.initialize = function (name, options) { };
    AnyType.prototype.doInit = function (value, record, options) {
        var v = value === void 0 ? this.defaultValue() : value, x = this.transform(v, void 0, record, options);
        this.handleChange(x, void 0, record, options);
        return x;
    };
    AnyType.prototype.doUpdate = function (value, record, options, nested) {
        var name = this.name, attributes = record.attributes, prev = attributes[name];
        var next = this.transform(value, prev, record, options);
        attributes[name] = next;
        if (this.isChanged(next, prev)) {
            this.handleChange(next, prev, record, options);
            return true;
        }
        return false;
    };
    AnyType.prototype._log = function (level, text, value, record) {
        tools.log(level, "[Attribute Update Error] " + record.getClassName() + "." + this.name + ": " + text, {
            'Record': record,
            'Attribute definition': this,
            'Prev. value': record.attributes[this.name],
            'New value': value
        });
    };
    AnyType.prototype.defaultValue = function () {
        return this.value;
    };
    return AnyType;
}());
export { AnyType };
function chainGetHooks(prevHook, nextHook) {
    return function (value, name) {
        return nextHook.call(this, prevHook.call(this, value, name), name);
    };
}
function chainTransforms(prevTransform, nextTransform) {
    return function (next, prev, record, options) {
        return nextTransform.call(this, prevTransform.call(this, next, prev, record, options), prev, record, options);
    };
}
function chainChangeHandlers(prevHandler, nextHandler) {
    return function (next, prev, record, options) {
        prevHandler.call(this, next, prev, record, options);
        nextHandler.call(this, next, prev, record, options);
    };
}
function wrapIsRequired(validate) {
    return function (record, value, key) {
        return value ? validate.call(this, record, value, key) : 'Required';
    };
}
//# sourceMappingURL=any.js.map