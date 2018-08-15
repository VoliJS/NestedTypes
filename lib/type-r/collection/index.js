import * as tslib_1 from "tslib";
import { define, tools, eventsApi, EventMap, definitions, mixinRules, Mixable } from '../object-plus';
import { ItemsBehavior, transactionApi, Transactional } from '../transactions';
import { Record, SharedType, AggregatedType, createSharedTypeSpec } from '../record';
import { free, sortElements, updateIndex } from './commons';
import { addTransaction } from './add';
import { setTransaction, emptySetTransaction } from './set';
import { removeOne, removeMany } from './remove';
import { startIO } from '../io-tools';
var trigger2 = eventsApi.trigger2, on = eventsApi.on, off = eventsApi.off, begin = transactionApi.begin, commit = transactionApi.commit, markAsDirty = transactionApi.markAsDirty, omit = tools.omit, log = tools.log, assign = tools.assign, defaults = tools.defaults, assignToClassProto = tools.assignToClassProto;
var _count = 0;
var slice = Array.prototype.slice;
var CollectionRefsType = (function (_super) {
    tslib_1.__extends(CollectionRefsType, _super);
    function CollectionRefsType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CollectionRefsType.defaultValue = [];
    return CollectionRefsType;
}(SharedType));
var Collection = (function (_super) {
    tslib_1.__extends(Collection, _super);
    function Collection(records, options, shared) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, _count++) || this;
        _this.models = [];
        _this._byId = {};
        _this.comparator = _this.comparator;
        if (options.comparator !== void 0) {
            _this.comparator = options.comparator;
            options.comparator = void 0;
        }
        _this.model = _this.model;
        if (options.model) {
            _this.model = options.model;
            options.model = void 0;
        }
        _this.idAttribute = _this.model.prototype.idAttribute;
        _this._shared = shared || 0;
        if (records) {
            var elements = toElements(_this, records, options);
            emptySetTransaction(_this, elements, options, true);
        }
        _this.initialize.apply(_this, arguments);
        if (_this._localEvents)
            _this._localEvents.subscribe(_this, _this);
        return _this;
    }
    Collection_1 = Collection;
    Collection.prototype.createSubset = function (models, options) {
        var SubsetOf = this.constructor.subsetOf(this).options.type, subset = new SubsetOf(models, options);
        subset.resolve(this);
        return subset;
    };
    Collection.onExtend = function (BaseClass) {
        var Ctor = this;
        this._SubsetOf = null;
        function RefsCollection(a, b, listen) {
            Ctor.call(this, a, b, ItemsBehavior.share | (listen ? ItemsBehavior.listen : 0));
        }
        Mixable.mixins.populate(RefsCollection);
        RefsCollection.prototype = this.prototype;
        RefsCollection._attribute = CollectionRefsType;
        this.Refs = this.Subset = RefsCollection;
        Transactional.onExtend.call(this, BaseClass);
        createSharedTypeSpec(this, SharedType);
    };
    Collection.onDefine = function (definition, BaseClass) {
        if (definition.itemEvents) {
            var eventsMap = new EventMap(BaseClass.prototype._itemEvents);
            eventsMap.addEventsMap(definition.itemEvents);
            this.prototype._itemEvents = eventsMap;
        }
        if (definition.comparator !== void 0)
            this.prototype.comparator = definition.comparator;
        Transactional.onDefine.call(this, definition);
    };
    Object.defineProperty(Collection.prototype, "__inner_state__", {
        get: function () { return this.models; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Collection.prototype, "comparator", {
        get: function () { return this._comparator; },
        set: function (x) {
            var _this = this;
            var compare;
            switch (typeof x) {
                case 'string':
                    this._comparator = function (a, b) {
                        var aa = a[x], bb = b[x];
                        if (aa === bb)
                            return 0;
                        return aa < bb ? -1 : +1;
                    };
                    break;
                case 'function':
                    if (x.length === 1) {
                        this._comparator = function (a, b) {
                            var aa = x.call(_this, a), bb = x.call(_this, b);
                            if (aa === bb)
                                return 0;
                            return aa < bb ? -1 : +1;
                        };
                    }
                    else {
                        this._comparator = function (a, b) { return x.call(_this, a, b); };
                    }
                    break;
                default:
                    this._comparator = null;
            }
        },
        enumerable: true,
        configurable: true
    });
    Collection.prototype.getStore = function () {
        return this._store || (this._store = this._owner ? this._owner.getStore() : this._defaultStore);
    };
    Collection.prototype._onChildrenChange = function (record, options, initiator) {
        if (options === void 0) { options = {}; }
        if (initiator === this)
            return;
        var idAttribute = this.idAttribute;
        if (record.hasChanged(idAttribute)) {
            updateIndex(this._byId, record);
        }
        var isRoot = begin(this);
        if (markAsDirty(this, options)) {
            trigger2(this, 'change', record, options);
        }
        isRoot && commit(this);
    };
    Collection.prototype.get = function (objOrId) {
        if (objOrId == null)
            return;
        if (typeof objOrId === 'object') {
            var id = objOrId[this.idAttribute];
            return (id !== void 0 && this._byId[id]) || this._byId[objOrId.cid];
        }
        else {
            return this._byId[objOrId];
        }
    };
    Collection.prototype.each = function (iteratee, context) {
        var fun = bindContext(iteratee, context), models = this.models;
        for (var i = 0; i < models.length; i++) {
            fun(models[i], i);
        }
    };
    Collection.prototype.forEach = function (iteratee, context) {
        return this.each(iteratee, context);
    };
    Collection.prototype.every = function (iteratee, context) {
        var fun = toPredicateFunction(iteratee, context), models = this.models;
        for (var i = 0; i < models.length; i++) {
            if (!fun(models[i], i))
                return false;
        }
        return true;
    };
    Collection.prototype.filter = function (iteratee, context) {
        var fun = toPredicateFunction(iteratee, context), models = this.models;
        return this.map(function (x, i) { return fun(x, i) ? x : void 0; });
    };
    Collection.prototype.find = function (iteratee, context) {
        var fun = toPredicateFunction(iteratee, context), models = this.models;
        for (var i = 0; i < models.length; i++) {
            if (fun(models[i], i))
                return models[i];
        }
        return null;
    };
    Collection.prototype.some = function (iteratee, context) {
        return Boolean(this.find(iteratee, context));
    };
    Collection.prototype.map = function (iteratee, context) {
        var fun = bindContext(iteratee, context), models = this.models, mapped = Array(models.length);
        var j = 0;
        for (var i = 0; i < models.length; i++) {
            var x = fun(models[i], i);
            x === void 0 || (mapped[j++] = x);
        }
        mapped.length = j;
        return mapped;
    };
    Collection.prototype._validateNested = function (errors) {
        if (this._shared)
            return 0;
        var count = 0;
        this.each(function (record) {
            var error = record.validationError;
            if (error) {
                errors[record.cid] = error;
                count++;
            }
        });
        return count;
    };
    Collection.prototype.initialize = function () { };
    Object.defineProperty(Collection.prototype, "length", {
        get: function () { return this.models.length; },
        enumerable: true,
        configurable: true
    });
    Collection.prototype.first = function () { return this.models[0]; };
    Collection.prototype.last = function () { return this.models[this.models.length - 1]; };
    Collection.prototype.at = function (a_index) {
        var index = a_index < 0 ? a_index + this.models.length : a_index;
        return this.models[index];
    };
    Collection.prototype.clone = function (options) {
        if (options === void 0) { options = {}; }
        var models = this._shared & ItemsBehavior.share ? this.models : this.map(function (model) { return model.clone(); }), copy = new this.constructor(models, { model: this.model, comparator: this.comparator }, this._shared);
        if (options.pinStore)
            copy._defaultStore = this.getStore();
        return copy;
    };
    Collection.prototype.toJSON = function (options) {
        return this.models.map(function (model) { return model.toJSON(options); });
    };
    Collection.prototype.set = function (elements, options) {
        if (elements === void 0) { elements = []; }
        if (options === void 0) { options = {}; }
        if (options.add !== void 0) {
            this._log('warn', "Collection.set doesn't support 'add' option, behaving as if options.add === true.", options);
        }
        if (options.reset) {
            this.reset(elements, options);
        }
        else {
            var transaction = this._createTransaction(elements, options);
            transaction && transaction.commit();
        }
        return this;
    };
    Collection.prototype.liveUpdates = function (enabled) {
        var _this = this;
        if (enabled) {
            this.liveUpdates(false);
            var filter_1 = typeof enabled === 'function' ? enabled : function () { return true; };
            this._liveUpdates = {
                updated: function (json) {
                    filter_1(json) && _this.add(json, { parse: true, merge: true });
                },
                removed: function (id) { return _this.remove(id); }
            };
            return this.getEndpoint().subscribe(this._liveUpdates, this).then(function () { return _this; });
        }
        else {
            if (this._liveUpdates) {
                this.getEndpoint().unsubscribe(this._liveUpdates, this);
                this._liveUpdates = null;
            }
        }
    };
    Collection.prototype.fetch = function (a_options) {
        var _this = this;
        if (a_options === void 0) { a_options = {}; }
        var options = tslib_1.__assign({ parse: true }, a_options), endpoint = this.getEndpoint();
        return startIO(this, endpoint.list(options, this), options, function (json) {
            var result = _this.set(json, tslib_1.__assign({ parse: true }, options));
            if (options.liveUpdates) {
                result = _this.liveUpdates(options.liveUpdates);
            }
            return result;
        });
    };
    Collection.prototype.dispose = function () {
        if (this._disposed)
            return;
        var aggregated = !this._shared;
        for (var _i = 0, _a = this.models; _i < _a.length; _i++) {
            var record = _a[_i];
            free(this, record);
            if (aggregated)
                record.dispose();
        }
        this.liveUpdates(false);
        _super.prototype.dispose.call(this);
    };
    Collection.prototype.reset = function (a_elements, options) {
        if (options === void 0) { options = {}; }
        var isRoot = begin(this), previousModels = this.models;
        if (a_elements) {
            emptySetTransaction(this, toElements(this, a_elements, options), options, true);
        }
        else {
            this._byId = {};
            this.models = [];
        }
        markAsDirty(this, options);
        options.silent || trigger2(this, 'reset', this, defaults({ previousModels: previousModels }, options));
        var _byId = this._byId;
        for (var _i = 0, previousModels_1 = previousModels; _i < previousModels_1.length; _i++) {
            var toDispose = previousModels_1[_i];
            _byId[toDispose.cid] || free(this, toDispose);
        }
        isRoot && commit(this);
        return this.models;
    };
    Collection.prototype.add = function (a_elements, options) {
        if (options === void 0) { options = {}; }
        var elements = toElements(this, a_elements, options), transaction = this.models.length ?
            addTransaction(this, elements, options) :
            emptySetTransaction(this, elements, options);
        if (transaction) {
            transaction.commit();
            return transaction.added;
        }
    };
    Collection.prototype.remove = function (recordsOrIds, options) {
        if (options === void 0) { options = {}; }
        if (recordsOrIds) {
            return Array.isArray(recordsOrIds) ?
                removeMany(this, recordsOrIds, options) :
                removeOne(this, recordsOrIds, options);
        }
        return [];
    };
    Collection.prototype._createTransaction = function (a_elements, options) {
        if (options === void 0) { options = {}; }
        var elements = toElements(this, a_elements, options);
        if (this.models.length) {
            return options.remove === false ?
                addTransaction(this, elements, options, true) :
                setTransaction(this, elements, options);
        }
        else {
            return emptySetTransaction(this, elements, options);
        }
    };
    Collection.prototype.pluck = function (key) {
        return this.models.map(function (model) { return model[key]; });
    };
    Collection.prototype.sort = function (options) {
        if (options === void 0) { options = {}; }
        if (sortElements(this, options)) {
            var isRoot = begin(this);
            if (markAsDirty(this, options)) {
                trigger2(this, 'sort', this, options);
            }
            isRoot && commit(this);
        }
        return this;
    };
    Collection.prototype.push = function (model, options) {
        return this.add(model, assign({ at: this.length }, options));
    };
    Collection.prototype.pop = function (options) {
        var model = this.at(this.length - 1);
        this.remove(model, tslib_1.__assign({ unset: true }, options));
        return model;
    };
    Collection.prototype.unset = function (modelOrId, options) {
        var value = this.get(modelOrId);
        this.remove(modelOrId, tslib_1.__assign({ unset: true }, options));
        return value;
    };
    Collection.prototype.unshift = function (model, options) {
        return this.add(model, assign({ at: 0 }, options));
    };
    Collection.prototype.shift = function (options) {
        var model = this.at(0);
        this.remove(model, tslib_1.__assign({ unset: true }, options));
        return model;
    };
    Collection.prototype.slice = function () {
        return slice.apply(this.models, arguments);
    };
    Collection.prototype.indexOf = function (modelOrId) {
        var record = this.get(modelOrId);
        return this.models.indexOf(record);
    };
    Collection.prototype.modelId = function (attrs) {
        return attrs[this.model.prototype.idAttribute];
    };
    Collection.prototype.toggle = function (model, a_next) {
        var prev = Boolean(this.get(model)), next = a_next === void 0 ? !prev : Boolean(a_next);
        if (prev !== next) {
            if (prev) {
                this.remove(model);
            }
            else {
                this.add(model);
            }
        }
        return next;
    };
    Collection.prototype._log = function (level, text, value) {
        tools.log(level, "[Collection Update] " + this.model.prototype.getClassName() + "." + this.getClassName() + ": " + text, {
            Argument: value,
            'Attributes spec': this.model.prototype._attributes
        });
    };
    Collection.prototype.getClassName = function () {
        return _super.prototype.getClassName.call(this) || 'Collection';
    };
    var Collection_1;
    Collection._attribute = AggregatedType;
    Collection = Collection_1 = tslib_1.__decorate([
        define({
            cidPrefix: 'c',
            model: Record,
            _changeEventName: 'changes',
            _aggregationError: null
        }),
        definitions({
            comparator: mixinRules.value,
            model: mixinRules.protoValue,
            itemEvents: mixinRules.merge
        })
    ], Collection);
    return Collection;
}(Transactional));
export { Collection };
function toElements(collection, elements, options) {
    var parsed = options.parse ? collection.parse(elements, options) : elements;
    return Array.isArray(parsed) ? parsed : [parsed];
}
createSharedTypeSpec(Collection, SharedType);
Record.Collection = Collection;
function bindContext(fun, context) {
    return context !== void 0 ? function (v, k) { return fun.call(context, v, k); } : fun;
}
function toPredicateFunction(iteratee, context) {
    if (typeof iteratee === 'object') {
        return function (x) {
            for (var key in iteratee) {
                if (iteratee[key] !== x[key])
                    return false;
            }
            return true;
        };
    }
    return bindContext(iteratee, context);
}
//# sourceMappingURL=index.js.map