"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var commons_1 = require("./commons");
var object_plus_1 = require("../object-plus");
var transactions_1 = require("../transactions");
var trigger2 = object_plus_1.eventsApi.trigger2, trigger3 = object_plus_1.eventsApi.trigger3, markAsDirty = transactions_1.transactionApi.markAsDirty, begin = transactions_1.transactionApi.begin, commit = transactions_1.transactionApi.commit;
function removeOne(collection, el, options) {
    var model = collection.get(el);
    if (model) {
        var isRoot = begin(collection), models = collection.models;
        models.splice(models.indexOf(model), 1);
        commons_1.removeIndex(collection._byId, model);
        var notify = markAsDirty(collection, options);
        if (notify) {
            trigger3(model, 'remove', model, collection, options);
            trigger3(collection, 'remove', model, collection, options);
        }
        commons_1.free(collection, model);
        notify && trigger2(collection, 'update', collection, options);
        isRoot && commit(collection);
        return model;
    }
}
exports.removeOne = removeOne;
;
function removeMany(collection, toRemove, options) {
    var removed = _removeFromIndex(collection, toRemove);
    if (removed.length) {
        var isRoot = begin(collection);
        _reallocate(collection, removed.length);
        if (markAsDirty(collection, options)) {
            var transaction = new commons_1.CollectionTransaction(collection, isRoot, [], removed, [], false);
            transaction.commit();
        }
        else {
            isRoot && commit(collection);
        }
    }
    return removed;
}
exports.removeMany = removeMany;
;
function _removeFromIndex(collection, toRemove) {
    var removed = Array(toRemove.length), _byId = collection._byId;
    for (var i = 0, j = 0; i < toRemove.length; i++) {
        var model = collection.get(toRemove[i]);
        if (model) {
            removed[j++] = model;
            commons_1.removeIndex(_byId, model);
            commons_1.free(collection, model);
        }
    }
    removed.length = j;
    return removed;
}
function _reallocate(collection, removed) {
    var prev = collection.models, models = collection.models = Array(prev.length - removed), _byId = collection._byId;
    for (var i = 0, j = 0; i < prev.length; i++) {
        var model = prev[i];
        if (_byId[model.cid]) {
            models[j++] = model;
        }
    }
    models.length = j;
}
//# sourceMappingURL=remove.js.map