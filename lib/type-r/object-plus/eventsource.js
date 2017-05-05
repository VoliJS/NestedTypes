import { once as _once } from './tools';
var EventMap = (function () {
    function EventMap(map) {
        this.handlers = [];
        if (map) {
            if (map instanceof EventMap) {
                this.handlers = map.handlers.slice();
            }
            else {
                map && this.addEventsMap(map);
            }
        }
    }
    EventMap.prototype.merge = function (map) {
        this.handlers = this.handlers.concat(map.handlers);
    };
    EventMap.prototype.addEventsMap = function (map) {
        for (var names in map) {
            this.addEvent(names, map[names]);
        }
    };
    EventMap.prototype.bubbleEvents = function (names) {
        for (var _i = 0, _a = names.split(eventSplitter); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            this.addEvent(name_1, getBubblingHandler(name_1));
        }
    };
    EventMap.prototype.addEvent = function (names, callback) {
        var handlers = this.handlers;
        for (var _i = 0, _a = names.split(eventSplitter); _i < _a.length; _i++) {
            var name_2 = _a[_i];
            handlers.push(new EventDescriptor(name_2, callback));
        }
    };
    EventMap.prototype.subscribe = function (target, source) {
        for (var _i = 0, _a = this.handlers; _i < _a.length; _i++) {
            var event_1 = _a[_i];
            on(source, event_1.name, event_1.callback, target);
        }
    };
    EventMap.prototype.unsubscribe = function (target, source) {
        for (var _i = 0, _a = this.handlers; _i < _a.length; _i++) {
            var event_2 = _a[_i];
            off(source, event_2.name, event_2.callback, target);
        }
    };
    return EventMap;
}());
export { EventMap };
var EventDescriptor = (function () {
    function EventDescriptor(name, callback) {
        this.name = name;
        if (callback === true) {
            this.callback = getBubblingHandler(name);
        }
        else if (typeof callback === 'string') {
            this.callback =
                function localCallback() {
                    var handler = this[callback];
                    handler && handler.apply(this, arguments);
                };
        }
        else {
            this.callback = callback;
        }
    }
    return EventDescriptor;
}());
export { EventDescriptor };
var _bubblingHandlers = {};
function getBubblingHandler(event) {
    return _bubblingHandlers[event] || (_bubblingHandlers[event] = function (a, b, c, d, e) {
        if (d !== void 0 || e !== void 0)
            trigger5(this, event, a, b, c, d, e);
        if (c !== void 0)
            trigger3(this, event, a, b, c);
        else
            trigger2(this, event, a, b);
    });
}
var EventHandler = (function () {
    function EventHandler(callback, context, next) {
        if (next === void 0) { next = null; }
        this.callback = callback;
        this.context = context;
        this.next = next;
    }
    return EventHandler;
}());
export { EventHandler };
function listOff(_events, name, callback, context) {
    var head = _events[name];
    var filteredHead, prev;
    for (var ev = head; ev; ev = ev.next) {
        if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
            (context && context !== ev.context)) {
            prev = ev;
            filteredHead || (filteredHead = ev);
        }
        else {
            if (prev)
                prev.next = ev.next;
        }
    }
    if (head !== filteredHead)
        _events[name] = filteredHead;
}
function listSend2(head, a, b) {
    for (var ev = head; ev; ev = ev.next)
        ev.callback.call(ev.context, a, b);
}
function listSend3(head, a, b, c) {
    for (var ev = head; ev; ev = ev.next)
        ev.callback.call(ev.context, a, b, c);
}
function listSend4(head, a, b, c, d) {
    for (var ev = head; ev; ev = ev.next)
        ev.callback.call(ev.context, a, b, c, d);
}
function listSend5(head, a, b, c, d, e) {
    for (var ev = head; ev; ev = ev.next)
        ev.callback.call(ev.context, a, b, c, d, e);
}
function listSend6(head, a, b, c, d, e, f) {
    for (var ev = head; ev; ev = ev.next)
        ev.callback.call(ev.context, a, b, c, d, e, f);
}
export function on(source, name, callback, context) {
    if (callback) {
        var _events = source._events || (source._events = Object.create(null));
        _events[name] = new EventHandler(callback, context, _events[name]);
    }
}
export function once(source, name, callback, context) {
    if (callback) {
        var once_1 = _once(function () {
            off(source, name, once_1);
            callback.apply(this, arguments);
        });
        once_1._callback = callback;
        on(source, name, once_1, context);
    }
}
export function off(source, name, callback, context) {
    var _events = source._events;
    if (_events) {
        if (callback || context) {
            if (name) {
                listOff(_events, name, callback, context);
            }
            else {
                for (var name_3 in _events) {
                    listOff(_events, name_3, callback, context);
                }
            }
        }
        else if (name) {
            _events[name] = void 0;
        }
        else {
            source._events = void 0;
        }
    }
}
var eventSplitter = /\s+/;
export function strings(api, source, events, callback, context) {
    if (eventSplitter.test(events)) {
        var names = events.split(eventSplitter);
        for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
            var name_4 = names_1[_i];
            api(source, name_4, callback, context);
        }
    }
    else
        api(source, events, callback, context);
}
export function trigger2(self, name, a, b) {
    var _events = self._events;
    if (_events) {
        var queue = _events[name], all = _events.all;
        listSend2(queue, a, b);
        listSend3(all, name, a, b);
    }
}
;
export function trigger3(self, name, a, b, c) {
    var _events = self._events;
    if (_events) {
        var queue = _events[name], all = _events.all;
        listSend3(queue, a, b, c);
        listSend4(all, name, a, b, c);
    }
}
;
export function trigger5(self, name, a, b, c, d, e) {
    var _events = self._events;
    if (_events) {
        var queue = _events[name], all = _events.all;
        listSend5(queue, a, b, c, d, e);
        listSend6(all, name, a, b, c, d, e);
    }
}
;
//# sourceMappingURL=eventsource.js.map