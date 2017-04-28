"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./object-plus"));
__export(require("./collection"));
__export(require("./relations"));
__export(require("./record"));
var _1 = require("./object-plus/");
exports.on = (_a = _1.Events, _a.on), exports.off = _a.off, exports.trigger = _a.trigger, exports.once = _a.once, exports.listenTo = _a.listenTo, exports.stopListening = _a.stopListening, exports.listenToOnce = _a.listenToOnce;
var record_1 = require("./record");
exports.Model = record_1.Record;
var _2 = require("./object-plus/");
exports.Class = _2.Mixable;
var record_2 = require("./record");
function value(x) {
    return new record_2.ChainableAttributeSpec({ value: x });
}
exports.value = value;
function transaction(method) {
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
exports.transaction = transaction;
var _a;
//# sourceMappingURL=index.js.map