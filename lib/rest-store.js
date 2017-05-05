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
import Backbone from './backbone';
import * as _ from 'underscore';
import { mixins, mixinRules, define, Store } from './type-r';
import { RestModel, RestCollection } from './rest';
var RestStore = (function (_super) {
    __extends(RestStore, _super);
    function RestStore() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return RestStore;
}(RestModel));
RestStore = __decorate([
    define({}),
    mixins(Store),
    mixinRules({ get: 'overwrite', getStore: 'overwrite' })
], RestStore);
export { RestStore };
var LazyStore = (function (_super) {
    __extends(LazyStore, _super);
    function LazyStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._resolved = {};
        return _this;
    }
    LazyStore.prototype.initialize = function () {
        var _this = this;
        this.each(function (element, name) {
            if (!element)
                return;
            element.store = _this;
            var fetch = element.fetch;
            if (fetch) {
                var self_1 = _this;
                element.fetch = function () {
                    return self_1._resolved[name] = fetch.apply(this, arguments);
                };
            }
            if (element instanceof RestCollection && element.length) {
                _this._resolved[name] = true;
            }
        });
    };
    LazyStore.prototype.fetch = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var xhr = [], objsToFetch = args.length ? args : this.keys();
        for (var _a = 0, objsToFetch_1 = objsToFetch; _a < objsToFetch_1.length; _a++) {
            var name_1 = objsToFetch_1[_a];
            var attr = this.attributes[name_1];
            attr && attr.fetch && xhr.push(attr.fetch());
        }
        var $ = Backbone.$;
        return $ && $.when && $.when.apply($, xhr);
    };
    LazyStore.prototype.fetchOnce = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var xhr = [], self = this, objsToFetch = args.length ? args : this.keys();
        for (var _a = 0, objsToFetch_2 = objsToFetch; _a < objsToFetch_2.length; _a++) {
            var name_2 = objsToFetch_2[_a];
            var attr = self.attributes[name_2];
            xhr.push(self._resolved[name_2] || attr && attr.fetch && attr.fetch());
        }
        var $ = Backbone.$;
        return $ && $.when && $.when.apply($, xhr);
    };
    LazyStore.prototype.clear = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var objsToClear = args.length ? args : this.keys();
        for (var _a = 0, objsToClear_1 = objsToClear; _a < objsToClear_1.length; _a++) {
            var name_3 = objsToClear_1[_a];
            var element = this.attributes[name_3];
            if (element instanceof RestCollection) {
                element.reset();
            }
            else if (element instanceof Store) {
                element.clear();
            }
            else if (element instanceof RestModel) {
                element.set(element.defaults());
            }
            this._resolved[name_3] = false;
        }
        return this;
    };
    LazyStore.define = function (props, staticProps) {
        var attributes = props.defaults || props.attributes;
        _.each(attributes, function (Type, name) {
            if (Type.has) {
                attributes[name] = Type.has
                    .set(function (value) {
                    if (!value || !value.length) {
                        var resolved = this._resolved || (this._resolved = {});
                        resolved[name] = false;
                    }
                    return value;
                });
            }
        });
        return RestModel.define.call(this, props, staticProps);
    };
    return LazyStore;
}(RestStore));
LazyStore = __decorate([
    define({})
], LazyStore);
export { LazyStore };
//# sourceMappingURL=rest-store.js.map