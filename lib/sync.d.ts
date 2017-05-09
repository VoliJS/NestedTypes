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
    attrs?: {};
    beforeSend?: (xhr) => any;
    success?: (resp: any) => void;
    error?: (xhr?, textStatus?, errorThrown?) => void;
    textStatus?: string;
    errorThrown?: any;
    xhr?: any;
    context?: {};
}
declare const exported: {
    $: JQueryStatic;
    errorPromise: (error: any) => JQueryDeferred<{}>;
    ajax: (options: {}) => any;
    sync: (method: Method, model: Restful, options?: SyncOptions) => JQueryXHR;
    urlError: () => never;
};
export default exported;
