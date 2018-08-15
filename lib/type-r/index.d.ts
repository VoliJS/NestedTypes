declare global {
    interface ObjectConstructor {
        setPrototypeOf(target: Object, proto: Object): any;
    }
}
export * from './object-plus';
export * from './collection';
export * from './relations';
export * from './record';
export * from './transactions';
export * from './io-tools';
export declare const on: any, off: any, trigger: any, once: any, listenTo: any, stopListening: any, listenToOnce: any;
import { Record as Model } from './record';
import { Mixable as Class } from './object-plus/';
export { Model, Class };
export declare function attributes(attrDefs: any): typeof Model;
import { ChainableAttributeSpec } from './record';
export declare function value(x: any): ChainableAttributeSpec;
export declare function transaction<F extends Function>(method: F): F;
