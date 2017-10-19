import * as tslib_1 from "tslib";
import { AnyType } from './any';
import { ItemsBehavior, transactionApi } from '../../transactions';
import { eventsApi } from '../../object-plus';
var on = eventsApi.on, off = eventsApi.off, free = transactionApi.free, aquire = transactionApi.aquire;
var shareAndListen = ItemsBehavior.listen | ItemsBehavior.share;
var SharedType = (function (_super) {
    tslib_1.__extends(SharedType, _super);
    function SharedType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SharedType.prototype.doInit = function (value, record, options) {
        var v = options.clone ? this.clone(value, record) : (value === void 0 ? this.defaultValue() : value);
        var x = this.transform(v, void 0, record, options);
        this.handleChange(x, void 0, record, options);
        return x;
    };
    SharedType.prototype.doUpdate = function (value, record, options, nested) {
        var key = this.name, attributes = record.attributes;
        var prev = attributes[key];
        var update;
        if (update = this.canBeUpdated(prev, value, options)) {
            var nestedTransaction = prev._createTransaction(update, options);
            if (nestedTransaction) {
                if (nested) {
                    nested.push(nestedTransaction);
                }
                else {
                    nestedTransaction.commit(record);
                }
                if (this.propagateChanges)
                    return true;
            }
            return false;
        }
        var next = this.transform(value, prev, record, options);
        attributes[key] = next;
        if (this.isChanged(next, prev)) {
            this.handleChange(next, prev, record, options);
            return true;
        }
        return false;
    };
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
    SharedType.prototype.convert = function (next, prev, record, options) {
        if (next == null || next instanceof this.type)
            return next;
        var implicitObject = new this.type(next, options, shareAndListen);
        aquire(record, implicitObject, this.name);
        return implicitObject;
    };
    SharedType.prototype.validate = function (model, value, name) { };
    SharedType.prototype.create = function () {
        return null;
    };
    SharedType.prototype._handleChange = function (next, prev, record, options) {
        if (prev) {
            if (prev._owner === record) {
                free(record, prev);
                options.unset || prev.dispose();
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
            this.handleChange(void 0, value, record, {});
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
}(AnyType));
export { SharedType };
function ignore() { }
//# sourceMappingURL=shared.js.map