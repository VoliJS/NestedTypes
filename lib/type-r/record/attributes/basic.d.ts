import { AnyType } from './generic';
export declare class PrimitiveType extends AnyType {
    type: NumberConstructor | StringConstructor | BooleanConstructor;
    dispose(): void;
    create(): string | number | boolean;
    toJSON(value: any): any;
    convert(value: any): any;
    isChanged(a: any, b: any): boolean;
    clone(value: any): any;
}
export declare class NumericType extends PrimitiveType {
    type: NumberConstructor;
    convert(value: any, a?: any, b?: any, record?: any): any;
    validate(model: any, value: any, name: any): string;
}
export declare class ArrayType extends AnyType {
    toJSON(value: any): any;
    dispose(): void;
    convert(value: any, a?: any, b?: any, record?: any): any;
    clone(value: any): any;
}
export declare function doNothing(): void;
export declare class FunctionType extends AnyType {
    toJSON(value: any): any;
    create(): typeof doNothing;
    dispose(): void;
    convert(next: any, prev: any, record: any): any;
    clone(value: any): any;
}
