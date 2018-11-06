import * as _ from 'underscore';
import Backbone from './backbone';
var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch': 'PATCH',
    'delete': 'DELETE',
    'read': 'GET'
};
var exported = {
    $: Backbone.$,
    errorPromise: function (error) {
        var x = $.Deferred();
        x.reject(error);
        return x;
    },
    ajax: function (options) {
        return $.ajax.apply($, arguments);
    },
    sync: sync,
    urlError: function () {
        throw new Error('A "url" property or function must be specified');
    }
};
export default exported;
function sync(method, model, options) {
    if (options === void 0) { options = {}; }
    var type = methodMap[method];
    var params = { type: type, dataType: 'json' };
    if (!options.url) {
        params.url = _.result(model, 'url') || exported.urlError();
    }
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
        params.contentType = 'application/json';
        params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }
    if (params.type !== 'GET') {
        params.processData = false;
    }
    var error = options.error;
    options.error = function (xhr, textStatus, errorThrown) {
        options.textStatus = textStatus;
        options.errorThrown = errorThrown;
        if (error)
            error.call(options.context, xhr, textStatus, errorThrown);
    };
    var xhr = options.xhr = exported.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    model.collection && model.collection.trigger('request', model, xhr, options);
    return xhr;
}
//# sourceMappingURL=sync.js.map