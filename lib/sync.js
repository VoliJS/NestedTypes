"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("underscore");
var Backbone = require("./backbone");
var type_r_1 = require("./type-r");
var defaults = type_r_1.tools.defaults;
var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch': 'PATCH',
    'delete': 'DELETE',
    'read': 'GET'
};
exports.$ = Backbone.$;
exports.errorPromise = function (error) {
    var x = exports.$.Deferred();
    x.reject(error);
    return x;
};
exports.ajax = function () {
    return exports.$.ajax.apply(exports.$, arguments);
};
exports.sync = function (method, model, options) {
    if (options === void 0) { options = {}; }
    var type = methodMap[method];
    defaults(options, {
        emulateHTTP: Backbone.emulateHTTP,
        emulateJSON: Backbone.emulateJSON
    });
    var params = { type: type, dataType: 'json' };
    if (!options.url) {
        params.url = _.result(model, 'url') || urlError();
    }
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
        params.contentType = 'application/json';
        params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }
    if (options.emulateJSON) {
        params.contentType = 'application/x-www-form-urlencoded';
        params.data = params.data ? { model: params.data } : {};
    }
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
        params.type = 'POST';
        if (options.emulateJSON)
            params.data._method = type;
        var beforeSend = options.beforeSend;
        options.beforeSend = function (xhr) {
            xhr.setRequestHeader('X-HTTP-Method-Override', type);
            if (beforeSend)
                return beforeSend.apply(this, arguments);
        };
    }
    if (params.type !== 'GET' && !options.emulateJSON) {
        params.processData = false;
    }
    var error = options.error;
    options.error = function (xhr, textStatus, errorThrown) {
        options.textStatus = textStatus;
        options.errorThrown = errorThrown;
        if (error)
            error.call(options.context, xhr, textStatus, errorThrown);
    };
    var xhr = options.xhr = exports.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    model.collection && model.collection.trigger('request', model, xhr, options);
    return xhr;
};
function urlError() {
    throw new Error('A "url" property or function must be specified');
}
exports.urlError = urlError;
//# sourceMappingURL=sync.js.map