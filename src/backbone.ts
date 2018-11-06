/*******
 * Backbone Backward compatibility shim for View, Router, and History.
 * Based on 1.2.3, converted to browser-only ES6 modules thing. 
 */

//     Backbone.js 1.2.3
//     (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
import * as jQuery from 'jquery';
import * as _ from 'underscore';

// Initial Setup
// -------------
declare global {
    interface Window {
      Backbone : any
    }

    function attachEvent( a, b );
    function detachEvent( a, b );
}

// Save the previous value of the `Backbone` variable, so that it can be
// restored later on, if `noConflict` is used.
const previousBackbone = window.Backbone;

// Create a local reference to a common array method we'll want to use later.
const slice = Array.prototype.slice;

// For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
// the `$` variable.
const exported = {
  $ : jQuery,
  history : null,
  VERSION : '1.2.3',
  View, History, Router, noConflict
}

export default exported;

// Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
// to its previous owner. Returns a reference to this Backbone object.
function noConflict() {
  window.Backbone = previousBackbone;
  return this;
};

// Backbone.View
// -------------

// Backbone Views are almost more convention than they are actual code. A View
// is simply a JavaScript object that represents a logical chunk of UI in the
// DOM. This might be a single item, an entire list, a sidebar or panel, or
// even the surrounding frame which wraps your whole app. Defining a chunk of
// UI as a **View** allows you to define your DOM events declaratively, without
// having to worry about render order ... and makes it easy for the view to
// react to specific changes in the state of your models.

// Creating a Backbone.View creates its initial element outside of the DOM,
// if an existing element is not provided...
export function View(options) {
  this.cid = _.uniqueId('view');
  options || (options = {});
  _.extend(this, _.pick(options, viewOptions));
  this._ensureElement();
  this.initialize.apply(this, arguments);
  this.delegateEvents();
};

// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;

// List of view options to be merged as properties.
var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

// Set up all inheritable **Backbone.View** properties and methods.
_.extend(View.prototype, {

  // The default `tagName` of a View's element is `"div"`.
  tagName: 'div',

  // jQuery delegate for element lookup, scoped to DOM elements within the
  // current view. This should be preferred to global lookups where possible.
  $: function (selector) {
    return this.$el.find(selector);
  },

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function () { },

  // **render** is the core function that your view should override, in order
  // to populate its element (`this.el`), with the appropriate HTML. The
  // convention is for **render** to always return `this`.
  render: function () {
    return this;
  },

  // Remove this view by taking the element out of the DOM, and removing any
  // applicable Backbone.Events listeners.
  remove: function () {
    this.$el.remove();
    this.stopListening();
    return this;
  },

  // Change the view's element (`this.el` property), including event
  // re-delegation.
  setElement: function (element, delegate) {
    if (this.$el) this.undelegateEvents();
    this.$el = element instanceof exported.$ ? element : exported.$(element);
    this.el = this.$el[0];
    if (delegate !== false) this.delegateEvents();
    return this;
  },

  // Set callbacks, where `this.events` is a hash of
  //
  // *{"event selector": "callback"}*
  //
  //     {
  //       'mousedown .title':  'edit',
  //       'click .button':     'save',
  //       'click .open':       function(e) { ... }
  //     }
  //
  // pairs. Callbacks will be bound to the view, with `this` set properly.
  // Uses event delegation for efficiency.
  // Omitting the selector binds the event to `this.el`.
  // This only works for delegate-able events: not `focus`, `blur`, and
  // not `change`, `submit`, and `reset` in Internet Explorer.
  delegateEvents: function (events) {
    if (!(events || (events = _.result(this, 'events')))) return this;
    this.undelegateEvents();
    for (var key in events) {
      var method = events[key];
      if (!_.isFunction(method)) method = this[events[key]];
      if (!method) continue;

      var match = key.match(delegateEventSplitter);
      var eventName = match[1], selector = match[2];
      method = _.bind(method, this);
      eventName += '.delegateEvents' + this.cid;
      if (selector === '') {
        this.$el.on(eventName, method);
      } else {
        this.$el.on(eventName, selector, method);
      }
    }
    return this;
  },

  // Clears all callbacks previously bound to the view with `delegateEvents`.
  // You usually don't need to use this, but may wish to if you have multiple
  // Backbone views attached to the same DOM element.
  undelegateEvents: function () {
    this.$el.off('.delegateEvents' + this.cid);
    return this;
  },

  // Ensure that the View has a DOM element to render into.
  // If `this.el` is a string, pass it through `$()`, take the first
  // matching element, and re-assign it to `el`. Otherwise, create
  // an element from the `id`, `className` and `tagName` properties.
  _ensureElement: function () {
    if (!this.el) {
      var attrs = _.extend({}, _.result(this, 'attributes'));
      if (this.id) attrs.id = _.result(this, 'id');
      if (this.className) attrs['class'] = _.result(this, 'className');
      var $el = exported.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
      this.setElement($el, false);
    } else {
      this.setElement(_.result(this, 'el'), false);
    }
  }

});

