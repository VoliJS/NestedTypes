/// <reference types="jquery" />
declare global  {
    interface Window {
        Backbone: any;
    }
    function attachEvent(a: any, b: any): any;
    function detachEvent(a: any, b: any): any;
}
export declare const VERSION = "1.2.3";
export declare let $: JQueryStatic;
export declare function noConflict(): any;
export declare let emulateHTTP: boolean;
export declare let emulateJSON: boolean;
export declare function View(options: any): void;
export declare function Router(options: any): void;
export declare function History(): void;
export declare const history: any;
export {};
