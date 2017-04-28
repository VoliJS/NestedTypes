"use strict";
var Nested = require("./type-r");
var Backbone = require("./backbone");
var rest_1 = require("./rest");
var type_r_1 = require("./type-r");
var Sync = require("./sync");
var underscore_mixin_1 = require("./underscore-mixin");
var rest_store_1 = require("./rest-store");
Nested.Mixable.mixins(Nested.Events);
Nested.Mixable.mixTo(Backbone.View, Backbone.Router, Backbone.History);
Nested.Record.mixins(underscore_mixin_1.ModelMixin);
Nested.Record.Collection.mixins(underscore_mixin_1.CollectionMixin);
var assign = Nested.tools.assign;
Object.defineProperties(Nested, {
    'emulateHTTP': linkProperty(Backbone, 'emulateHTTP'),
    'emulateJSON': linkProperty(Backbone, 'emulateJSON'),
    'sync': linkProperty(Sync, 'sync'),
    'errorPromise': linkProperty(Sync, 'errorPromise'),
    'ajax': linkProperty(Sync, 'ajax'),
    'history': linkProperty(Backbone, 'history'),
    'store': linkProperty(type_r_1.Store, 'global'),
    '$': {
        get: function () { return Backbone.$; },
        set: function (value) { Backbone.$ = Sync.$ = value; }
    }
});
assign(Nested, Backbone, {
    Backbone: Backbone,
    Class: Nested.Messenger,
    Model: rest_1.RestModel,
    Collection: rest_1.RestCollection,
    LazyStore: rest_store_1.LazyStore,
    Store: rest_store_1.RestStore,
    defaults: function (x) {
        return Nested.Model.defaults(x);
    },
    default: Nested
});
function linkProperty(Namespace, name) {
    return {
        get: function () { return Namespace[name]; },
        set: function (value) { Namespace[name] = value; }
    };
}
module.exports = Nested;
//# sourceMappingURL=index.js.map