// Backbone.Router
// ---------------

// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
export function Router(options) {
  options || (options = {});
  if (options.routes) this.routes = options.routes;
  this._bindRoutes();
  this.initialize.apply(this, arguments);
}

// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
var optionalParam = /\((.*?)\)/g;
var namedParam = /(\(\?)?:\w+/g;
var splatParam = /\*\w+/g;
var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

// Set up all inheritable **Backbone.Router** properties and methods.
_.extend(Router.prototype, {

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function () { },

  // Manually bind a single named route to a callback. For example:
  //
  //     this.route('search/:query/p:num', 'search', function(query, num) {
  //       ...
  //     });
  //
  route: function (route, name, callback) {
    if (!_.isRegExp(route)) route = this._routeToRegExp(route);
    if (_.isFunction(name)) {
      callback = name;
      name = '';
    }
    if (!callback) callback = this[name];
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

  // Execute a route handler with the provided parameters.  This is an
  // excellent place to do pre-route setup or post-route cleanup.
  execute: function (callback, args, name) {
    if (callback) callback.apply(this, args);
  },

  // Simple proxy to `Backbone.history` to save a fragment into the history.
  navigate: function (fragment, options) {
    exported.history.navigate(fragment, options);
    return this;
  },

  // Bind all defined routes to `Backbone.history`. We have to reverse the
  // order of the routes here to support behavior where the most general
  // routes can be defined at the bottom of the route map.
  _bindRoutes: function () {
    if (!this.routes) return;
    this.routes = _.result(this, 'routes');
    var route, routes = _.keys(this.routes);
    while ((route = routes.pop()) != null) {
      this.route(route, this.routes[route]);
    }
  },

  // Convert a route string into a regular expression, suitable for matching
  // against the current location hash.
  _routeToRegExp: function (route) {
    route = route.replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, function (match, optional) {
        return optional ? match : '([^/?]+)';
      })
      .replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  },

  // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  _extractParameters: function (route, fragment) {
    var params = route.exec(fragment).slice(1);
    return _.map(params, function (param, i) {
      // Don't decode the search params.
      if (i === params.length - 1) return param || null;
      return param ? decodeURIComponent(param) : null;
    });
  }

});

// Backbone.History
// ----------------

// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments. If the browser supports neither (old IE, natch),
// falls back to polling.
export function History() {
  this.handlers = [];
  this.checkUrl = _.bind(this.checkUrl, this);

  // Ensure that `History` can be used outside of the browser.
  if (typeof window !== 'undefined') {
    this.location = window.location;
    this.history = window.history;
  }
};

