import { createIOPromise } from 'type-r';
export function create(init, delay) {
    if (init === void 0) { init = []; }
    if (delay === void 0) { delay = 50; }
    return new MemoryEndpoint(init, delay);
}
export { create as memoryIO };
var MemoryEndpoint = (function () {
    function MemoryEndpoint(init, delay) {
        this.delay = delay;
        this.index = [0];
        this.items = {};
        for (var _i = 0, init_1 = init; _i < init_1.length; _i++) {
            var obj = init_1[_i];
            this.create(obj, {});
        }
    }
    MemoryEndpoint.prototype.resolve = function (value) {
        var _this = this;
        return createIOPromise(function (resolve, reject) {
            setTimeout(function () { return resolve(value); }, _this.delay);
        });
    };
    MemoryEndpoint.prototype.reject = function (value) {
        var _this = this;
        return createIOPromise(function (resolve, reject) {
            setTimeout(function () { return reject(value); }, _this.delay);
        });
    };
    MemoryEndpoint.prototype.generateId = function (a_id) {
        var id = Number(a_id);
        if (!isNaN(id)) {
            this.index[0] = Math.max(this.index[0], id);
        }
        return a_id || String(this.index[0]++);
    };
    MemoryEndpoint.prototype.create = function (json, options) {
        var id = json.id = this.generateId(json.id);
        this.index.push(id);
        this.items[id] = json;
        return this.resolve({ id: id });
    };
    MemoryEndpoint.prototype.update = function (id, json, options) {
        this.items[id] = json;
        return this.resolve({});
    };
    MemoryEndpoint.prototype.read = function (id, options) {
        var existing = this.items[id];
        return existing ?
            this.resolve(existing) :
            this.reject("Not found");
    };
    MemoryEndpoint.prototype.destroy = function (id, options) {
        var existing = this.items[id];
        if (existing) {
            delete this.items[id];
            this.index = this.index.filter(function (x) { return x !== id; });
            return this.resolve({});
        }
        else {
            return this.reject("Not found");
        }
    };
    MemoryEndpoint.prototype.list = function (options) {
        var _this = this;
        return this.resolve(this.index.slice(1).map(function (id) { return _this.items[id]; }));
    };
    MemoryEndpoint.prototype.subscribe = function (events) { };
    MemoryEndpoint.prototype.unsubscribe = function (events) { };
    return MemoryEndpoint;
}());
export { MemoryEndpoint };
//# sourceMappingURL=index.js.map