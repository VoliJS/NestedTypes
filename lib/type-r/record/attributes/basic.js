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
import { AnyType } from './generic';
var ConstructorType = (function (_super) {
    __extends(ConstructorType, _super);
    function ConstructorType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ConstructorType.prototype.convert = function (value) {
        return value == null || value instanceof this.type ? value : new this.type(value);
    };
    ConstructorType.prototype.clone = function (value) {
        return value && value.clone ? value.clone() : this.convert(JSON.parse(JSON.stringify(value)));
    };
    return ConstructorType;
}(AnyType));
Function.prototype._attribute = ConstructorType;
var PrimitiveType = (function (_super) {
    __extends(PrimitiveType, _super);
    function PrimitiveType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PrimitiveType.prototype.dispose = function () { };
    PrimitiveType.prototype.create = function () { return this.type(); };
    PrimitiveType.prototype.toJSON = function (value) { return value; };
    PrimitiveType.prototype.convert = function (value) { return value == null ? value : this.type(value); };
    PrimitiveType.prototype.isChanged = function (a, b) { return a !== b; };
    PrimitiveType.prototype.clone = function (value) { return value; };
    return PrimitiveType;
}(AnyType));
export { PrimitiveType };
Boolean._attribute = String._attribute = PrimitiveType;
var NumericType = (function (_super) {
    __extends(NumericType, _super);
    function NumericType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NumericType.prototype.convert = function (value, a, b, record) {
        var num = value == null ? value : this.type(value);
        if (num !== num) {
            this._log('warn', 'assigned with Invalid Number', value, record);
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
Number._attribute = NumericType;
var ArrayType = (function (_super) {
    __extends(ArrayType, _super);
    function ArrayType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ArrayType.prototype.toJSON = function (value) { return value; };
    ArrayType.prototype.dispose = function () { };
    ArrayType.prototype.convert = function (value, a, b, record) {
        if (value == null || Array.isArray(value))
            return value;
        this._log('warn', 'assigned with non-array', value, record);
        return [];
    };
    ArrayType.prototype.clone = function (value) { return value && value.slice(); };
    return ArrayType;
}(AnyType));
export { ArrayType };
Array._attribute = ArrayType;
//# sourceMappingURL=basic.js.map