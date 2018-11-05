import * as tslib_1 from "tslib";
import { AnyType } from './any';
var ImmutableClassType = (function (_super) {
    tslib_1.__extends(ImmutableClassType, _super);
    function ImmutableClassType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ImmutableClassType.prototype.create = function () {
        return new this.type();
    };
    ImmutableClassType.prototype.convert = function (next) {
        return next == null || next instanceof this.type ? next : new this.type(next);
    };
    ImmutableClassType.prototype.toJSON = function (value, key, options) {
        return value && value.toJSON ? value.toJSON(options) : value;
    };
    ImmutableClassType.prototype.clone = function (value) {
        return new this.type(this.toJSON(value));
    };
    ImmutableClassType.prototype.isChanged = function (a, b) {
        return a !== b;
    };
    return ImmutableClassType;
}(AnyType));
export { ImmutableClassType };
var PrimitiveType = (function (_super) {
    tslib_1.__extends(PrimitiveType, _super);
    function PrimitiveType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PrimitiveType.prototype.dispose = function () { };
    PrimitiveType.prototype.create = function () { return this.type(); };
    PrimitiveType.prototype.toJSON = function (value) { return value; };
    PrimitiveType.prototype.convert = function (next) { return next == null ? next : this.type(next); };
    PrimitiveType.prototype.isChanged = function (a, b) { return a !== b; };
    PrimitiveType.prototype.clone = function (value) { return value; };
    PrimitiveType.prototype.doInit = function (value, record, options) {
        return this.transform(value === void 0 ? this.value : value, void 0, record, options);
    };
    PrimitiveType.prototype.doUpdate = function (value, record, options, nested) {
        var name = this.name, attributes = record.attributes, prev = attributes[name];
        return prev !== (attributes[name] = this.transform(value, prev, record, options));
    };
    PrimitiveType.prototype.initialize = function () {
        if (!this.options.hasCustomDefault) {
            this.value = this.type();
        }
    };
    return PrimitiveType;
}(AnyType));
export { PrimitiveType };
var NumericType = (function (_super) {
    tslib_1.__extends(NumericType, _super);
    function NumericType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NumericType.prototype.create = function () {
        return 0;
    };
    NumericType.prototype.convert = function (next, prev, record, options) {
        var num = next == null ? next : this.type(next);
        if (num !== num) {
            this._log('error', 'Type-R:InvalidNumber', 'Number attribute is assigned with an invalid number', next, record, options.logger);
        }
        return num;
    };
    NumericType.prototype.validate = function (model, value, name) {
        if (value != null && !isFinite(value)) {
            return name + ' is not valid number';
        }
    };
    return NumericType;
}(PrimitiveType));
export { NumericType };
var ArrayType = (function (_super) {
    tslib_1.__extends(ArrayType, _super);
    function ArrayType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ArrayType.prototype.toJSON = function (value) { return value; };
    ArrayType.prototype.dispose = function () { };
    ArrayType.prototype.create = function () { return []; };
    ArrayType.prototype.convert = function (next, prev, record, options) {
        if (next == null || Array.isArray(next))
            return next;
        this._log('error', 'Type-R:InvalidArray', 'Array attribute assigned with non-array value', next, record, options.logger);
        return [];
    };
    ArrayType.prototype.clone = function (value) {
        return value && value.slice();
    };
    return ArrayType;
}(AnyType));
export { ArrayType };
var ObjectType = (function (_super) {
    tslib_1.__extends(ObjectType, _super);
    function ObjectType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ObjectType.prototype.create = function () { return {}; };
    ObjectType.prototype.convert = function (next, prev, record, options) {
        if (next == null || typeof next === 'object')
            return next;
        this._log('error', 'Type-R:InvalidObject', 'Object attribute is assigned with non-object value', next, record, options.logger);
        return {};
    };
    return ObjectType;
}(AnyType));
export { ObjectType };
export function doNothing() { }
var FunctionType = (function (_super) {
    tslib_1.__extends(FunctionType, _super);
    function FunctionType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FunctionType.prototype.toJSON = function (value) { return void 0; };
    FunctionType.prototype.create = function () { return doNothing; };
    FunctionType.prototype.dispose = function () { };
    FunctionType.prototype.convert = function (next, prev, record, options) {
        if (next == null || typeof next === 'function')
            return next;
        this._log('error', 'Type-R:InvalidFunction', 'Function attribute assigned with non-function value', next, record, options.logger);
        return doNothing;
    };
    FunctionType.prototype.clone = function (value) { return value; };
    return FunctionType;
}(AnyType));
export { FunctionType };
//# sourceMappingURL=basic.js.map