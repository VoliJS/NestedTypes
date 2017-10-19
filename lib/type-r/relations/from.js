import * as tslib_1 from "tslib";
import { AnyType } from '../record';
import { parseReference } from './commons';
import { Record } from '../record';
import { ChainableAttributeSpec } from '../record';
var RecordRefType = (function (_super) {
    tslib_1.__extends(RecordRefType, _super);
    function RecordRefType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RecordRefType.prototype.toJSON = function (value) {
        return value && typeof value === 'object' ? value.id : value;
    };
    RecordRefType.prototype.clone = function (value) {
        return value && typeof value === 'object' ? value.id : value;
    };
    RecordRefType.prototype.isChanged = function (a, b) {
        var aId = a && (a.id == null ? a : a.id), bId = b && (b.id == null ? b : b.id);
        return aId !== bId;
    };
    RecordRefType.prototype.validate = function (model, value, name) { };
    return RecordRefType;
}(AnyType));
Record.from = function from(masterCollection) {
    var getMasterCollection = parseReference(masterCollection);
    var typeSpec = new ChainableAttributeSpec({
        value: null,
        _attribute: RecordRefType
    });
    return typeSpec
        .get(function (objOrId, name) {
        if (typeof objOrId === 'object')
            return objOrId;
        var collection = getMasterCollection(this);
        var record = null;
        if (collection && collection.length) {
            record = collection.get(objOrId) || null;
            this.attributes[name] = record;
            record && this._attributes[name].handleChange(record, null, this, {});
        }
        return record;
    });
};
//# sourceMappingURL=from.js.map