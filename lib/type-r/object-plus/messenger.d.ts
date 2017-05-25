import * as Mixins from './mixins';
import { EventMap, EventsDefinition, EventSource, HandlersByEvent } from './eventsource';
export { EventMap, EventsDefinition };
export interface MessengerDefinition extends Mixins.ClassDefinition {
    _localEvents?: EventMap;
    localEvents?: EventsDefinition;
}
export interface MessengersByCid {
    [cid: string]: Messenger;
}
export declare type CallbacksByEvents = {
    [events: string]: Function;
};
export declare abstract class Messenger implements Mixins.Mixable, EventSource {
    static create: (a: any, b?: any, c?: any) => Messenger;
    static mixins: (...mixins: (Mixins.Constructor<any> | {})[]) => Mixins.MixableConstructor<Messenger>;
    static mixinRules: (mixinRules: Mixins.MixinRules) => Mixins.MixableConstructor<Messenger>;
    static mixTo: (...args: Mixins.Constructor<any>[]) => Mixins.MixableConstructor<Messenger>;
    static extend: (spec?: MessengerDefinition, statics?: {}) => Mixins.MixableConstructor<Messenger>;
    static predefine: () => Mixins.MixableConstructor<Messenger>;
    _events: HandlersByEvent;
    _listeningTo: MessengersByCid;
    cid: string;
    _localEvents: EventMap;
    constructor();
    initialize(): void;
    static define(protoProps?: MessengerDefinition, staticProps?: any): typeof Messenger;
    on(events: string | CallbacksByEvents, callback: any, context?: any): this;
    once(events: string | CallbacksByEvents, callback: any, context?: any): this;
    off(events?: string | CallbacksByEvents, callback?: any, context?: any): this;
    trigger(name: string, a?: any, b?: any, c?: any, d?: any, e?: any): this;
    listenTo(source: Messenger, a: string | CallbacksByEvents, b?: Function): this;
    listenToOnce(source: Messenger, a: string | CallbacksByEvents, b?: Function): this;
    stopListening(a_source?: Messenger, a?: string | CallbacksByEvents, b?: Function): this;
    _disposed: boolean;
    dispose(): void;
}
export declare const Events: Messenger;
