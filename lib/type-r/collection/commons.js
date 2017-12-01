import { ItemsBehavior, transactionApi } from '../transactions';
import { eventsApi } from '../object-plus';
var EventMap = eventsApi.EventMap, trigger2 = eventsApi.trigger2, trigger3 = eventsApi.trigger3, on = eventsApi.on, off = eventsApi.off, commit = transactionApi.commit, markAsDirty = transactionApi.markAsDirty, _aquire = transactionApi.aquire, _free = transactionApi.free;
export function dispose(collection) {
    var models = collection.models;
    collection.models = [];
    collection._byId = {};
    freeAll(collection, models);
    return models;
}
export function convertAndAquire(collection, attrs, options) {
    var model = collection.model;
    var record;
    if (collection._shared) {
        record = attrs instanceof model ? attrs : model.create(attrs, options);
        if (collection._shared & ItemsBehavior.listen) {
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
export function free(owner, child, unset) {
    if (owner._shared) {
        if (owner._shared & ItemsBehavior.listen) {
            off(child, child._changeEventName, owner._onChildrenChange, owner);
        }
    }
    else {
        _free(owner, child);
        unset || child.dispose();
    }
    var _itemEvents = owner._itemEvents;
    _itemEvents && _itemEvents.unsubscribe(owner, child);
}
export function freeAll(collection, children) {
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var child = children_1[_i];
        free(collection, child);
    }
    return children;
}
export function sortElements(collection, options) {
    var _comparator = collection._comparator;
    if (_comparator && options.sort !== false) {
        collection.models.sort(_comparator);
        return true;
    }
    return false;
}
export function addIndex(index, model) {
    index[model.cid] = model;
    var id = model.id;
    if (id || id === 0) {
        index[id] = model;
    }
}
export function removeIndex(index, model) {
    delete index[model.cid];
    var id = model.id;
    if (id || id === 0) {
        delete index[id];
    }
}
export function updateIndex(index, model) {
    delete index[model.previous(model.idAttribute)];
    var id = model.id;
    id == null || (index[id] = model);
}
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
export { CollectionTransaction };
export function logAggregationError(collection) {
    collection._log('error', 'added records already have an owner', collection._aggregationError);
    collection._aggregationError = void 0;
}
//# sourceMappingURL=commons.js.map