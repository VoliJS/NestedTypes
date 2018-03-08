import * as tslib_1 from "tslib";
export function create(url, fetchOptions) {
    return new RestfulEndpoint(url, fetchOptions);
}
export { create as restfulIO };
var RestfulEndpoint = (function () {
    function RestfulEndpoint(url, fetchOptions) {
        this.url = url;
        this.fetchOptions = fetchOptions;
    }
    RestfulEndpoint.prototype.create = function (json, options, record) {
        return this.request('POST', this.collectionUrl(record, options), options, json);
    };
    RestfulEndpoint.prototype.update = function (id, json, options, record) {
        return this.request('PUT', this.objectUrl(record, id, options), options, json);
    };
    RestfulEndpoint.prototype.read = function (id, options, record) {
        return this.request('GET', this.objectUrl(record, id, options), options);
    };
    RestfulEndpoint.prototype.destroy = function (id, options, record) {
        return this.request('DELETE', this.objectUrl(record, id, options), options);
    };
    RestfulEndpoint.prototype.list = function (options, collection) {
        return this.request('GET', this.collectionUrl(collection, options), options);
    };
    RestfulEndpoint.prototype.subscribe = function (events) { };
    RestfulEndpoint.prototype.unsubscribe = function (events) { };
    RestfulEndpoint.prototype.isRelativeUrl = function (url) {
        return url.indexOf('./') === 0;
    };
    RestfulEndpoint.prototype.removeTrailingSlash = function (url) {
        var endsWithSlash = url.charAt(url.length - 1) === '/';
        return endsWithSlash ? url.substr(0, url.length - 1) : url;
    };
    RestfulEndpoint.prototype.getRootUrl = function (recordOrCollection) {
        var url = this.url;
        if (this.isRelativeUrl(url)) {
            var owner = recordOrCollection.getOwner(), ownerUrl = owner.getEndpoint().getUrl(owner);
            return this.removeTrailingSlash(ownerUrl) + '/' + url.substr(2);
        }
        else {
            return url;
        }
    };
    RestfulEndpoint.prototype.getUrl = function (record) {
        var url = this.getRootUrl(record);
        return record.isNew()
            ? url
            : this.removeTrailingSlash(url) + '/' + record.id;
    };
    RestfulEndpoint.prototype.objectUrl = function (record, id, options) {
        return appendParams(this.getUrl(record), options.params);
    };
    RestfulEndpoint.prototype.collectionUrl = function (collection, options) {
        return appendParams(this.getRootUrl(collection), options.params);
    };
    RestfulEndpoint.prototype.buildRequestOptions = function (method, options, body) {
        var mergedOptions = Object.assign({}, RestfulEndpoint.defaultFetchOptions, this.fetchOptions, options);
        var headers = mergedOptions.headers, rest = tslib_1.__rest(mergedOptions, ["headers"]), resultOptions = tslib_1.__assign({ method: method, headers: tslib_1.__assign({ 'Content-Type': 'application/json' }, headers) }, rest);
        if (body) {
            resultOptions.body = JSON.stringify(body);
        }
        return resultOptions;
    };
    RestfulEndpoint.prototype.request = function (method, url, _a, body) {
        var options = _a.options;
        return fetch(url, this.buildRequestOptions(method, options, body))
            .then(function (response) {
            if (response.ok) {
                return response.json();
            }
            else {
                throw new Error(response.statusText);
            }
        });
    };
    RestfulEndpoint.defaultFetchOptions = {
        cache: "no-cache",
        credentials: "same-origin",
        mode: "cors",
        redirect: "error",
    };
    return RestfulEndpoint;
}());
export { RestfulEndpoint };
function appendParams(url, params) {
    var esc = encodeURIComponent;
    return params
        ? url + '?' + Object.keys(params)
            .map(function (k) { return esc(k) + '=' + esc(params[k]); })
            .join('&')
        : url;
}
//# sourceMappingURL=index.js.map