import { Record } from './transaction';
import { ChainableAttributeSpec } from './typespec';
export * from './attributes';
export { Record, ChainableAttributeSpec };
declare global  {
    interface DateConstructor {
        microsoft: any;
        timestamp: any;
    }
}
declare global  {
    interface NumberConstructor {
        integer: Function;
    }
    interface Window {
        Integer: Function;
    }
}
export declare function createSharedTypeSpec(Constructor: any, Attribute: any): void;
