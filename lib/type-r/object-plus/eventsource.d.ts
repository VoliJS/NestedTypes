export interface EventsDefinition {
    [events: string]: Function | string | boolean;
}
export declare class EventMap {
    handlers: EventDescriptor[];
    constructor(map?: EventsDefinition | EventMap);
    merge(map: EventMap): void;
    addEventsMap(map: EventsDefinition): void;
    bubbleEvents(names: string): void;
    addEvent(names: string, callback: Function | string | boolean): void;
    subscribe(target: {}, source: EventSource): void;
    unsubscribe(target: {}, source: EventSource): void;
}
export declare class EventDescriptor {
    name: string;
    callback: Function;
    constructor(name: string, callback: Function | string | boolean);
}
export interface HandlersByEvent {
    [name: string]: EventHandler;
}
export declare class EventHandler {
    callback: Callback;
    context: any;
    next: any;
    constructor(callback: Callback, context: any, next?: any);
}
export interface Callback extends Function {
    _callback?: Function;
}
export declare function on(source: EventSource, name: string, callback: Callback, context?: any): void;
export declare function once(source: EventSource, name: string, callback: Callback, context?: any): void;
export declare function off(source: EventSource, name?: string, callback?: Callback, context?: any): void;
export interface EventSource {
    _events: HandlersByEvent;
}
export declare function strings(api: ApiEntry, source: EventSource, events: string, callback: Callback, context: any): void;
export declare type ApiEntry = (source: EventSource, event: string, callback: Callback, context?: any) => void;
export declare function trigger2(self: EventSource, name: string, a: any, b: any): void;
export declare function trigger3(self: EventSource, name: string, a: any, b: any, c: any): void;
export declare function trigger5(self: EventSource, name: string, a: any, b: any, c: any, d: any, e: any): void;
