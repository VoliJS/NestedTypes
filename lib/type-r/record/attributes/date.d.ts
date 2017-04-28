import { AnyType } from './generic';
export declare class DateType extends AnyType {
    convert(value: any, a?: any, b?: any, record?: any): any;
    validate(model: any, value: any, name: any): string;
    toJSON(value: any): any;
    isChanged(a: any, b: any): boolean;
    clone(value: any): Date;
}
export declare class MSDateType extends DateType {
    convert(value: any): any;
    toJSON(value: any): string;
}
export declare class TimestampType extends DateType {
    toJSON(value: any): any;
}
