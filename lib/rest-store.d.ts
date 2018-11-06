/// <reference types="jquery" />
import "type-r/globals";
import { RestModel } from './rest';
export declare class RestStore extends RestModel {
}
export declare class LazyStore extends RestStore {
    _resolved: {};
    initialize(): void;
    fetch(...args: any[]): any;
    fetchOnce(...args: string[]): JQueryXHR;
    clear(...args: string[]): this;
    static onDefine(definitions: any, BaseClass: any): void;
}
