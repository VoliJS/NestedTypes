import * as tslib_1 from "tslib";
var _a;
import { tools } from './object-plus';
Object.setPrototypeOf || (Object.setPrototypeOf = tools.defaults);
export * from './object-plus';
export * from './collection';
export * from './relations';
export * from './record';
export * from './transactions';
export * from './io-tools';
import { Events } from './object-plus/';
export var on = (_a = Events, _a.on), off = _a.off, trigger = _a.trigger, once = _a.once, listenTo = _a.listenTo, stopListening = _a.stopListening, listenToOnce = _a.listenToOnce;
import { Record as Model } from './record';
import { define, Mixable as Class } from './object-plus/';
export { Model, Class };
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
//# sourceMappingURL=index.js.map