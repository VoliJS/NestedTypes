export function create() {
    return new AttributesEndpoint();
}
export { create as attributesIO };
var AttributesEndpoint = (function () {
    function AttributesEndpoint() {
    }
    AttributesEndpoint.prototype.create = function (json, options) {
        throw new Error('Method is not supported.');
    };
    AttributesEndpoint.prototype.update = function (id, json, options) {
        throw new Error('Method is not supported.');
    };
    AttributesEndpoint.prototype.read = function (id, options, record) {
        var names = record.keys().filter(function (name) { return record[name] && record[name].fetch; }), promises = names.map(function (name) { return record[name].fetch(options); }), promise = Promise.all(promises).then(function () { });
        promise.abort = function () {
            promises.forEach(function (x) { return x.abort && x.abort(); });
        };
        return promise;
    };
    AttributesEndpoint.prototype.destroy = function (id, options) {
        throw new Error('Method is not supported.');
    };
    AttributesEndpoint.prototype.list = function (options) {
        throw new Error('Method is not supported.');
    };
    AttributesEndpoint.prototype.subscribe = function (events) { };
    AttributesEndpoint.prototype.unsubscribe = function (events) { };
    return AttributesEndpoint;
}());
export { AttributesEndpoint };
//# sourceMappingURL=index.js.map