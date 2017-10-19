import { free, CollectionTransaction, removeIndex } from './commons';
import { eventsApi } from '../object-plus';
import { transactionApi } from '../transactions';
var trigger2 = eventsApi.trigger2, trigger3 = eventsApi.trigger3, markAsDirty = transactionApi.markAsDirty, begin = transactionApi.begin, commit = transactionApi.commit;
export function removeOne(collection, el, options) {
    var model = collection.get(el);
    if (model) {
        var isRoot = begin(collection), models = collection.models;
        models.splice(models.indexOf(model), 1);
        removeIndex(collection._byId, model);
        var notify = markAsDirty(collection, options);
        if (notify) {
            trigger3(model, 'remove', model, collection, options);
            trigger3(collection, 'remove', model, collection, options);
        }
        free(collection, model, options.unset);
        notify && trigger2(collection, 'update', collection, options);
        isRoot && commit(collection);
        return model;
    }
}
;
export function removeMany(collection, toRemove, options) {
    var removed = _removeFromIndex(collection, toRemove, options.unset);
    if (removed.length) {
        var isRoot = begin(collection);
        _reallocate(collection, removed.length);
        if (markAsDirty(collection, options)) {
            var transaction = new CollectionTransaction(collection, isRoot, [], removed, [], false);
            transaction.commit();
        }
        else {
            isRoot && commit(collection);
        }
    }
    return removed;
}
;
function _removeFromIndex(collection, toRemove, unset) {
    var removed = Array(toRemove.length), _byId = collection._byId;
    for (var i = 0, j = 0; i < toRemove.length; i++) {
        var model = collection.get(toRemove[i]);
        if (model) {
            removed[j++] = model;
            removeIndex(_byId, model);
            free(collection, model, unset);
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