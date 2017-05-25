/// <reference types="jquery" />
import { RestModel } from './rest';
export declare class RestStore extends RestModel {
}
export declare class LazyStore extends RestStore {
    _resolved: {};
    initialize(): void;
    fetch(...args: string[]): JQueryXHR;
    fetchOnce(...args: string[]): JQueryXHR;
    clear(...args: string[]): this;
    static define(props: any, staticProps: any): any;
}
