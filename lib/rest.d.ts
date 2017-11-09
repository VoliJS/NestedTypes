/// <reference types="jquery" />
import { SyncOptions, Restful } from './sync';
import { Model, Collection } from './type-r';
export interface RestOptions extends SyncOptions {
    wait?: boolean;
    patch?: boolean;
    reset?: boolean;
}
export declare class RestCollection extends Collection implements Restful {
    _xhr: JQueryXHR;
    dispose(): void;
    model: typeof RestModel;
    url(): string;
    _invalidate(options: {
        validate?: boolean;
    }): boolean;
    fetch(options: RestOptions): any;
    create(a_model: any, options?: any): RestModel;
    sync(): any;
}
export declare class RestModel extends Model implements Restful {
    static Collection: typeof RestCollection;
    _xhr: JQueryXHR;
    urlRoot: string;
    _invalidate(options: {
        validate?: boolean;
    }): boolean;
    dispose(): void;
    fetch(options?: RestOptions): any;
    sync(method: string, self: this, options: SyncOptions): any;
    save(attrs?: {}, options?: RestOptions): any;
    save(key: string, value: any, options?: RestOptions): any;
    destroy(options: RestOptions): any;
    url(): string;
    set(key: string, value: any, options?: object): this;
    set(attrs: {}, options?: object): this;
}
