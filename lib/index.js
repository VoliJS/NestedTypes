import * as TypeR from './type-r';
export * from './type-r';
import Backbone from './backbone';
import { RestCollection, RestModel } from './rest';
import { Store as BaseStore, tools } from './type-r';
import Sync from './sync';
import { ModelMixin, CollectionMixin } from './underscore-mixin';
import { RestStore, LazyStore } from './rest-store';
export var Class = TypeR.Messenger;
var Nested = Object.create(TypeR, tools.defaults({
    'sync': linkProperty(Sync, 'sync'),
    'errorPromise': linkProperty(Sync, 'errorPromise'),
    'ajax': linkProperty(Sync, 'ajax'),
    'history': linkProperty(Backbone, 'history'),
    'store': linkProperty(BaseStore, 'global'),
    '$': {
        get: function () { return Backbone.$; },
        set: function (value) { Backbone.$ = Sync.$ = value; }
    }
}, toProps({ Backbone: Backbone, Class: Class, Model: RestModel, Collection: RestCollection, LazyStore: LazyStore, Store: RestStore, defaults: defaults }), toProps(Backbone)));
export default Nested;
export { Backbone, RestStore as Store, LazyStore, RestCollection as Collection, RestModel as Model };
export function defaults(x) {
    return Nested.Model.defaults(x);
}
export * from './backbone';
Nested.Mixable.mixins(Nested.Events);
Nested.Mixable.mixTo(Backbone.View, Backbone.Router, Backbone.History);
Nested.Record.mixins(ModelMixin);
Nested.Record.Collection.mixins(CollectionMixin);
function linkProperty(Namespace, name) {
    return {
        get: function () { return Namespace[name]; },
        set: function (value) { Namespace[name] = value; }
    };
}
function toProps(obj) {
    return tools.transform({}, obj, function (x) { return ({ value: x }); });
}
//# sourceMappingURL=index.js.map