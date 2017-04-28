"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var transactions_1 = require("../transactions");
var commons_1 = require("./commons");
var begin = transactions_1.transactionApi.begin, commit = transactions_1.transactionApi.commit, markAsDirty = transactions_1.transactionApi.markAsDirty;
function addTransaction(collection, items, options, merge) {
    var isRoot = begin(collection), nested = [];
    var added = appendElements(collection, items, nested, options, merge);
    if (added.length || nested.length) {
        var needSort = sortOrMoveElements(collection, added, options);
        if (markAsDirty(collection, options)) {
            return new commons_1.CollectionTransaction(collection, isRoot, added, [], nested, needSort);
        }
        if (collection._aggregationError)
            commons_1.logAggregationError(collection);
    }
    isRoot && commit(collection);
}
exports.addTransaction = addTransaction;
;
function sortOrMoveElements(collection, added, options) {
    var at = options.at;
    if (at != null) {
        var length_1 = collection.models.length - added.length;
        at = Number(at);
        if (at < 0)
            at += length_1 + 1;
        if (at < 0)
            at = 0;
        if (at > length_1)
            at = length_1;
        moveElements(collection.models, at, added);
        return false;
    }
    return commons_1.sortElements(collection, options);
}
function moveElements(source, at, added) {
    for (var j = source.length - 1, i = j - added.length; i >= at; i--, j--) {
        source[j] = source[i];
    }
    for (i = 0, j = at; i < added.length; i++, j++) {
        source[j] = added[i];
    }
}
function appendElements(collection, a_items, nested, a_options, forceMerge) {
    var _byId = collection._byId, models = collection.models, merge = (forceMerge || a_options.merge) && !collection._shared, parse = a_options.parse, idAttribute = collection.model.prototype.idAttribute, prevLength = models.length;
    for (var _i = 0, a_items_1 = a_items; _i < a_items_1.length; _i++) {
        var item = a_items_1[_i];
        var model = item ? _byId[item[idAttribute]] || _byId[item.cid] : null;
        if (model) {
            if (merge && item !== model) {
                var attrs = item.attributes || item;
                var transaction = model._createTransaction(attrs, a_options);
                transaction && nested.push(transaction);
                if (model.hasChanged(idAttribute)) {
                    commons_1.updateIndex(_byId, model);
                }
            }
        }
        else {
            model = commons_1.convertAndAquire(collection, item, a_options);
            models.push(model);
            commons_1.addIndex(_byId, model);
        }
    }
    return models.slice(prevLength);
}
//# sourceMappingURL=add.js.map