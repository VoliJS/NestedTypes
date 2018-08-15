import * as tslib_1 from "tslib";
import { Messenger, tools, mixins, mixinRules, definitions, eventsApi, define } from './object-plus';
import { ValidationError } from './validation';
import { resolveReference } from './traversable';
import { abortIO } from './io-tools';
var assign = tools.assign, trigger2 = eventsApi.trigger2, trigger3 = eventsApi.trigger3, on = eventsApi.on, off = eventsApi.off;
export var ItemsBehavior;
(function (ItemsBehavior) {
    ItemsBehavior[ItemsBehavior["share"] = 1] = "share";
    ItemsBehavior[ItemsBehavior["listen"] = 2] = "listen";
    ItemsBehavior[ItemsBehavior["persistent"] = 4] = "persistent";
})(ItemsBehavior || (ItemsBehavior = {}));
var Transactional = (function () {
    function Transactional(cid) {
        this._events = void 0;
        this._changeToken = {};
        this._transaction = false;
        this._isDirty = null;
        this._owner = void 0;
        this._ownerKey = void 0;
        this._validationError = void 0;
        this.cid = this.cidPrefix + cid;
    }
    Transactional_1 = Transactional;
    Transactional.onDefine = function (definitions, BaseClass) {
        if (definitions.endpoint)
            this.prototype._endpoint = definitions.endpoint;
        Messenger.onDefine.call(this, definitions, BaseClass);
    };
    ;
    Transactional.onExtend = function (BaseClass) {
        if (BaseClass.create === this.create) {
            this.create = Transactional_1.create;
        }
    };
    Transactional.create = function (a, b) {
        return new this(a, b);
    };
    Transactional.prototype.dispose = function () {
        if (this._disposed)
            return;
        abortIO(this);
        this._owner = void 0;
        this._ownerKey = void 0;
        this.off();
        this.stopListening();
        this._disposed = true;
    };
    Transactional.prototype.initialize = function () { };
    Transactional.prototype.onChanges = function (handler, target) {
        on(this, this._changeEventName, handler, target);
    };
    Transactional.prototype.offChanges = function (handler, target) {
        off(this, this._changeEventName, handler, target);
    };
    Transactional.prototype.listenToChanges = function (target, handler) {
        this.listenTo(target, target._changeEventName, handler);
    };
    Transactional.prototype.transaction = function (fun, options) {
        if (options === void 0) { options = {}; }
        var isRoot = transactionApi.begin(this);
        var update = fun.call(this, this);
        update && this.set(update);
        isRoot && transactionApi.commit(this);
    };
    Transactional.prototype.updateEach = function (iteratee, options) {
        var isRoot = transactionApi.begin(this);
        this.each(iteratee);
        isRoot && transactionApi.commit(this);
    };
    Transactional.prototype.set = function (values, options) {
        if (values) {
            var transaction = this._createTransaction(values, options);
            transaction && transaction.commit();
        }
        return this;
    };
    Transactional.prototype.assignFrom = function (source) {
        var _this = this;
        this.transaction(function () {
            _this.set(source.__inner_state__ || source, { merge: true });
            var _changeToken = source._changeToken;
            if (_changeToken) {
                _this._changeToken = _changeToken;
            }
        });
        return this;
    };
    Transactional.prototype.parse = function (data, options) { return data; };
    Transactional.prototype.deepGet = function (reference) {
        return resolveReference(this, reference, function (object, key) { return object.get ? object.get(key) : object[key]; });
    };
    Transactional.prototype.getOwner = function () {
        return this._owner;
    };
    Transactional.prototype.getStore = function () {
        var _owner = this._owner;
        return _owner ? _owner.getStore() : this._defaultStore;
    };
    Transactional.prototype.map = function (iteratee, context) {
        var arr = [], fun = context !== void 0 ? function (v, k) { return iteratee.call(context, v, k); } : iteratee;
        this.each(function (val, key) {
            var result = fun(val, key);
            if (result !== void 0)
                arr.push(result);
        });
        return arr;
    };
    Transactional.prototype.hasPendingIO = function () { return this._ioPromise; };
    Transactional.prototype.fetch = function (options) { throw new Error("Not implemented"); };
    Transactional.prototype.getEndpoint = function () {
        return getOwnerEndpoint(this) || this._endpoint;
    };
    Transactional.prototype.mapObject = function (iteratee, context) {
        var obj = {}, fun = context !== void 0 ? function (v, k) { return iteratee.call(context, v, k); } : iteratee;
        this.each(function (val, key) {
            var result = iteratee(val, key);
            if (result !== void 0)
                obj[key] = result;
        });
        return obj;
    };
    Object.defineProperty(Transactional.prototype, "validationError", {
        get: function () {
            var error = this._validationError || (this._validationError = new ValidationError(this));
            return error.length ? error : null;
        },
        enumerable: true,
        configurable: true
    });
    Transactional.prototype.validate = function (obj) { };
    Transactional.prototype.getValidationError = function (key) {
        var error = this.validationError;
        return (key ? error && error.nested[key] : error) || null;
    };
    Transactional.prototype.deepValidationError = function (reference) {
        return resolveReference(this, reference, function (object, key) { return object.getValidationError(key); });
    };
    Transactional.prototype.eachValidationError = function (iteratee) {
        var validationError = this.validationError;
        validationError && validationError.eachError(iteratee, this);
    };
    Transactional.prototype.isValid = function (key) {
        return !this.getValidationError(key);
    };
    Transactional.prototype.valueOf = function () { return this.cid; };
    Transactional.prototype.toString = function () { return this.cid; };
    Transactional.prototype.getClassName = function () {
        var name = this.constructor.name;
        if (name !== 'Subclass')
            return name;
    };
    var Transactional_1;
    Transactional = Transactional_1 = tslib_1.__decorate([
        define,
        definitions({
            endpoint: mixinRules.value
        }),
        mixins(Messenger)
    ], Transactional);
    return Transactional;
}());
export { Transactional };
export var transactionApi = {
    begin: function (object) {
        return object._transaction ? false : (object._transaction = true);
    },
    markAsDirty: function (object, options) {
        var dirty = !options.silent;
        if (dirty)
            object._isDirty = options;
        object._changeToken = {};
        object._validationError = void 0;
        return dirty;
    },
    commit: function (object, initiator) {
        var originalOptions = object._isDirty;
        if (originalOptions) {
            while (object._isDirty) {
                var options = object._isDirty;
                object._isDirty = null;
                trigger3(object, object._changeEventName, object, options, initiator);
            }
            object._transaction = false;
            var _owner = object._owner;
            if (_owner && _owner !== initiator) {
                _owner._onChildrenChange(object, originalOptions);
            }
        }
        else {
            object._isDirty = null;
            object._transaction = false;
        }
    },
    aquire: function (owner, child, key) {
        if (!child._owner) {
            child._owner = owner;
            child._ownerKey = key;
            return true;
        }
        return child._owner === owner;
    },
    free: function (owner, child) {
        if (owner === child._owner) {
            child._owner = void 0;
            child._ownerKey = void 0;
        }
    }
};
function getOwnerEndpoint(self) {
    var collection = self.collection;
    if (collection) {
        return getOwnerEndpoint(collection);
    }
    if (self._owner) {
        var _endpoints = self._owner._endpoints;
        return _endpoints && _endpoints[self._ownerKey];
    }
}
//# sourceMappingURL=transactions.js.map