import * as jQuery from 'jquery';
import * as _ from 'underscore';
var previousBackbone = window.Backbone;
var slice = Array.prototype.slice;
var exported = {
    $: jQuery,
    history: null,
    VERSION: '1.2.3',
    View: View, History: History, Router: Router, noConflict: noConflict
};
export default exported;
function noConflict() {
    window.Backbone = previousBackbone;
    return this;
}
;
export function View(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
}
;
var delegateEventSplitter = /^(\S+)\s*(.*)$/;
var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
_.extend(View.prototype, {
    tagName: 'div',
    $: function (selector) {
        return this.$el.find(selector);
    },
    initialize: function () { },
    render: function () {
        return this;
    },
    remove: function () {
        this.$el.remove();
        this.stopListening();
        return this;
    },
    setElement: function (element, delegate) {
        if (this.$el)
            this.undelegateEvents();
        this.$el = element instanceof exported.$ ? element : exported.$(element);
        this.el = this.$el[0];
        if (delegate !== false)
            this.delegateEvents();
        return this;
    },
    delegateEvents: function (events) {
        if (!(events || (events = _.result(this, 'events'))))
            return this;
        this.undelegateEvents();
        for (var key in events) {
            var method = events[key];
            if (!_.isFunction(method))
                method = this[events[key]];
            if (!method)
                continue;
            var match = key.match(delegateEventSplitter);
            var eventName = match[1], selector = match[2];
            method = _.bind(method, this);
            eventName += '.delegateEvents' + this.cid;
            if (selector === '') {
                this.$el.on(eventName, method);
            }
            else {
                this.$el.on(eventName, selector, method);
            }
        }
        return this;
    },
    undelegateEvents: function () {
        this.$el.off('.delegateEvents' + this.cid);
        return this;
    },
    _ensureElement: function () {
        if (!this.el) {
            var attrs = _.extend({}, _.result(this, 'attributes'));
            if (this.id)
                attrs.id = _.result(this, 'id');
            if (this.className)
                attrs['class'] = _.result(this, 'className');
            var $el = exported.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
            this.setElement($el, false);
        }
        else {
            this.setElement(_.result(this, 'el'), false);
        }
    }
});
export function Router(options) {
    options || (options = {});
    if (options.routes)
        this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
}
var optionalParam = /\((.*?)\)/g;
var namedParam = /(\(\?)?:\w+/g;
var splatParam = /\*\w+/g;
var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
_.extend(Router.prototype, {
    initialize: function () { },
    route: function (route, name, callback) {
        if (!_.isRegExp(route))
            route = this._routeToRegExp(route);
        if (_.isFunction(name)) {
            callback = name;
            name = '';
        }
        if (!callback)
            callback = this[name];
        var router = this;
        exported.history.route(route, function (fragment) {
            var args = router._extractParameters(route, fragment);
            if (router.execute(callback, args, name) !== false) {
                router.trigger.apply(router, ['route:' + name].concat(args));
                router.trigger('route', name, args);
                exported.history.trigger('route', router, name, args);
            }
        });
        return this;
    },
    execute: function (callback, args, name) {
        if (callback)
            callback.apply(this, args);
    },
    navigate: function (fragment, options) {
        exported.history.navigate(fragment, options);
        return this;
    },
    _bindRoutes: function () {
        if (!this.routes)
            return;
        this.routes = _.result(this, 'routes');
        var route, routes = _.keys(this.routes);
        while ((route = routes.pop()) != null) {
            this.route(route, this.routes[route]);
        }
    },
    _routeToRegExp: function (route) {
        route = route.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function (match, optional) {
            return optional ? match : '([^/?]+)';
        })
            .replace(splatParam, '([^?]*?)');
        return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },
    _extractParameters: function (route, fragment) {
        var params = route.exec(fragment).slice(1);
        return _.map(params, function (param, i) {
            if (i === params.length - 1)
                return param || null;
            return param ? decodeURIComponent(param) : null;
        });
    }
});
export function History() {
    this.handlers = [];
    this.checkUrl = _.bind(this.checkUrl, this);
    if (typeof window !== 'undefined') {
        this.location = window.location;
        this.history = window.history;
    }
}
;
var routeStripper = /^[#\/]|\s+$/g;
var rootStripper = /^\/+|\/+$/g;
var pathStripper = /#.*$/;
History.started = false;
_.extend(History.prototype, {
    interval: 50,
    atRoot: function () {
        var path = this.location.pathname.replace(/[^\/]$/, '$&/');
        return path === this.root && !this.getSearch();
    },
    matchRoot: function () {
        var path = this.decodeFragment(this.location.pathname);
        var root = path.slice(0, this.root.length - 1) + '/';
        return root === this.root;
    },
    decodeFragment: function (fragment) {
        return decodeURI(fragment.replace(/%25/g, '%2525'));
    },
    getSearch: function () {
        var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
        return match ? match[0] : '';
    },
    getHash: function (window) {
        var match = (window || this).location.href.match(/#(.*)$/);
        return match ? match[1] : '';
    },
    getPath: function () {
        var path = this.decodeFragment(this.location.pathname + this.getSearch()).slice(this.root.length - 1);
        return path.charAt(0) === '/' ? path.slice(1) : path;
    },
    getFragment: function (fragment) {
        if (fragment == null) {
            if (this._usePushState || !this._wantsHashChange) {
                fragment = this.getPath();
            }
            else {
                fragment = this.getHash();
            }
        }
        return fragment.replace(routeStripper, '');
    },
    start: function (options) {
        if (History.started)
            throw new Error('Backbone.history has already been started');
        History.started = true;
        this.options = _.extend({ root: '/' }, this.options, options);
        this.root = this.options.root;
        this._wantsHashChange = this.options.hashChange !== false;
        this._hasHashChange = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
        this._useHashChange = this._wantsHashChange && this._hasHashChange;
        this._wantsPushState = !!this.options.pushState;
        this._hasPushState = !!(this.history && this.history.pushState);
        this._usePushState = this._wantsPushState && this._hasPushState;
        this.fragment = this.getFragment();
        this.root = ('/' + this.root + '/').replace(rootStripper, '/');
        if (this._wantsHashChange && this._wantsPushState) {
            if (!this._hasPushState && !this.atRoot()) {
                var root = this.root.slice(0, -1) || '/';
                this.location.replace(root + '#' + this.getPath());
                return true;
            }
            else if (this._hasPushState && this.atRoot()) {
                this.navigate(this.getHash(), { replace: true });
            }
        }
        if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
            this.iframe = document.createElement('iframe');
            this.iframe.src = 'javascript:0';
            this.iframe.style.display = 'none';
            this.iframe.tabIndex = -1;
            var body = document.body;
            var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
            iWindow.document.open();
            iWindow.document.close();
            iWindow.location.hash = '#' + this.fragment;
        }
        var addEventListener = window.addEventListener || function (eventName, listener) {
            return attachEvent('on' + eventName, listener);
        };
        if (this._usePushState) {
            addEventListener('popstate', this.checkUrl, false);
        }
        else if (this._useHashChange && !this.iframe) {
            addEventListener('hashchange', this.checkUrl, false);
        }
        else if (this._wantsHashChange) {
            this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
        }
        if (!this.options.silent)
            return this.loadUrl();
    },
    stop: function () {
        var removeEventListener = window.removeEventListener || function (eventName, listener) {
            return detachEvent('on' + eventName, listener);
        };
        if (this._usePushState) {
            removeEventListener('popstate', this.checkUrl, false);
        }
        else if (this._useHashChange && !this.iframe) {
            removeEventListener('hashchange', this.checkUrl, false);
        }
        if (this.iframe) {
            document.body.removeChild(this.iframe);
            this.iframe = null;
        }
        if (this._checkUrlInterval)
            clearInterval(this._checkUrlInterval);
        History.started = false;
    },
    route: function (route, callback) {
        this.handlers.unshift({ route: route, callback: callback });
    },
    checkUrl: function (e) {
        var current = this.getFragment();
        if (current === this.fragment && this.iframe) {
            current = this.getHash(this.iframe.contentWindow);
        }
        if (current === this.fragment)
            return false;
        if (this.iframe)
            this.navigate(current);
        this.loadUrl();
    },
    loadUrl: function (fragment) {
        if (!this.matchRoot())
            return false;
        fragment = this.fragment = this.getFragment(fragment);
        return _.some(this.handlers, function (handler) {
            if (handler.route.test(fragment)) {
                handler.callback(fragment);
                return true;
            }
        });
    },
    navigate: function (fragment, options) {
        if (!History.started)
            return false;
        if (!options || options === true)
            options = { trigger: !!options };
        fragment = this.getFragment(fragment || '');
        var root = this.root;
        if (fragment === '' || fragment.charAt(0) === '?') {
            root = root.slice(0, -1) || '/';
        }
        var url = root + fragment;
        fragment = this.decodeFragment(fragment.replace(pathStripper, ''));
        if (this.fragment === fragment)
            return;
        this.fragment = fragment;
        if (this._usePushState) {
            this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
        }
        else if (this._wantsHashChange) {
            this._updateHash(this.location, fragment, options.replace);
            if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
                var iWindow = this.iframe.contentWindow;
                if (!options.replace) {
                    iWindow.document.open();
                    iWindow.document.close();
                }
                this._updateHash(iWindow.location, fragment, options.replace);
            }
        }
        else {
            return this.location.assign(url);
        }
        if (options.trigger)
            return this.loadUrl(fragment);
    },
    _updateHash: function (location, fragment, replace) {
        if (replace) {
            var href = location.href.replace(/(javascript:|#).*$/, '');
            location.replace(href + '#' + fragment);
        }
        else {
            location.hash = '#' + fragment;
        }
    }
});
exported.history = new History;
//# sourceMappingURL=backbone.js.map