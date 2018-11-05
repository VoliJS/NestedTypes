import { Record } from './record';
export * from './attrDef';
export * from './metatypes';
export { Record };
export declare function attr(proto: object, attrName: string): void;
export declare function attr(spec: any): PropertyDecorator;
export declare function prop(spec: any): any;
