import * as tslib_1 from "tslib";
import { AnyType } from './any';
import { transactionApi, ItemsBehavior } from '../../transactions';
var free = transactionApi.free, aquire = transactionApi.aquire;
var AggregatedType = (function (_super) {
    tslib_1.__extends(AggregatedType, _super);
    function AggregatedType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AggregatedType.prototype.clone = function (value) {
        return value ? value.clone() : value;
    };
    AggregatedType.prototype.toJSON = function (x, key, options) { return x && x.toJSON(options); };
    AggregatedType.prototype.doInit = function (value, record, options) {
        var v = options.clone ? this.clone(value) : (value === void 0 ? this.defaultValue() : value);
        var x = this.transform(v, void 0, record, options);
        this.handleChange(x, void 0, record, options);
        return x;
    };
    AggregatedType.prototype.doUpdate = function (value, record, options, nested) {
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
    AggregatedType.prototype.canBeUpdated = function (prev, next, options) {
        if (prev && next != null) {
            if (next instanceof this.type) {
                if (options.merge)
                    return next.__inner_state__;
            }
            else {
                return next;
            }
        }
    };
    AggregatedType.prototype.convert = function (next, prev, record, options) {
        if (next == null)
            return next;
        if (next instanceof this.type) {
            if (next._shared && !(next._shared & ItemsBehavior.persistent)) {
                this._log('error', 'aggregated collection attribute is assigned with shared collection', next, record);
            }
            return options.merge ? next.clone() : next;
        }
        return this.type.create(next, options);
    };
    AggregatedType.prototype.dispose = function (record, value) {
        if (value) {
            this.handleChange(void 0, value, record, {});
        }
    };
    AggregatedType.prototype.validate = function (record, value) {
        var error = value && value.validationError;
        if (error)
            return error;
    };
    AggregatedType.prototype.create = function () {
        return this.type.create();
    };
    AggregatedType.prototype.initialize = function (options) {
        options.changeHandlers.unshift(this._handleChange);
    };
    AggregatedType.prototype._handleChange = function (next, prev, record, options) {
        if (prev) {
            free(record, prev);
            options.unset || prev.dispose();
        }
        if (next && !aquire(record, next, this.name)) {
            this._log('error', 'aggregated attribute assigned with object already having an owner', next, record);
        }
    };
    return AggregatedType;
}(AnyType));
export { AggregatedType };
//# sourceMappingURL=owned.js.map