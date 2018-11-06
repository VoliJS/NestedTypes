import * as tslib_1 from "tslib";
import { Collection, define, definitions, mixinRules, Model, tools } from 'type-r';
import * as _ from 'underscore';
import Sync from './sync';
var defaults = tools.defaults;
var RestCollection = (function (_super) {
    tslib_1.__extends(RestCollection, _super);
    function RestCollection() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RestCollection.prototype.dispose = function () {
        if (this._xhr && this._xhr.abort)
            this._xhr.abort();
        _super.prototype.dispose.call(this);
    };
    RestCollection.prototype.url = function () { return this.model.prototype.urlRoot || ''; };
    RestCollection.prototype._invalidate = function (options) {
        var error;
        if (options.validate && (error = this.validationError)) {
            this.trigger('invalid', this, error, _.extend({ validationError: error }, options));
            return true;
        }
    };
    RestCollection.prototype.fetch = function (options) {
        options = _.extend({ parse: true }, options);
        var success = options.success;
        var collection = this;
        options.success = function (resp) {
            var method = options.reset ? 'reset' : 'set';
            collection[method](resp, options);
            if (collection._invalidate(options))
                return false;
            if (success)
                success.call(options.context, collection, resp, options);
            collection.trigger('sync', collection, resp, options);
        };
        wrapError(this, options);
        return _sync('read', this, options);
    };
    RestCollection.prototype.create = function (a_model, options) {
        var _this_1 = this;
        if (options === void 0) { options = {}; }
        var model = a_model instanceof RestModel ?
            a_model :
            this.model.create(a_model, options);
        model._owner || (model._owner = this);
        options.wait || this.add([model], options);
        var collection = this;
        var success = options.success;
        options.success = function (model, resp, callbackOpts) {
            if (options.wait)
                _this_1.add([model], defaults({ parse: false }, callbackOpts));
            if (success)
                success.call(callbackOpts.context, model, resp, callbackOpts);
        };
        model.save(null, options);
        return model;
    };
    RestCollection.prototype.sync = function () {
        return Sync.sync.apply(this, arguments);
    };
    RestCollection = tslib_1.__decorate([
        define({
            itemEvents: {
                destroy: function (model) { this.remove(model); }
            }
        })
    ], RestCollection);
    return RestCollection;
}(Collection));
export { RestCollection };
;
var modelProto = Model.prototype;
var RestModel = (function (_super) {
    tslib_1.__extends(RestModel, _super);
    function RestModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RestModel.prototype._invalidate = function (options) {
        var error;
        if (options.validate && (error = this.validationError)) {
            triggerAndBubble(this, 'invalid', this, error, _.extend({ validationError: error }, options));
            return true;
        }
    };
    RestModel.prototype.dispose = function () {
        if (this._xhr && this._xhr.abort)
            this._xhr.abort();
        _super.prototype.dispose.call(this);
    };
    RestModel.prototype.fetch = function (options) {
        options = _.extend({ parse: true }, options);
        var model = this;
        var success = options.success;
        options.success = function (serverAttrs) {
            model.set(serverAttrs, options);
            if (model._invalidate(options))
                return false;
            if (success)
                success.call(options.context, model, serverAttrs, options);
            triggerAndBubble(model, 'sync', model, serverAttrs, options);
        };
        wrapError(this, options);
        return _sync('read', this, options);
    };
    RestModel.prototype.sync = function () {
        return Sync.sync.apply(this, arguments);
    };
    RestModel.prototype.save = function (key, val, a_options) {
        var _this_1 = this;
        var attrs, originalOptions;
        if (key == null || typeof key === 'object') {
            attrs = key;
            originalOptions = val || {};
        }
        else {
            (attrs = {})[key] = val;
            originalOptions = a_options || {};
        }
        var options = _.extend({ validate: true, parse: true }, originalOptions), wait = options.wait;
        if (attrs && !wait) {
            this.set(attrs, originalOptions);
        }
        if (this._invalidate(options)) {
            if (attrs && wait)
                this.set(attrs, originalOptions);
            return Sync.errorPromise(this.validationError);
        }
        var model = this;
        var success = options.success;
        var attributes = this.attributes;
        options.success = function (serverAttrs) {
            model.attributes = attributes;
            if (wait)
                serverAttrs = _.extend({}, attrs, serverAttrs);
            if (serverAttrs) {
                modelProto.set.call(_this_1, serverAttrs, options);
                if (model._invalidate(options))
                    return false;
            }
            if (success)
                success.call(options.context, model, serverAttrs, options);
            triggerAndBubble(model, 'sync', model, serverAttrs, options);
        };
        wrapError(this, options);
        if (attrs && wait)
            this.attributes = _.extend({}, attributes, attrs);
        var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
        if (method === 'patch' && !options.attrs)
            options.attrs = attrs;
        var xhr = _sync(method, this, options);
        this.attributes = attributes;
        return xhr;
    };
    RestModel.prototype.destroy = function (options) {
        options = options ? _.clone(options) : {};
        var model = this;
        var success = options.success;
        var wait = options.wait;
        var destroy = function () {
            model.stopListening();
            model.trigger('destroy', model, model.collection, options);
        };
        options.success = function (resp) {
            if (wait)
                destroy();
            if (success)
                success.call(options.context, model, resp, options);
            if (!model.isNew())
                triggerAndBubble(model, 'sync', model, resp, options);
        };
        var xhr;
        if (this.isNew()) {
            _.defer(options.success);
        }
        else {
            wrapError(this, options);
            xhr = _sync('delete', this, options);
        }
        if (!wait)
            destroy();
        return xhr || false;
    };
    RestModel.prototype.url = function () {
        var base = _.result(this, 'urlRoot') ||
            _.result(this.collection, 'url') ||
            Sync.urlError();
        if (this.isNew())
            return base;
        var id = this.get(this.idAttribute);
        return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
    };
    RestModel.prototype.set = function (a, b, c) {
        var _a;
        if (typeof a === 'string') {
            if (c) {
                return _super.prototype.set.call(this, (_a = {}, _a[a] = b, _a), c);
            }
            else {
                this[a] = b;
                return this;
            }
        }
        else {
            return _super.prototype.set.call(this, a, b);
        }
    };
    RestModel.Collection = RestCollection;
    RestModel = tslib_1.__decorate([
        define({
            urlRoot: ''
        }),
        definitions({
            urlRoot: mixinRules.protoValue
        })
    ], RestModel);
    return RestModel;
}(Model));
export { RestModel };
function _sync(method, _this, options) {
    _this._xhr && _this._xhr.abort && _this._xhr.abort();
    var xhr = _this._xhr = _this.sync(method, _this, options);
    xhr && xhr.always && xhr.always(function () { _this._xhr = void 0; });
    return xhr;
}
function wrapError(model, options) {
    var error = options.error;
    options.error = function (resp) {
        if (error)
            error.call(options.context, model, resp, options);
        triggerAndBubble(model, 'error', model, resp, options);
    };
}
function triggerAndBubble(model) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    model.trigger.apply(model, args);
    var collection = model.collection;
    collection && collection.trigger.apply(collection, args);
}
//# sourceMappingURL=rest.js.map