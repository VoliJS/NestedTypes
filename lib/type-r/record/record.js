import * as tslib_1 from "tslib";
import { define, definitions, isProduction, logger, mixinRules, tools } from '../object-plus';
import { Transactional } from '../transactions';
import { AggregatedType, AnyType } from './metatypes';
import { IORecordMixin } from './io-mixin';
import { setAttribute, shouldBeAnObject, unknownAttrsWarning, UpdateRecordMixin } from './updates';
var assign = tools.assign, isEmpty = tools.isEmpty;
var _cidCounter = 0;
var Record = (function (_super) {
    tslib_1.__extends(Record, _super);
    function Record(a_values, a_options) {
        var _this = _super.call(this, _cidCounter++) || this;
        _this.attributes = {};
        var options = a_options || {}, values = (options.parse ? _this.parse(a_values, options) : a_values) || {};
        isProduction || typeCheck(_this, values, options);
        _this._previousAttributes = _this.attributes = new _this.Attributes(_this, values, options);
        _this.initialize(a_values, a_options);
        if (_this._localEvents)
            _this._localEvents.subscribe(_this, _this);
        return _this;
    }
    Record_1 = Record;
    Record.onDefine = function (definition, BaseClass) { };
    Record.defaults = function (attrs) {
        return this.extend({ attributes: attrs });
    };
    Record.prototype.save = function (options) { throw new Error('Implemented by mixin'); };
    Record.prototype.destroy = function (options) { throw new Error('Implemented by mixin'); };
    Record.prototype.previousAttributes = function () { return new this.AttributesCopy(this._previousAttributes); };
    Object.defineProperty(Record.prototype, "__inner_state__", {
        get: function () { return this.attributes; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Record.prototype, "changed", {
        get: function () {
            var changed = this._changedAttributes;
            if (!changed) {
                var prev = this._previousAttributes;
                changed = {};
                var attributes = this.attributes;
                for (var _i = 0, _a = this._attributesArray; _i < _a.length; _i++) {
                    var attr = _a[_i];
                    var key = attr.name, value = attributes[key];
                    if (attr.isChanged(value, prev[key])) {
                        changed[key] = value;
                    }
                }
                this._changedAttributes = changed;
            }
            return changed;
        },
        enumerable: true,
        configurable: true
    });
    Record.prototype.changedAttributes = function (diff) {
        if (!diff)
            return this.hasChanged() ? assign({}, this.changed) : false;
        var val, changed = false, old = this._transaction ? this._previousAttributes : this.attributes, attrSpecs = this._attributes;
        for (var attr in diff) {
            if (!attrSpecs[attr].isChanged(old[attr], (val = diff[attr])))
                continue;
            (changed || (changed = {}))[attr] = val;
        }
        return changed;
    };
    Record.prototype.hasChanged = function (key) {
        var _previousAttributes = this._previousAttributes;
        if (!_previousAttributes)
            return false;
        return key ?
            this._attributes[key].isChanged(this.attributes[key], _previousAttributes[key]) :
            !isEmpty(this.changed);
    };
    Record.prototype.previous = function (key) {
        if (key) {
            var _previousAttributes = this._previousAttributes;
            if (_previousAttributes)
                return _previousAttributes[key];
        }
        return null;
    };
    Record.prototype.isNew = function () {
        return this.id == null;
    };
    Record.prototype.has = function (key) {
        return this[key] != void 0;
    };
    Record.prototype.unset = function (key, options) {
        var _a;
        var value = this[key];
        this.set((_a = {}, _a[key] = void 0, _a), tslib_1.__assign({ unset: true }, options));
        return value;
    };
    Record.prototype.clear = function (options) {
        var _this = this;
        var nullify = options && options.nullify;
        this.transaction(function () {
            _this.forEach(function (value, key) { return _this[key] = nullify ? null : void 0; });
        }, options);
        return this;
    };
    Record.prototype.getOwner = function () {
        var owner = this._owner;
        return this._ownerKey ? owner : owner && owner._owner;
    };
    Object.defineProperty(Record.prototype, "id", {
        get: function () { return this.attributes[this.idAttribute]; },
        set: function (x) { setAttribute(this, this.idAttribute, x); },
        enumerable: true,
        configurable: true
    });
    Record.prototype.defaults = function (values) {
        if (values === void 0) { values = {}; }
        var defaults = {}, _attributesArray = this._attributesArray;
        for (var _i = 0, _attributesArray_1 = _attributesArray; _i < _attributesArray_1.length; _i++) {
            var attr = _attributesArray_1[_i];
            var key = attr.name, value = values[key];
            defaults[key] = value === void 0 ? attr.defaultValue() : value;
        }
        return defaults;
    };
    Record.prototype.initialize = function (values, options) { };
    Record.prototype.clone = function (options) {
        if (options === void 0) { options = {}; }
        var copy = new this.constructor(this.attributes, { clone: true });
        if (options.pinStore)
            copy._defaultStore = this.getStore();
        return copy;
    };
    Record.prototype._validateNested = function (errors) {
        var length = 0;
        var attributes = this.attributes;
        for (var _i = 0, _a = this._attributesArray; _i < _a.length; _i++) {
            var attribute = _a[_i];
            var name_1 = attribute.name, error = attribute.validate(this, attributes[name_1], name_1);
            if (error) {
                errors[name_1] = error;
                length++;
            }
        }
        return length;
    };
    Record.prototype.get = function (key) {
        return this[key];
    };
    Record.prototype.set = function (values, options) {
        if (values) {
            var transaction = this._createTransaction(values, options);
            transaction && transaction.commit();
        }
        return this;
    };
    Record.prototype.toJSON = function (options) {
        var json = {}, attributes = this.attributes;
        for (var _i = 0, _a = this._attributesArray; _i < _a.length; _i++) {
            var attribute = _a[_i];
            var name_2 = attribute.name, value = attributes[name_2];
            if (value !== void 0) {
                var asJson = attribute.toJSON.call(this, value, name_2, options);
                if (asJson !== void 0)
                    json[name_2] = asJson;
            }
        }
        return json;
    };
    Record.prototype.parse = function (data, options) {
        return data;
    };
    Record.prototype.deepSet = function (name, value, options) {
        var _this = this;
        this.transaction(function () {
            var _a;
            var path = name.split('.'), l = path.length - 1, attr = path[l];
            var model = _this;
            for (var i = 0; i < l; i++) {
                var key = path[i];
                var next = model.get ? model.get(key) : model[key];
                if (!next) {
                    var attrSpecs = model._attributes;
                    if (attrSpecs) {
                        var newModel = attrSpecs[key].create();
                        if (options && options.nullify && newModel._attributes) {
                            newModel.clear(options);
                        }
                        model[key] = next = newModel;
                    }
                    else
                        return;
                }
                model = next;
            }
            if (model.set) {
                model.set((_a = {}, _a[attr] = value, _a), options);
            }
            else {
                model[attr] = value;
            }
        });
        return this;
    };
    Object.defineProperty(Record.prototype, "collection", {
        get: function () {
            return this._ownerKey ? null : this._owner;
        },
        enumerable: true,
        configurable: true
    });
    Record.prototype.dispose = function () {
        if (this._disposed)
            return;
        var attributes = this.attributes;
        for (var _i = 0, _a = this._attributesArray; _i < _a.length; _i++) {
            var attr = _a[_i];
            attr.dispose(this, attributes[attr.name]);
        }
        _super.prototype.dispose.call(this);
    };
    Record.prototype._log = function (level, topic, text, props, a_logger) {
        (a_logger || logger).trigger(level, topic, text, tslib_1.__assign({}, props, { 'Record': this, 'Attributes definition:': this._attributes }));
    };
    Record.prototype.getClassName = function () {
        return _super.prototype.getClassName.call(this) || 'Record';
    };
    Record.prototype._createTransaction = function (values, options) { return void 0; };
    Record.prototype.forEach = function (iteratee, context) {
        var fun = context !== void 0 ? function (v, k) { return iteratee.call(context, v, k); } : iteratee, attributes = this.attributes;
        for (var key in this.attributes) {
            var value = attributes[key];
            if (value !== void 0)
                fun(value, key);
        }
    };
    Record.prototype[Symbol.iterator] = function () {
        return new RecordEntriesIterator(this);
    };
    Record.prototype.entries = function () {
        return new RecordEntriesIterator(this);
    };
    Record.prototype.keys = function () {
        var keys = [];
        this.forEach(function (value, key) { return value === void 0 || keys.push(key); });
        return keys;
    };
    var Record_1;
    Record._metatype = AggregatedType;
    Record = Record_1 = tslib_1.__decorate([
        define({
            cidPrefix: 'm',
            _changeEventName: 'change',
            idAttribute: 'id'
        }),
        definitions({
            defaults: mixinRules.merge,
            attributes: mixinRules.merge,
            collection: mixinRules.merge,
            Collection: mixinRules.value,
            idAttribute: mixinRules.protoValue
        })
    ], Record);
    return Record;
}(Transactional));
export { Record };
;
assign(Record.prototype, UpdateRecordMixin, IORecordMixin);
var BaseRecordAttributes = (function () {
    function BaseRecordAttributes(record, x, options) {
        this.id = x.id;
    }
    return BaseRecordAttributes;
}());
Record.prototype.Attributes = BaseRecordAttributes;
var BaseRecordAttributesCopy = (function () {
    function BaseRecordAttributesCopy(x) {
        this.id = x.id;
    }
    return BaseRecordAttributesCopy;
}());
Record.prototype.AttributesCopy = BaseRecordAttributesCopy;
var IdAttribute = AnyType.create({ value: void 0 }, 'id');
Record.prototype._attributes = { id: IdAttribute };
Record.prototype._attributesArray = [IdAttribute];
function typeCheck(record, values, options) {
    if (shouldBeAnObject(record, values, options)) {
        var _attributes = record._attributes;
        var unknown = void 0;
        for (var name_3 in values) {
            if (!_attributes[name_3]) {
                unknown || (unknown = []);
                unknown.push("'" + name_3 + "'");
            }
        }
        if (unknown) {
            unknownAttrsWarning(record, unknown, { values: values }, options);
        }
    }
}
var RecordEntriesIterator = (function () {
    function RecordEntriesIterator(record) {
        this.record = record;
        this.idx = 0;
    }
    RecordEntriesIterator.prototype.next = function () {
        var record = this.record, metatype = record._attributesArray[this.idx++];
        return {
            done: !metatype,
            value: metatype ? [metatype.name, record[metatype.name]] : void 0
        };
    };
    return RecordEntriesIterator;
}());
export { RecordEntriesIterator };
//# sourceMappingURL=record.js.map