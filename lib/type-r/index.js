import * as tslib_1 from "tslib";
var _a;
if (typeof Symbol === 'undefined') {
    Object.defineProperty(window, 'Symbol', { value: { iterator: 'Symbol.iterator' }, configurable: true });
}
import { define, Events, Mixable as Class } from './object-plus/';
import { ChainableAttributeSpec, Record as Model } from './record';
export * from './collection';
export * from './io-tools';
export * from './object-plus';
export * from './record';
export * from './relations';
export * from './transactions';
export { Model, Class };
export var on = (_a = Events, _a.on), off = _a.off, trigger = _a.trigger, once = _a.once, listenTo = _a.listenTo, stopListening = _a.stopListening, listenToOnce = _a.listenToOnce;
export function attributes(attrDefs) {
    var DefaultRecord = (function (_super) {
        tslib_1.__extends(DefaultRecord, _super);
        function DefaultRecord() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DefaultRecord.attributes = attrDefs;
        DefaultRecord = tslib_1.__decorate([
            define
        ], DefaultRecord);
        return DefaultRecord;
    }(Model));
    return DefaultRecord;
}
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
//# sourceMappingURL=index.js.map