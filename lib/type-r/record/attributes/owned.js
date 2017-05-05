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
import { Record } from '../transaction';
import { AnyType } from './generic';
import { transactionApi, ItemsBehavior } from '../../transactions';
var free = transactionApi.free, aquire = transactionApi.aquire;
var AggregatedType = (function (_super) {
    __extends(AggregatedType, _super);
    function AggregatedType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AggregatedType.prototype.clone = function (value) {
        return value ? value.clone() : value;
    };
    AggregatedType.prototype.toJSON = function (x) { return x && x.toJSON(); };
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
    AggregatedType.prototype.convert = function (value, options, prev, record) {
        if (value == null)
            return value;
        if (value instanceof this.type) {
            if (value._shared && !(value._shared & ItemsBehavior.persistent)) {
                this._log('error', 'aggregated attribute is assigned with shared collection type', value, record);
            }
            return options.merge ? value.clone() : value;
        }
        return this.type.create(value, options);
    };
    AggregatedType.prototype.dispose = function (record, value) {
        if (value) {
            free(record, value);
            value.dispose();
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
    AggregatedType.prototype._handleChange = function (next, prev, record) {
        prev && free(record, prev);
        if (next && !aquire(record, next, this.name)) {
            this._log('error', 'aggregated attribute assigned with object which is aggregated somewhere else', next, record);
        }
    };
    return AggregatedType;
}(AnyType));
export { AggregatedType };
Record._attribute = AggregatedType;
//# sourceMappingURL=owned.js.map