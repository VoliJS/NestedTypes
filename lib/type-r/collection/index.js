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
var record_1 = require("../record");
var commons_1 = require("./commons");
var add_1 = require("./add");
var set_1 = require("./set");
var remove_1 = require("./remove");
var trigger2 = object_plus_1.eventsApi.trigger2, on = object_plus_1.eventsApi.on, off = object_plus_1.eventsApi.off, begin = transactions_1.transactionApi.begin, commit = transactions_1.transactionApi.commit, markAsDirty = transactions_1.transactionApi.markAsDirty, omit = object_plus_1.tools.omit, log = object_plus_1.tools.log, assign = object_plus_1.tools.assign, defaults = object_plus_1.tools.defaults;
var _count = 0;
var silentOptions = { silent: true };
var slice = Array.prototype.slice;
var Collection = Collection_1 = (function (_super) {
    __extends(Collection, _super);
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
            set_1.emptySetTransaction(_this, elements, options, true);
        }
        _this.initialize.apply(_this, arguments);
        if (_this._localEvents)
            _this._localEvents.subscribe(_this, _this);
        return _this;
    }
    Collection.prototype.createSubset = function (models, options) {
        var SubsetOf = this.constructor.subsetOf(this).options.type, subset = new SubsetOf(models, options);
        subset.resolve(this);
        return subset;
    };
    Collection.predefine = function () {
        var Ctor = this;
        this._SubsetOf = null;
        function RefsCollection(a, b, listen) {
            Ctor.call(this, a, b, transactions_1.ItemsBehavior.share | (listen ? transactions_1.ItemsBehavior.listen : 0));
        }
        object_plus_1.Mixable.mixTo(RefsCollection);
        RefsCollection.prototype = this.prototype;
        RefsCollection._attribute = CollectionRefsType;
        this.Refs = this.Subset = RefsCollection;
        transactions_1.Transactional.predefine.call(this);
        record_1.createSharedTypeSpec(this, record_1.SharedType);
        return this;
    };
    Collection.define = function (protoProps, staticProps) {
        if (protoProps === void 0) { protoProps = {}; }
        var staticsDefinition = object_plus_1.tools.getChangedStatics(this, 'comparator', 'model', 'itemEvents'), definition = assign(staticsDefinition, protoProps);
        var spec = omit(definition, 'itemEvents');
        if (definition.itemEvents) {
            var eventsMap = new object_plus_1.EventMap(this.prototype._itemEvents);
            eventsMap.addEventsMap(definition.itemEvents);
            spec._itemEvents = eventsMap;
        }
        return transactions_1.Transactional.define.call(this, spec, staticProps);
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
            commons_1.updateIndex(this._byId, record);
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
    Collection.prototype.some = function (iteratee, context) {
        var fun = toPredicateFunction(iteratee, context), models = this.models;
        for (var i = 0; i < models.length; i++) {
            if (fun(models[i], i))
                return true;
        }
        return false;
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
        var models = this._shared & transactions_1.ItemsBehavior.share ? this.models : this.map(function (model) { return model.clone(); }), copy = new this.constructor(models, { model: this.model, comparator: this.comparator }, this._shared);
        if (options.pinStore)
            copy._defaultStore = this.getStore();
        return copy;
    };
    Collection.prototype.toJSON = function () {
        return this.models.map(function (model) { return model.toJSON(); });
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
    Collection.prototype.dispose = function () {
        if (this._disposed)
            return;
        var aggregated = !this._shared;
        for (var _i = 0, _a = this.models; _i < _a.length; _i++) {
            var record = _a[_i];
            commons_1.free(this, record);
            if (aggregated)
                record.dispose();
        }
        _super.prototype.dispose.call(this);
    };
    Collection.prototype.reset = function (a_elements, options) {
        if (options === void 0) { options = {}; }
        var isRoot = begin(this), previousModels = commons_1.dispose(this);
        if (a_elements) {
            set_1.emptySetTransaction(this, toElements(this, a_elements, options), options, true);
        }
        markAsDirty(this, options);
        options.silent || trigger2(this, 'reset', this, defaults({ previousModels: previousModels }, options));
        isRoot && commit(this);
        return this.models;
    };
    Collection.prototype.add = function (a_elements, options) {
        if (options === void 0) { options = {}; }
        var elements = toElements(this, a_elements, options), transaction = this.models.length ?
            add_1.addTransaction(this, elements, options) :
            set_1.emptySetTransaction(this, elements, options);
        if (transaction) {
            transaction.commit();
            return transaction.added;
        }
    };
    Collection.prototype.remove = function (recordsOrIds, options) {
        if (options === void 0) { options = {}; }
        if (recordsOrIds) {
            return Array.isArray(recordsOrIds) ?
                remove_1.removeMany(this, recordsOrIds, options) :
                remove_1.removeOne(this, recordsOrIds, options);
        }
        return [];
    };
    Collection.prototype._createTransaction = function (a_elements, options) {
        if (options === void 0) { options = {}; }
        var elements = toElements(this, a_elements, options);
        if (this.models.length) {
            return options.remove === false ?
                add_1.addTransaction(this, elements, options, true) :
                set_1.setTransaction(this, elements, options);
        }
        else {
            return set_1.emptySetTransaction(this, elements, options);
        }
    };
    Collection.prototype.pluck = function (key) {
        return this.models.map(function (model) { return model[key]; });
    };
    Collection.prototype.sort = function (options) {
        if (options === void 0) { options = {}; }
        if (commons_1.sortElements(this, options)) {
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
        this.remove(model, options);
        return model;
    };
    Collection.prototype.unshift = function (model, options) {
        return this.add(model, assign({ at: 0 }, options));
    };
    Collection.prototype.shift = function (options) {
        var model = this.at(0);
        this.remove(model, options);
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
        object_plus_1.tools.log[level]("[Collection Update] " + this.model.prototype.getClassName() + "." + this.getClassName() + ": " + text, value, 'Attributes spec:', this.model.prototype._attributes);
    };
    Collection.prototype.getClassName = function () {
        return _super.prototype.getClassName.call(this) || 'Collection';
    };
    return Collection;
}(transactions_1.Transactional));
Collection._attribute = record_1.AggregatedType;
Collection = Collection_1 = __decorate([
    object_plus_1.define({
        cidPrefix: 'c',
        model: record_1.Record,
        _changeEventName: 'changes',
        _aggregationError: null
    })
], Collection);
exports.Collection = Collection;
function toElements(collection, elements, options) {
    var parsed = options.parse ? collection.parse(elements, options) : elements;
    return Array.isArray(parsed) ? parsed : [parsed];
}
var CollectionRefsType = (function (_super) {
    __extends(CollectionRefsType, _super);
    function CollectionRefsType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CollectionRefsType;
}(record_1.SharedType));
CollectionRefsType.defaultValue = [];
record_1.createSharedTypeSpec(Collection, record_1.SharedType);
record_1.Record.Collection = Collection;
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
var Collection_1;
//# sourceMappingURL=index.js.map