// Cached regex for stripping a leading hash/slash and trailing space.
var routeStripper = /^[#\/]|\s+$/g;

// Cached regex for stripping leading and trailing slashes.
var rootStripper = /^\/+|\/+$/g;

// Cached regex for stripping urls of hash.
var pathStripper = /#.*$/;

// Has the history handling already been started?
(History as any).started = false;

// Set up all inheritable **Backbone.History** properties and methods.
_.extend(History.prototype, {

  // The default interval to poll for hash changes, if necessary, is
  // twenty times a second.
  interval: 50,

  // Are we at the app root?
  atRoot: function () {
    var path = this.location.pathname.replace(/[^\/]$/, '$&/');
    return path === this.root && !this.getSearch();
  },

  // Does the pathname match the root?
  matchRoot: function () {
    var path = this.decodeFragment(this.location.pathname);
    var root = path.slice(0, this.root.length - 1) + '/';
    return root === this.root;
  },
  // Unicode characters in `location.pathname` are percent encoded so they're
  // decoded for comparison. `%25` should not be decoded since it may be part
  // of an encoded parameter.
  decodeFragment: function (fragment) {
    return decodeURI(fragment.replace(/%25/g, '%2525'));
  },
  // In IE6, the hash fragment and search params are incorrect if the
  // fragment contains `?`.
  getSearch: function () {
    var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
    return match ? match[0] : '';
  },
  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  getHash: function (window) {
    var match = (window || this).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  },

  // Get the pathname and search params, without the root.
  getPath: function () {
    var path = this.decodeFragment(
      this.location.pathname + this.getSearch()
    ).slice(this.root.length - 1);
    return path.charAt(0) === '/' ? path.slice(1) : path;
  },

  // Get the cross-browser normalized URL fragment from the path or hash.
  getFragment: function (fragment) {
    if (fragment == null) {
      if (this._usePushState || !this._wantsHashChange) {
        fragment = this.getPath();
      } else {
        fragment = this.getHash();
      }
    }
    return fragment.replace(routeStripper, '');
  },

  // Start the hash change handling, returning `true` if the current URL matches
  // an existing route, and `false` otherwise.
  start: function (options) {
    if ((History as any).started) throw new Error('Backbone.history has already been started');
    (History as any).started = true;

    // Figure out the initial configuration. Do we need an iframe?
    // Is pushState desired ... is it available?
    this.options = _.extend({ root: '/' }, this.options, options);
    this.root = this.options.root;
    this._wantsHashChange = this.options.hashChange !== false;
    this._hasHashChange = 'onhashchange' in window && ((document as any).documentMode === void 0 || (document as any).documentMode > 7);
    this._useHashChange = this._wantsHashChange && this._hasHashChange;
    this._wantsPushState = !!this.options.pushState;
    this._hasPushState = !!(this.history && this.history.pushState);
    this._usePushState = this._wantsPushState && this._hasPushState;
    this.fragment = this.getFragment();

    // Normalize root to always include a leading and trailing slash.
    this.root = ('/' + this.root + '/').replace(rootStripper, '/');




    // Transition from hashChange to pushState or vice versa if both are
    // requested.
    if (this._wantsHashChange && this._wantsPushState) {

      // If we've started off with a route from a `pushState`-enabled
      // browser, but we're currently in a browser that doesn't support it...
      if (!this._hasPushState && !this.atRoot()) {
        var root = this.root.slice(0, -1) || '/';
        this.location.replace(root + '#' + this.getPath());
        // Return immediately as browser will do redirect to new url
        return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
      } else if (this._hasPushState && this.atRoot()) {
        this.navigate(this.getHash(), { replace: true });
      }

    }

    // Proxy an iframe to handle location events if the browser doesn't
    // support the `hashchange` event, HTML5 history, or the user wants
    // `hashChange` but not `pushState`.
    if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
      this.iframe = document.createElement('iframe');
      this.iframe.src = 'javascript:0';
      this.iframe.style.display = 'none';
      this.iframe.tabIndex = -1;
      var body = document.body;
      // Using `appendChild` will throw on IE < 9 if the document is not ready.
      var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
      iWindow.document.open();
      iWindow.document.close();
      iWindow.location.hash = '#' + this.fragment;
    }

    // Add a cross-platform `addEventListener` shim for older browsers.
    var addEventListener = window.addEventListener || function (eventName, listener) {
      return attachEvent('on' + eventName, listener);
    };
    // Depending on whether we're using pushState or hashes, and whether
    // 'onhashchange' is supported, determine how we check the URL state.
    if (this._usePushState) {
      addEventListener('popstate', this.checkUrl, false);
    } else if (this._useHashChange && !this.iframe) {
      addEventListener('hashchange', this.checkUrl, false);
    } else if (this._wantsHashChange) {
      this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
    }
    if (!this.options.silent) return this.loadUrl();
  },

  // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
  // but possibly useful for unit testing Routers.
  stop: function () {
    // Add a cross-platform `removeEventListener` shim for older browsers.
    var removeEventListener = window.removeEventListener || function (eventName, listener) {
      return detachEvent('on' + eventName, listener);
    };
    // Remove window listeners.
    if (this._usePushState) {
      removeEventListener('popstate', this.checkUrl, false);
    } else if (this._useHashChange && !this.iframe) {
      removeEventListener('hashchange', this.checkUrl, false);
    }
    // Clean up the iframe if necessary.
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }
    // Some environments will throw when clearing an undefined interval.
    if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
    (History as any).started = false;
  },

  // Add a route to be tested when the fragment changes. Routes added later
  // may override previous routes.
  route: function (route, callback) {
    this.handlers.unshift({ route: route, callback: callback });
  },

  // Checks the current URL to see if it has changed, and if it has,
  // calls `loadUrl`, normalizing across the hidden iframe.
  checkUrl: function (e) {
    var current = this.getFragment();
    // If the user pressed the back button, the iframe's hash will have
    // changed and we should use that for comparison.
    if (current === this.fragment && this.iframe) {
      current = this.getHash(this.iframe.contentWindow);
    }
    if (current === this.fragment) return false;
    if (this.iframe) this.navigate(current);
    this.loadUrl();
  },

  // Attempt to load the current URL fragment. If a route succeeds with a
  // match, returns `true`. If no defined routes matches the fragment,
  // returns `false`.
  loadUrl: function (fragment) {
    // If the root doesn't match, no routes can match either.
    if (!this.matchRoot()) return false;
    fragment = this.fragment = this.getFragment(fragment);
    return _.some(this.handlers, function (handler) {
      if (handler.route.test(fragment)) {
        handler.callback(fragment);
        return true;
      }
    });
  },

  // Save a fragment into the hash history, or replace the URL state if the
  // 'replace' option is passed. You are responsible for properly URL-encoding
  // the fragment in advance.
  //
  // The options object can contain `trigger: true` if you wish to have the
  // route callback be fired (not usually desirable), or `replace: true`, if
  // you wish to modify the current URL without adding an entry to the history.
  navigate: function (fragment, options) {
    if (!(History as any).started) return false;
    if (!options || options === true) options = { trigger: !!options };

    // Normalize the fragment.
    fragment = this.getFragment(fragment || '');

    // Don't include a trailing slash on the root.
    var root = this.root;
    if (fragment === '' || fragment.charAt(0) === '?') {
      root = root.slice(0, -1) || '/';
    }
    var url = root + fragment;
    // Strip the hash and decode for matching.
    fragment = this.decodeFragment(fragment.replace(pathStripper, ''));

    if (this.fragment === fragment) return;
    this.fragment = fragment;


    // If pushState is available, we use it to set the fragment as a real URL.
    if (this._usePushState) {
      this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
    } else if (this._wantsHashChange) {
      this._updateHash(this.location, fragment, options.replace);
      if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
        var iWindow = this.iframe.contentWindow;
        // Opening and closing the iframe tricks IE7 and earlier to push a
        // history entry on hash-tag change.  When replace is true, we don't
        // want this.
        if (!options.replace) {
          iWindow.document.open();
          iWindow.document.close();
        }

        this._updateHash(iWindow.location, fragment, options.replace);
      }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
    } else {
      return this.location.assign(url);
    }
    if (options.trigger) return this.loadUrl(fragment);
  },

  // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  _updateHash: function (location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  }

});

// Create the default Backbone.history.
exported.history = new History;

