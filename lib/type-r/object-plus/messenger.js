var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as Mixins from './mixins';
import { omit } from './tools';
import { EventMap } from './eventsource';
import * as _eventsApi from './eventsource';
var mixins = Mixins.mixins, define = Mixins.define, extendable = Mixins.extendable, EventHandler = _eventsApi.EventHandler, strings = _eventsApi.strings, on = _eventsApi.on, off = _eventsApi.off, once = _eventsApi.once, trigger5 = _eventsApi.trigger5, trigger2 = _eventsApi.trigger2, trigger3 = _eventsApi.trigger3;
var eventSplitter = /\s+/;
var _idCount = 0;
function uniqueId() {
    return 'l' + _idCount++;
}
export { EventMap };
var Messenger = Messenger_1 = (function () {
    function Messenger() {
        this._events = void 0;
        this._listeningTo = void 0;
        this.cid = uniqueId();
        this.initialize.apply(this, arguments);
    }
    Messenger.prototype.initialize = function () { };
    Messenger.define = function (protoProps, staticProps) {
        var spec = omit(protoProps || {}, 'localEvents');
        if (protoProps) {
            var localEvents = protoProps.localEvents, _localEvents = protoProps._localEvents;
            if (localEvents || _localEvents) {
                var eventsMap = new EventMap(this.prototype._localEvents);
                localEvents && eventsMap.addEventsMap(localEvents);
                _localEvents && eventsMap.merge(_localEvents);
                spec._localEvents = eventsMap;
            }
        }
        return Mixins.Mixable.define.call(this, spec, staticProps);
    };
    Messenger.prototype.on = function (events, callback, context) {
        if (typeof events === 'string')
            strings(on, this, events, callback, context);
        else
            for (var name_1 in events)
                strings(on, this, name_1, events[name_1], context || callback);
        return this;
    };
    Messenger.prototype.once = function (events, callback, context) {
        if (typeof events === 'string')
            strings(once, this, events, callback, context);
        else
            for (var name_2 in events)
                strings(once, this, name_2, events[name_2], context || callback);
        return this;
    };
    Messenger.prototype.off = function (events, callback, context) {
        if (!events)
            off(this, void 0, callback, context);
        else if (typeof events === 'string')
            strings(off, this, events, callback, context);
        else
            for (var name_3 in events)
                strings(off, this, name_3, events[name_3], context || callback);
        return this;
    };
    Messenger.prototype.trigger = function (name, a, b, c, d, e) {
        if (d !== void 0 || e !== void 0)
            trigger5(this, name, a, b, c, d, e);
        else if (c !== void 0)
            trigger3(this, name, a, b, c);
        else
            trigger2(this, name, a, b);
        return this;
    };
    Messenger.prototype.listenTo = function (source, a, b) {
        if (source) {
            addReference(this, source);
            source.on(a, !b && typeof a === 'object' ? this : b, this);
        }
        return this;
    };
    Messenger.prototype.listenToOnce = function (source, a, b) {
        if (source) {
            addReference(this, source);
            source.once(a, !b && typeof a === 'object' ? this : b, this);
        }
        return this;
    };
    Messenger.prototype.stopListening = function (a_source, a, b) {
        var _listeningTo = this._listeningTo;
        if (_listeningTo) {
            var removeAll = !(a || b), second = !b && typeof a === 'object' ? this : b;
            if (a_source) {
                var source = _listeningTo[a_source.cid];
                if (source) {
                    if (removeAll)
                        delete _listeningTo[a_source.cid];
                    source.off(a, second, this);
                }
            }
            else if (a_source == null) {
                for (var cid in _listeningTo)
                    _listeningTo[cid].off(a, second, this);
                if (removeAll)
                    (this._listeningTo = void 0);
            }
        }
        return this;
    };
    Messenger.prototype.dispose = function () {
        if (this._disposed)
            return;
        this.stopListening();
        this.off();
        this._disposed = true;
    };
    return Messenger;
}());
Messenger = Messenger_1 = __decorate([
    extendable
], Messenger);
export { Messenger };
var slice = Array.prototype.slice;
export var Events = omit(Messenger.prototype, 'constructor', 'initialize');
function addReference(listener, source) {
    var listeningTo = listener._listeningTo || (listener._listeningTo = Object.create(null)), cid = source.cid || (source.cid = uniqueId());
    listeningTo[cid] = source;
}
var Messenger_1;
//# sourceMappingURL=messenger.js.map