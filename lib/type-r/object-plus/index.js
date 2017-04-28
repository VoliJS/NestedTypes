"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var tools = require("./tools");
exports.tools = tools;
__export(require("./mixins"));
__export(require("./messenger"));
var eventsApi = require("./eventsource");
exports.eventsApi = eventsApi;
var mixins_1 = require("./mixins");
Object.extend = function (protoProps, staticProps) { return mixins_1.Mixable.extend(protoProps, staticProps); };
Object.assign || (Object.assign = tools.assign);
Object.log = tools.log;
//# sourceMappingURL=index.js.map