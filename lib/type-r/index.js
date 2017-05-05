export * from './object-plus';
export * from './collection';
export * from './relations';
export * from './record';
import { Events } from './object-plus/';
export var on = (_a = Events, _a.on), off = _a.off, trigger = _a.trigger, once = _a.once, listenTo = _a.listenTo, stopListening = _a.stopListening, listenToOnce = _a.listenToOnce;
import { Record as Model } from './record';
import { Mixable as Class } from './object-plus/';
export { Model, Class };
import { ChainableAttributeSpec } from './record';
export function value(x) {
    return new ChainableAttributeSpec({ value: x });
}
export function transaction(method) {
    return function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var result;
        this.transaction(function () {
            result = method.apply(_this, args);
        });
        return result;
    };
}
var _a;
//# sourceMappingURL=index.js.map