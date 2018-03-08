import { createIOPromise } from 'type-r';
export function create(key) {
    return new LocalStorageEndpoint(key);
}
export { create as localStorageIO };
var LocalStorageEndpoint = (function () {
    function LocalStorageEndpoint(key) {
        this.key = key;
    }
    LocalStorageEndpoint.prototype.resolve = function (value) {
        return createIOPromise(function (resolve, reject) {
            setTimeout(function () {
                resolve(value);
            }, 0);
        });
    };
    LocalStorageEndpoint.prototype.reject = function (value) {
        return createIOPromise(function (resolve, reject) {
            setTimeout(function () { return reject(value); }, 0);
        });
    };
    LocalStorageEndpoint.prototype.create = function (json, options) {
        var index = this.index;
        index.push(json.id = String(index[0]++));
        this.index = index;
        this.set(json);
        return this.resolve({ id: json.id });
    };
    LocalStorageEndpoint.prototype.set = function (json) {
        localStorage.setItem(this.key + '#' + json.id, JSON.stringify(json));
    };
    LocalStorageEndpoint.prototype.get = function (id) {
        return JSON.parse(localStorage.getItem(this.key + '#' + id));
    };
    LocalStorageEndpoint.prototype.update = function (id, json, options) {
        json.id = id;
        this.set(json);
        return this.resolve({});
    };
    LocalStorageEndpoint.prototype.read = function (id, options) {
        var existing = this.get(id);
        return existing ?
            this.resolve(existing) :
            this.reject("Not found");
    };
    LocalStorageEndpoint.prototype.destroy = function (id, options) {
        var existing = this.get(id);
        if (existing) {
            localStorage.removeItem(this.key + '#' + id);
            this.index = this.index.filter(function (x) { return x !== id; });
            return this.resolve({});
        }
        else {
            return this.reject("Not found");
        }
    };
    Object.defineProperty(LocalStorageEndpoint.prototype, "index", {
        get: function () {
            return JSON.parse(localStorage.getItem(this.key)) || [0];
        },
        set: function (x) {
            localStorage.setItem(this.key, JSON.stringify(x));
        },
        enumerable: true,
        configurable: true
    });
    LocalStorageEndpoint.prototype.list = function (options) {
        var _this = this;
        var index = this.index;
        return this.resolve(this.index.slice(1).map(function (id) { return _this.get(id); }));
    };
    LocalStorageEndpoint.prototype.subscribe = function (events) { };
    LocalStorageEndpoint.prototype.unsubscribe = function (events) { };
    return LocalStorageEndpoint;
}());
export { LocalStorageEndpoint };
//# sourceMappingURL=index.js.map