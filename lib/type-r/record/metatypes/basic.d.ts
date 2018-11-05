import { TransactionOptions } from '../../transactions';
import { AnyType } from './any';
import { AttributesContainer } from '../updates';
export declare class ImmutableClassType extends AnyType {
    type: new (value?: any) => {};
    create(): {};
    convert(next: any): any;
    toJSON(value: any, key?: string, options?: object): any;
    clone(value: any): {};
    isChanged(a: any, b: any): boolean;
}
export declare class PrimitiveType extends AnyType {
    type: NumberConstructor | StringConstructor | BooleanConstructor;
    dispose(): void;
    create(): string | number | boolean;
    toJSON(value: any): any;
    convert(next: any): any;
    isChanged(a: any, b: any): boolean;
    clone(value: any): any;
    doInit(value: any, record: AttributesContainer, options: TransactionOptions): any;
    doUpdate(value: any, record: any, options: any, nested: any): boolean;
    initialize(): void;
}
export declare class NumericType extends PrimitiveType {
    type: NumberConstructor;
    create(): number;
    convert(next: any, prev?: any, record?: any, options?: any): any;
    validate(model: any, value: any, name: any): string;
}
export declare class ArrayType extends AnyType {
    toJSON(value: any): any;
    dispose(): void;
    create(): any[];
    convert(next: any, prev: any, record: any, options: any): any;
    clone(value: any): any;
}
export declare class ObjectType extends AnyType {
    create(): {};
    convert(next: any, prev: any, record: any, options: any): any;
}
export declare function doNothing(): void;
export declare class FunctionType extends AnyType {
    toJSON(value: any): any;
    create(): typeof doNothing;
    dispose(): void;
    convert(next: any, prev: any, record: any, options: any): any;
    clone(value: any): any;
}
