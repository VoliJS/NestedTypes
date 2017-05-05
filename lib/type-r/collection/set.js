import { transactionApi } from '../transactions';
import { CollectionTransaction, logAggregationError, convertAndAquire, free, sortElements, addIndex, freeAll } from './commons';
var begin = transactionApi.begin, commit = transactionApi.commit, markAsDirty = transactionApi.markAsDirty;
var silentOptions = { silent: true };
export function emptySetTransaction(collection, items, options, silent) {
    var isRoot = begin(collection);
    var added = _reallocateEmpty(collection, items, options);
    if (added.length) {
        var needSort = sortElements(collection, options);
        if (markAsDirty(collection, silent ? silentOptions : options)) {
            return new CollectionTransaction(collection, isRoot, added.slice(), [], [], needSort);
        }
        if (collection._aggregationError)
            logAggregationError(collection);
    }
    isRoot && commit(collection);
}
;
export function setTransaction(collection, items, options) {
    var isRoot = begin(collection), nested = [];
    var previous = collection.models, added = _reallocate(collection, items, nested, options);
    var reusedCount = collection.models.length - added.length, removed = reusedCount < previous.length ? (reusedCount ? _garbageCollect(collection, previous) :
        freeAll(collection, previous)) : [];
    var addedOrChanged = nested.length || added.length, sorted = (sortElements(collection, options) && addedOrChanged) || added.length || options.sorted;
    if (addedOrChanged || removed.length || sorted) {
        if (markAsDirty(collection, options)) {
            return new CollectionTransaction(collection, isRoot, added, removed, nested, sorted);
        }
        if (collection._aggregationError)
            logAggregationError(collection);
    }
    isRoot && commit(collection);
}
;
function _garbageCollect(collection, previous) {
    var _byId = collection._byId, removed = [];
    for (var _i = 0, previous_1 = previous; _i < previous_1.length; _i++) {
        var record = previous_1[_i];
        if (!_byId[record.cid]) {
            removed.push(record);
            free(collection, record);
        }
    }
    return removed;
}
function _reallocate(collection, source, nested, options) {
    var models = Array(source.length), _byId = {}, merge = (options.merge == null ? true : options.merge) && !collection._shared, _prevById = collection._byId, prevModels = collection.models, idAttribute = collection.model.prototype.idAttribute, toAdd = [], orderKept = true;
    for (var i = 0, j = 0; i < source.length; i++) {
        var item = source[i], model = null;
        if (item) {
            var id = item[idAttribute], cid = item.cid;
            if (_byId[id] || _byId[cid])
                continue;
            model = _prevById[id] || _prevById[cid];
        }
        if (model) {
            if (merge && item !== model) {
                if (orderKept && prevModels[j] !== model)
                    orderKept = false;
                var attrs = item.attributes || item;
                var transaction = model._createTransaction(attrs, options);
                transaction && nested.push(transaction);
            }
        }
        else {
            model = convertAndAquire(collection, item, options);
            toAdd.push(model);
        }
        models[j++] = model;
        addIndex(_byId, model);
    }
    models.length = j;
    collection.models = models;
    collection._byId = _byId;
    if (!orderKept)
        options.sorted = true;
    return toAdd;
}
function _reallocateEmpty(self, source, options) {
    var len = source ? source.length : 0, models = Array(len), _byId = {}, idAttribute = self.model.prototype.idAttribute;
    for (var i = 0, j = 0; i < len; i++) {
        var src = source[i];
        if (src && (_byId[src[idAttribute]] || _byId[src.cid])) {
            continue;
        }
        var model = convertAndAquire(self, src, options);
        models[j++] = model;
        addIndex(_byId, model);
    }
    models.length = j;
    self._byId = _byId;
    return self.models = models;
}
//# sourceMappingURL=set.js.map