import { transactionApi } from "../../transactions";
var _begin = transactionApi.begin, _markAsDirty = transactionApi.markAsDirty, commit = transactionApi.commit;
import { eventsApi } from '../../object-plus';
var trigger3 = eventsApi.trigger3;
export function setAttribute(record, name, value) {
    var isRoot = begin(record), options = {};
    if (record._attributes[name].doUpdate(value, record, options)) {
        markAsDirty(record, options);
        trigger3(record, 'change:' + name, record, record.attributes[name], options);
    }
    isRoot && commit(record);
}
function begin(record) {
    if (_begin(record)) {
        record._previousAttributes = new record.AttributesCopy(record.attributes);
        record._changedAttributes = null;
        return true;
    }
    return false;
}
function markAsDirty(record, options) {
    if (record._changedAttributes) {
        record._changedAttributes = null;
    }
    return _markAsDirty(record, options);
}
export var UpdateRecordMixin = {
    transaction: function (fun, options) {
        if (options === void 0) { options = {}; }
        var isRoot = begin(this);
        fun.call(this, this);
        isRoot && commit(this);
    },
    _onChildrenChange: function (child, options) {
        var _ownerKey = child._ownerKey, attribute = this._attributes[_ownerKey];
        if (!attribute || attribute.propagateChanges)
            this.forceAttributeChange(_ownerKey, options);
    },
    forceAttributeChange: function (key, options) {
        if (options === void 0) { options = {}; }
        var isRoot = begin(this);
        if (markAsDirty(this, options)) {
            trigger3(this, 'change:' + key, this, this.attributes[key], options);
        }
        isRoot && commit(this);
    },
    _createTransaction: function (a_values, options) {
        if (options === void 0) { options = {}; }
        var isRoot = begin(this), changes = [], nested = [], _attributes = this._attributes, values = options.parse ? this.parse(a_values, options) : a_values;
        var unknown;
        if (shouldBeAnObject(this, values)) {
            for (var name_1 in values) {
                var spec = _attributes[name_1];
                if (spec) {
                    if (spec.doUpdate(values[name_1], this, options, nested)) {
                        changes.push(name_1);
                    }
                }
                else {
                    unknown || (unknown = []);
                    unknown.push("'" + name_1 + "'");
                }
            }
            if (unknown) {
            }
        }
        if (changes.length && markAsDirty(this, options)) {
            return new RecordTransaction(this, isRoot, nested, changes);
        }
        for (var _i = 0, nested_1 = nested; _i < nested_1.length; _i++) {
            var pendingTransaction = nested_1[_i];
            pendingTransaction.commit(this);
        }
        isRoot && commit(this);
    }
};
export function constructorsMixin(attrDefs) {
    var attrs = Object.keys(attrDefs);
    var AttributesCopy = new Function('values', "\n        " + attrs.map(function (attr) { return "\n            this." + attr + " = values." + attr + ";\n        "; }).join('') + "\n    ");
    AttributesCopy.prototype = Object.prototype;
    var Attributes = new Function('record', 'values', 'options', "\n        var _attrs = record._attributes;\n\n        " + attrs.map(function (attr) { return "\n            this." + attr + " = _attrs." + attr + ".doInit( values." + attr + ", record, options );\n        "; }).join('') + "\n    ");
    Attributes.prototype = Object.prototype;
    return { Attributes: Attributes, AttributesCopy: AttributesCopy };
}
export function shouldBeAnObject(record, values) {
    if (values && values.constructor === Object)
        return true;
    record._log('warn', 'update with non-object is ignored!', { values: values });
    return false;
}
var RecordTransaction = (function () {
    function RecordTransaction(object, isRoot, nested, changes) {
        this.object = object;
        this.isRoot = isRoot;
        this.nested = nested;
        this.changes = changes;
    }
    RecordTransaction.prototype.commit = function (initiator) {
        var _a = this, nested = _a.nested, object = _a.object, changes = _a.changes;
        for (var _i = 0, nested_2 = nested; _i < nested_2.length; _i++) {
            var transaction = nested_2[_i];
            transaction.commit(object);
        }
        var attributes = object.attributes, _isDirty = object._isDirty;
        for (var _b = 0, changes_1 = changes; _b < changes_1.length; _b++) {
            var key = changes_1[_b];
            trigger3(object, 'change:' + key, object, attributes[key], _isDirty);
        }
        this.isRoot && commit(object, initiator);
    };
    return RecordTransaction;
}());
export { RecordTransaction };
//# sourceMappingURL=updates.js.map