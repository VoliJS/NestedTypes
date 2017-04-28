"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var generic_1 = require("./generic");
var transactions_1 = require("../../transactions");
var object_plus_1 = require("../../object-plus");
var on = object_plus_1.eventsApi.on, off = object_plus_1.eventsApi.off, free = transactions_1.transactionApi.free, aquire = transactions_1.transactionApi.aquire;
var shareAndListen = transactions_1.ItemsBehavior.listen | transactions_1.ItemsBehavior.share;
var SharedType = (function (_super) {
    __extends(SharedType, _super);
    function SharedType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SharedType.prototype.clone = function (value, record) {
        if (!value || value._owner !== record)
            return value;
        var clone = value.clone();
        aquire(record, clone, this.name);
        return clone;
    };
    SharedType.prototype.toJSON = function () { };
    SharedType.prototype.canBeUpdated = function (prev, next, options) {
        if (prev && next != null && !(next instanceof this.type)) {
            return next;
        }
    };
    SharedType.prototype.convert = function (value, options, prev, record) {
        if (value == null || value instanceof this.type)
            return value;
        var implicitObject = new this.type(value, options, shareAndListen);
        aquire(record, implicitObject, this.name);
        return implicitObject;
    };
    SharedType.prototype.validate = function (model, value, name) { };
    SharedType.prototype.create = function () {
        return null;
    };
    SharedType.prototype._handleChange = function (next, prev, record) {
        if (prev) {
            if (prev._owner === record) {
                free(record, prev);
            }
            else {
                off(prev, prev._changeEventName, this._onChange, record);
            }
        }
        if (next) {
            if (next._owner !== record) {
                on(next, next._changeEventName, this._onChange, record);
            }
        }
    };
    SharedType.prototype.dispose = function (record, value) {
        if (value) {
            if (value._owner === record) {
                free(record, value);
                value.dispose();
            }
            else {
                off(value, value._changeEventName, this._onChange, record);
            }
        }
    };
    SharedType.prototype.initialize = function (options) {
        var attribute = this;
        this._onChange = this.propagateChanges ? function (child, options, initiator) {
            this === initiator || this.forceAttributeChange(attribute.name, options);
        } : ignore;
        options.changeHandlers.unshift(this._handleChange);
    };
    return SharedType;
}(generic_1.AnyType));
exports.SharedType = SharedType;
function ignore() { }
//# sourceMappingURL=shared.js.map