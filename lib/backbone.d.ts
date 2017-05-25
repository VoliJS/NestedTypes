/// <reference types="jquery" />
declare global  {
    interface Window {
        Backbone: any;
    }
    function attachEvent(a: any, b: any): any;
    function detachEvent(a: any, b: any): any;
}
declare const exported: {
    $: JQueryStatic;
    history: any;
    VERSION: string;
    View: (options: any) => void;
    History: () => void;
    Router: (options: any) => void;
    noConflict: () => any;
};
export default exported;
export declare function View(options: any): void;
export declare function Router(options: any): void;
export declare function History(): void;
export {};
