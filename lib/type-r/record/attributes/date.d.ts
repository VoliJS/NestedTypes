import { AnyType } from './any';
import { AttributesContainer } from './updates';
import { TransactionOptions } from '../../transactions';
import { ChainableAttributeSpec } from './attrDef';
export declare class DateType extends AnyType {
    create(): Date;
    convert(next: any, a: any, record: any): any;
    validate(model: any, value: any, name: any): string;
    toJSON(value: any): any;
    isChanged(a: any, b: any): boolean;
    doInit(value: any, record: AttributesContainer, options: TransactionOptions): any;
    doUpdate(value: any, record: any, options: any, nested: any): boolean;
    clone(value: any): Date;
    dispose(): void;
}
export declare class MSDateType extends DateType {
    convert(next: any): any;
    toJSON(value: any): string;
}
export declare class TimestampType extends DateType {
    toJSON(value: any): any;
}
declare global {
    interface DateConstructor {
        microsoft: ChainableAttributeSpec;
        timestamp: ChainableAttributeSpec;
    }
}
