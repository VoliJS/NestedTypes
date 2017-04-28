/// <reference types="jquery" />
export declare type LazyValue<T> = () => T | T;
export declare type Method = 'create' | 'update' | 'patch' | 'delete' | 'read';
export interface Restful {
    trigger(event: string, model: any, xhr: any, options: any): any;
    collection?: {
        trigger(event: string, model, xhr, options);
    };
    toJSON(options: any): {};
    _xhr: JQueryXHR;
    sync(method: string, object: Restful, options: SyncOptions): any;
}
export interface SyncOptions {
    url?: LazyValue<string>;
    data?: any;
    emulateJSON?: boolean;
    emulateHTTP?: boolean;
    attrs?: {};
    beforeSend?: (xhr) => any;
    success?: (resp: any) => void;
    error?: (xhr?, textStatus?, errorThrown?) => void;
    textStatus?: string;
    errorThrown?: any;
    xhr?: any;
    context?: {};
}
export declare let $: JQueryStatic;
export declare let errorPromise: (error: any) => JQueryDeferred<{}>;
export declare let ajax: (options: {}) => any;
export declare let sync: (method: Method, model: Restful, options?: SyncOptions) => JQueryXHR;
export declare function urlError(): void;
