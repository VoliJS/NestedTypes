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
export * from './object-plus';
export * from './collection';
export * from './relations';
export * from './record';
import { Events } from './object-plus/';
export var on = (_a = Events, _a.on), off = _a.off, trigger = _a.trigger, once = _a.once, listenTo = _a.listenTo, stopListening = _a.stopListening, listenToOnce = _a.listenToOnce;
import { Record as Model } from './record';
import { define, Mixable as Class } from './object-plus/';
export { Model, Class };
export function attributes(attrDefs) {
    var DefaultRecord = (function (_super) {
        __extends(DefaultRecord, _super);
        function DefaultRecord() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return DefaultRecord;
    }(Model));
    DefaultRecord.attributes = attrDefs;
    DefaultRecord = __decorate([
        define
    ], DefaultRecord);
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
var _a;
//# sourceMappingURL=index.js.map