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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var object_plus_1 = require("../object-plus");
var transactions_1 = require("../transactions");
var trigger3 = object_plus_1.eventsApi.trigger3, assign = object_plus_1.tools.assign, isEmpty = object_plus_1.tools.isEmpty, log = object_plus_1.tools.log, free = transactions_1.transactionApi.free, aquire = transactions_1.transactionApi.aquire, commit = transactions_1.transactionApi.commit, _begin = transactions_1.transactionApi.begin, _markAsDirty = transactions_1.transactionApi.markAsDirty;
var _cidCounter = 0;
var Record = Record_1 = (function (_super) {
    __extends(Record, _super);
    function Record(a_values, a_options) {
        var _this = _super.call(this, _cidCounter++) || this;
        _this.attributes = {};
        var options = a_options || {}, values = (options.parse ? _this.parse(a_values, options) : a_values) || {};
        var attributes = options.clone ? cloneAttributes(_this, values) : _this.defaults(values);
        _this.forEachAttr(attributes, function (value, key, attr) {
            var next = attributes[key] = attr.transform(value, options, void 0, _this);
            attr.handleChange(next, void 0, _this);
        });
        _this.attributes = _this._previousAttributes = attributes;
        _this.initialize(a_values, a_options);
        if (_this._localEvents)
            _this._localEvents.subscribe(_this, _this);
        return _this;
    }
    Record.define = function (protoProps, staticProps) {
        return transactions_1.Transactional.define(protoProps, staticProps);
    };
    Record.defaults = function (attrs) {
        return this.extend({ attributes: attrs });
    };
    Record.prototype.previousAttributes = function () { return new this.Attributes(this._previousAttributes); };
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
                var _a = this, _attributes = _a._attributes, attributes = _a.attributes;
                for (var _i = 0, _b = this._keys; _i < _b.length; _i++) {
                    var key = _b[_i];
                    var value = attributes[key];
                    if (_attributes[key].isChanged(value, prev[key])) {
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
        this.set(key, void 0, options);
        return this;
    };
    Record.prototype.clear = function (options) {
        var _this = this;
        var nullify = options && options.nullify;
        this.transaction(function () {
            _this.forEachAttr(_this.attributes, function (value, key) { return _this[key] = nullify ? null : void 0; });
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
    Record.prototype.Attributes = function (x) { this.id = x.id; };
    Record.prototype.forEachAttr = function (attrs, iteratee) {
        var _attributes = this._attributes;
        var unknown;
        for (var name_1 in attrs) {
            var spec = _attributes[name_1];
            if (spec) {
                iteratee(attrs[name_1], name_1, spec);
            }
            else {
                unknown || (unknown = []);
                unknown.push("'" + name_1 + "'");
            }
        }
        if (unknown) {
            this._log('warn', "attributes " + unknown.join(', ') + " are not defined", attrs);
        }
    };
    Record.prototype.each = function (iteratee, context) {
        var fun = context !== void 0 ? function (v, k) { return iteratee.call(context, v, k); } : iteratee, attributes = this.attributes;
        for (var _i = 0, _a = this._keys; _i < _a.length; _i++) {
            var key = _a[_i];
            var value = attributes[key];
            if (value !== void 0)
                fun(value, key);
        }
    };
    Record.prototype.keys = function () {
        var keys = [], attributes = this.attributes;
        for (var _i = 0, _a = this._keys; _i < _a.length; _i++) {
            var key = _a[_i];
            attributes[key] === void 0 || keys.push(key);
        }
        return keys;
    };
    Record.prototype.values = function () {
        return this.map(function (value) { return value; });
    };
    Record.prototype._toJSON = function () { return {}; };
    Record.prototype._parse = function (data) { return data; };
    Record.prototype.defaults = function (values) { return {}; };
    Record.prototype.initialize = function (values, options) { };
    Record.prototype.clone = function (options) {
        if (options === void 0) { options = {}; }
        var copy = new this.constructor(this.attributes, { clone: true });
        if (options.pinStore)
            copy._defaultStore = this.getStore();
        return copy;
    };
    Record.prototype.deepClone = function () { return this.clone(); };
    ;
    Record.prototype._validateNested = function (errors) {
        var _this = this;
        var length = 0;
        this.forEachAttr(this.attributes, function (value, name, attribute) {
            var error = attribute.validate(_this, value, name);
            if (error) {
                errors[name] = error;
                length++;
            }
        });
        return length;
    };
    Record.prototype.get = function (key) {
        return this[key];
    };
    Record.prototype.toJSON = function () {
        var _this = this;
        var json = {};
        this.forEachAttr(this.attributes, function (value, key, _a) {
            var toJSON = _a.toJSON;
            if (value !== void 0) {
                var asJson = toJSON.call(_this, value, key);
                if (asJson !== void 0)
                    json[key] = asJson;
            }
        });
        return json;
    };
    Record.prototype.parse = function (data, options) {
        return this._parse(data);
    };
    Record.prototype.set = function (a, b, c) {
        if (typeof a === 'string') {
            if (c) {
                return _super.prototype.set.call(this, (_a = {}, _a[a] = b, _a), c);
            }
            else {
                setAttribute(this, a, b);
                return this;
            }
        }
        else {
            return _super.prototype.set.call(this, a, b);
        }
        var _a;
    };
    Record.prototype.deepSet = function (name, value, options) {
        var _this = this;
        this.transaction(function () {
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
                model.set(attr, value, options);
            }
            else {
                model[attr] = value;
            }
        });
        return this;
    };
    Record.prototype.transaction = function (fun, options) {
        if (options === void 0) { options = {}; }
        var isRoot = begin(this);
        fun.call(this, this);
        isRoot && commit(this);
    };
    Record.prototype._createTransaction = function (a_values, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var isRoot = begin(this), changes = [], nested = [], attributes = this.attributes, values = options.parse ? this.parse(a_values, options) : a_values;
        if (values && values.constructor === Object) {
            this.forEachAttr(values, function (value, key, attr) {
                var prev = attributes[key];
                var update;
                if (update = attr.canBeUpdated(prev, value, options)) {
                    var nestedTransaction = prev._createTransaction(update, options);
                    if (nestedTransaction) {
                        nested.push(nestedTransaction);
                        if (attr.propagateChanges)
                            changes.push(key);
                    }
                    return;
                }
                var next = attr.transform(value, options, prev, _this);
                attributes[key] = next;
                if (attr.isChanged(next, prev)) {
                    changes.push(key);
                    attr.handleChange(next, prev, _this);
                }
            });
        }
        else {
            this._log('error', 'incompatible argument type', values);
        }
        if (changes.length && markAsDirty(this, options)) {
            return new RecordTransaction(this, isRoot, nested, changes);
        }
        for (var _i = 0, nested_1 = nested; _i < nested_1.length; _i++) {
            var pendingTransaction = nested_1[_i];
            pendingTransaction.commit(this);
        }
        isRoot && commit(this);
    };
    Record.prototype._onChildrenChange = function (child, options) {
        var _ownerKey = child._ownerKey, attribute = this._attributes[_ownerKey];
        if (!attribute || attribute.propagateChanges)
            this.forceAttributeChange(_ownerKey, options);
    };
    Record.prototype.forceAttributeChange = function (key, options) {
        if (options === void 0) { options = {}; }
        var isRoot = begin(this);
        if (markAsDirty(this, options)) {
            trigger3(this, 'change:' + key, this, this.attributes[key], options);
        }
        isRoot && commit(this);
    };
    Object.defineProperty(Record.prototype, "collection", {
        get: function () {
            return this._ownerKey ? null : this._owner;
        },
        enumerable: true,
        configurable: true
    });
    Record.prototype.dispose = function () {
        var _this = this;
        if (this._disposed)
            return;
        this.forEachAttr(this.attributes, function (value, key, attribute) {
            attribute.dispose(_this, value);
        });
        _super.prototype.dispose.call(this);
    };
    Record.prototype._log = function (level, text, value) {
        object_plus_1.tools.log[level]("[Model Update] " + this.getClassName() + ": " + text, value, 'Attributes spec:', this._attributes);
    };
    Record.prototype.getClassName = function () {
        return _super.prototype.getClassName.call(this) || 'Model';
    };
    return Record;
}(transactions_1.Transactional));
Record = Record_1 = __decorate([
    object_plus_1.define({
        cidPrefix: 'm',
        _changeEventName: 'change',
        idAttribute: 'id',
        _keys: ['id']
    })
], Record);
exports.Record = Record;
;
function begin(record) {
    if (_begin(record)) {
        record._previousAttributes = new record.Attributes(record.attributes);
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
function cloneAttributes(record, a_attributes) {
    var attributes = new record.Attributes(a_attributes);
    record.forEachAttr(attributes, function (value, name, attr) {
        attributes[name] = attr.clone(value, record);
    });
    return attributes;
}
function setAttribute(record, name, value) {
    var isRoot = begin(record), options = {}, attributes = record.attributes, spec = record._attributes[name], prev = attributes[name];
    var update;
    if (update = spec.canBeUpdated(prev, value, options)) {
        var nestedTransaction = prev._createTransaction(update, options);
        if (nestedTransaction) {
            nestedTransaction.commit(record);
            if (spec.propagateChanges) {
                markAsDirty(record, options);
                trigger3(record, 'change:' + name, record, prev, options);
            }
        }
    }
    else {
        var next = spec.transform(value, options, prev, record);
        attributes[name] = next;
        if (spec.isChanged(next, prev)) {
            spec.handleChange(next, prev, record);
            markAsDirty(record, options);
            trigger3(record, 'change:' + name, record, next, options);
        }
    }
    isRoot && commit(record);
}
exports.setAttribute = setAttribute;
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
var Record_1;
//# sourceMappingURL=transaction.js.map