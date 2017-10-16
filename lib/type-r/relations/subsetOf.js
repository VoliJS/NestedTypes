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
import { Collection } from '../collection';
import { tools, define } from '../object-plus';
import { parseReference } from './commons';
import { ChainableAttributeSpec } from '../record';
import { ItemsBehavior, transactionApi } from '../transactions';
var fastDefaults = tools.fastDefaults;
Collection.subsetOf = function subsetOf(masterCollection) {
    var SubsetOf = this._SubsetOf || (this._SubsetOf = defineSubsetCollection(this)), getMasterCollection = parseReference(masterCollection), typeSpec = new ChainableAttributeSpec({
        type: SubsetOf
    });
    return typeSpec.get(function (refs) {
        !refs || refs.resolvedWith || refs.resolve(getMasterCollection(this));
        return refs;
    });
};
var subsetOfBehavior = ItemsBehavior.share | ItemsBehavior.persistent;
function defineSubsetCollection(CollectionConstructor) {
    var SubsetOfCollection = (function (_super) {
        __extends(SubsetOfCollection, _super);
        function SubsetOfCollection(recordsOrIds, options) {
            var _this = _super.call(this, [], options, subsetOfBehavior) || this;
            _this.resolvedWith = null;
            _this.refs = toArray(recordsOrIds);
            return _this;
        }
        Object.defineProperty(SubsetOfCollection.prototype, "__inner_state__", {
            get: function () { return this.refs || this.models; },
            enumerable: true,
            configurable: true
        });
        SubsetOfCollection.prototype.add = function (a_elements, options) {
            var resolvedWith = this.resolvedWith, toAdd = toArray(a_elements);
            if (resolvedWith) {
                return _super.prototype.add.call(this, resolveRefs(resolvedWith, toAdd), options);
            }
            else {
                if (toAdd.length) {
                    var isRoot = transactionApi.begin(this);
                    this.refs = this.refs ? this.refs.concat(toAdd) : toAdd;
                    transactionApi.markAsDirty(this, options);
                    isRoot && transactionApi.commit(this);
                }
            }
        };
        SubsetOfCollection.prototype.reset = function (a_elements, options) {
            var resolvedWith = this.resolvedWith, elements = toArray(a_elements);
            return resolvedWith ?
                _super.prototype.reset.call(this, resolveRefs(resolvedWith, elements), options) :
                delaySet(this, elements, options) || [];
        };
        SubsetOfCollection.prototype._createTransaction = function (a_elements, options) {
            var resolvedWith = this.resolvedWith, elements = toArray(a_elements);
            return resolvedWith ?
                _super.prototype._createTransaction.call(this, resolveRefs(resolvedWith, elements), options) :
                delaySet(this, elements, options);
        };
        SubsetOfCollection.prototype.toJSON = function () {
            return this.refs ?
                this.refs.map(function (objOrId) { return objOrId.id || objOrId; }) :
                this.models.map(function (model) { return model.id; });
        };
        SubsetOfCollection.prototype._validateNested = function () { return 0; };
        SubsetOfCollection.prototype.clone = function (owner) {
            var Ctor = this.constructor, copy = new Ctor([], {
                model: this.model,
                comparator: this.comparator
            });
            if (this.resolvedWith) {
                copy.resolvedWith = this.resolvedWith;
                copy.reset(this.models, { silent: true });
            }
            else {
                copy.refs = this.refs;
            }
            return copy;
        };
        SubsetOfCollection.prototype.parse = function (raw) {
            return raw;
        };
        SubsetOfCollection.prototype.resolve = function (collection) {
            if (collection && collection.length) {
                this.resolvedWith = collection;
                if (this.refs) {
                    this.reset(this.refs, { silent: true });
                    this.refs = null;
                }
            }
            return this;
        };
        SubsetOfCollection.prototype.getModelIds = function () { return this.toJSON(); };
        SubsetOfCollection.prototype.toggle = function (modelOrId, val) {
            return _super.prototype.toggle.call(this, this.resolvedWith.get(modelOrId), val);
        };
        SubsetOfCollection.prototype.addAll = function () {
            if (this.resolvedWith) {
                this.set(this.resolvedWith.models);
                return this.models;
            }
            throw new Error("Cannot add elemens because the subset collection is not resolved yet.");
        };
        SubsetOfCollection.prototype.toggleAll = function () {
            return this.length ? this.reset() : this.addAll();
        };
        return SubsetOfCollection;
    }(CollectionConstructor));
    SubsetOfCollection = __decorate([
        define
    ], SubsetOfCollection);
    return SubsetOfCollection;
}
function resolveRefs(master, elements) {
    var records = [];
    for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
        var el = elements_1[_i];
        var record = master.get(el);
        if (record)
            records.push(record);
    }
    return records;
}
function delaySet(collection, elements, options) {
    if (tools.notEqual(collection.refs, elements)) {
        var isRoot = transactionApi.begin(collection);
        collection.refs = elements;
        transactionApi.markAsDirty(collection, options);
        isRoot && transactionApi.commit(collection);
    }
}
function toArray(elements) {
    return Array.isArray(elements) ? elements : [elements];
}
//# sourceMappingURL=subsetOf.js.map