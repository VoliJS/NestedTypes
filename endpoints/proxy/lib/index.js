import * as tslib_1 from "tslib";
export function proxyIO(record) {
    return new ProxyEndpoint(record);
}
var ProxyEndpoint = (function () {
    function ProxyEndpoint(record) {
        var _this = this;
        this.Record = record;
        var source = Object.getPrototypeOf(this.endpoint);
        Object.keys(source).forEach(function (key) {
            if (!_this[key] && typeof source[key] === 'function') {
                _this[key] = function () {
                    return source[key].apply(this.endpoint, arguments);
                };
            }
        });
    }
    Object.defineProperty(ProxyEndpoint.prototype, "endpoint", {
        get: function () {
            return this.Record.prototype._endpoint;
        },
        enumerable: true,
        configurable: true
    });
    ProxyEndpoint.prototype.subscribe = function (events, target) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2, this.endpoint.subscribe(events, target)];
            });
        });
    };
    ProxyEndpoint.prototype.unsubscribe = function (events, target) {
        this.endpoint.unsubscribe(events, target);
    };
    ProxyEndpoint.prototype.list = function (options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var coll;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        coll = new this.Record.Collection();
                        return [4, coll.fetch(options)];
                    case 1:
                        _a.sent();
                        return [2, coll.toJSON()];
                }
            });
        });
    };
    ProxyEndpoint.prototype.update = function (id, json, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var doc;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        json.id = id;
                        doc = new this.Record(json, { parse: true });
                        return [4, doc.save(options)];
                    case 1:
                        _a.sent();
                        return [2, { _cas: doc._cas }];
                }
            });
        });
    };
    ProxyEndpoint.prototype.create = function (json, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var doc;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        doc = new this.Record(json, { parse: true });
                        return [4, doc.save(options)];
                    case 1:
                        _a.sent();
                        return [2, { id: doc.id, _cas: doc._cas, _type: doc._type }];
                }
            });
        });
    };
    ProxyEndpoint.prototype.read = function (id, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var doc;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        doc = new this.Record({ id: id });
                        return [4, doc.fetch(options)];
                    case 1:
                        _a.sent();
                        return [2, doc.toJSON()];
                }
            });
        });
    };
    ProxyEndpoint.prototype.destroy = function (id, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.endpoint.destroy(id, options)];
                    case 1:
                        _a.sent();
                        return [2, {}];
                }
            });
        });
    };
    return ProxyEndpoint;
}());
export { ProxyEndpoint };
//# sourceMappingURL=index.js.map