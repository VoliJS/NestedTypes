"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var transactions_1 = require("../transactions");
var object_plus_1 = require("../object-plus");
var EventMap = object_plus_1.eventsApi.EventMap, trigger2 = object_plus_1.eventsApi.trigger2, trigger3 = object_plus_1.eventsApi.trigger3, on = object_plus_1.eventsApi.on, off = object_plus_1.eventsApi.off, commit = transactions_1.transactionApi.commit, markAsDirty = transactions_1.transactionApi.markAsDirty, _aquire = transactions_1.transactionApi.aquire, _free = transactions_1.transactionApi.free;
function dispose(collection) {
    var models = collection.models;
    collection.models = [];
    collection._byId = {};
    freeAll(collection, models);
    return models;
}
exports.dispose = dispose;
function convertAndAquire(collection, attrs, options) {
    var model = collection.model;
    var record;
    if (collection._shared) {
        record = attrs instanceof model ? attrs : model.create(attrs, options);
        if (collection._shared & transactions_1.ItemsBehavior.listen) {
            on(record, record._changeEventName, collection._onChildrenChange, collection);
        }
    }
    else {
        record = attrs instanceof model ? (options.merge ? attrs.clone() : attrs) : model.create(attrs, options);
        if (!_aquire(collection, record)) {
            var errors = collection._aggregationError || (collection._aggregationError = []);
            errors.push(record);
        }
    }
    var _itemEvents = collection._itemEvents;
    _itemEvents && _itemEvents.subscribe(collection, record);
    return record;
}
exports.convertAndAquire = convertAndAquire;
function free(owner, child) {
    if (owner._shared) {
        if (owner._shared & transactions_1.ItemsBehavior.listen) {
            off(child, child._changeEventName, owner._onChildrenChange, owner);
        }
    }
    else {
        _free(owner, child);
    }
    var _itemEvents = owner._itemEvents;
    _itemEvents && _itemEvents.unsubscribe(owner, child);
}
exports.free = free;
function freeAll(collection, children) {
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var child = children_1[_i];
        free(collection, child);
    }
    return children;
}
exports.freeAll = freeAll;
function sortElements(collection, options) {
    var _comparator = collection._comparator;
    if (_comparator && options.sort !== false) {
        collection.models.sort(_comparator);
        return true;
    }
    return false;
}
exports.sortElements = sortElements;
function addIndex(index, model) {
    index[model.cid] = model;
    var id = model.id;
    if (id != null) {
        index[id] = model;
    }
}
exports.addIndex = addIndex;
function removeIndex(index, model) {
    delete index[model.cid];
    var id = model.id;
    if (id != null) {
        delete index[id];
    }
}
exports.removeIndex = removeIndex;
function updateIndex(index, model) {
    delete index[model.previous(model.idAttribute)];
    var id = model.id;
    id == null || (index[id] = model);
}
exports.updateIndex = updateIndex;
var CollectionTransaction = (function () {
    function CollectionTransaction(object, isRoot, added, removed, nested, sorted) {
        this.object = object;
        this.isRoot = isRoot;
        this.added = added;
        this.removed = removed;
        this.nested = nested;
        this.sorted = sorted;
    }
    CollectionTransaction.prototype.commit = function (initiator) {
        var _a = this, nested = _a.nested, object = _a.object, _isDirty = object._isDirty;
        for (var _i = 0, nested_1 = nested; _i < nested_1.length; _i++) {
            var transaction = nested_1[_i];
            transaction.commit(object);
        }
        if (object._aggregationError) {
            logAggregationError(object);
        }
        for (var _b = 0, nested_2 = nested; _b < nested_2.length; _b++) {
            var transaction = nested_2[_b];
            trigger2(object, 'change', transaction.object, _isDirty);
        }
        var _c = this, added = _c.added, removed = _c.removed;
        for (var _d = 0, added_1 = added; _d < added_1.length; _d++) {
            var record = added_1[_d];
            trigger3(record, 'add', record, object, _isDirty);
            trigger3(object, 'add', record, object, _isDirty);
        }
        for (var _e = 0, removed_1 = removed; _e < removed_1.length; _e++) {
            var record = removed_1[_e];
            trigger3(record, 'remove', record, object, _isDirty);
            trigger3(object, 'remove', record, object, _isDirty);
        }
        if (this.sorted) {
            trigger2(object, 'sort', object, _isDirty);
        }
        if (added.length || removed.length) {
            trigger2(object, 'update', object, _isDirty);
        }
        this.isRoot && commit(object, initiator);
    };
    return CollectionTransaction;
}());
exports.CollectionTransaction = CollectionTransaction;
function logAggregationError(collection) {
    collection._log('error', 'added records already have an owner', collection._aggregationError);
    collection._aggregationError = void 0;
}
exports.logAggregationError = logAggregationError;
//# sourceMappingURL=commons.js.map