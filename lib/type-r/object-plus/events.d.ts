import { Mixable, MixableConstructor, MixinsState } from './mixins';
import { EventMap, EventsDefinition, EventSource, HandlersByEvent } from './eventsource';
export { EventMap, EventsDefinition };
export interface MessengerDefinition {
    _localEvents?: EventMap;
    localEvents?: EventsDefinition;
    properties?: PropertyMap;
    [name: string]: any;
}
export interface PropertyMap {
    [name: string]: Property;
}
export declare type Property = PropertyDescriptor | (() => any);
export interface MessengersByCid {
    [cid: string]: Messenger;
}
export declare type CallbacksByEvents = {
    [events: string]: Function;
};
export declare abstract class Messenger implements Mixable, EventSource {
    static __super__: object;
    static mixins: MixinsState;
    static onExtend: (BaseClass: Function) => void;
    static define: (definition?: MessengerDefinition, statics?: object) => MixableConstructor;
    static extend: (definition?: MessengerDefinition, statics?: object) => MixableConstructor;
    static onDefine({ localEvents, _localEvents, properties }: MessengerDefinition, BaseClass?: typeof Mixable): void;
    _events: HandlersByEvent;
    _listeningTo: MessengersByCid;
    cid: string;
    _localEvents: EventMap;
    constructor();
    initialize(): void;
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
