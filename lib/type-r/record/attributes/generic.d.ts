import { Record, Attribute, AttributeDescriptor } from '../transaction';
import { Constructor } from '../../object-plus';
import { TransactionOptions } from '../../transactions';
export declare type ChangeAttrHandler = ((value: any, attr: string) => void) | string;
declare global  {
    interface Function {
        _attribute: typeof AnyType;
    }
}
interface ExtendedAttributeDescriptor extends AttributeDescriptor {
    _attribute?: typeof AnyType;
    validate?: (record: Record, value: any, key: string) => any;
    isRequired?: boolean;
    changeEvents?: boolean;
}
export { ExtendedAttributeDescriptor as AttributeDescriptor };
export declare class AnyType implements Attribute {
    name: string;
    static create(options: ExtendedAttributeDescriptor, name: string): AnyType;
    canBeUpdated(prev: any, next: any, options: TransactionOptions): any;
    transform(value: any, options: TransactionOptions, prev: any, model: Record): any;
    convert(value: any, options: TransactionOptions, prev: any, model: Record): any;
    isChanged(a: any, b: any): boolean;
    handleChange(next: any, prev: any, model: Record): void;
    create(): any;
    clone(value: any, record: Record): any;
    dispose(record: Record, value: any): void;
    validate(record: Record, value: any, key: string): void;
    toJSON(value: any, key: any): any;
    createPropertyDescriptor(): PropertyDescriptor | void;
    value: any;
    static defaultValue: any;
    type: Constructor<any>;
    parse: (value, key: string) => any;
    initialize(name: string, options: any): void;
    options: ExtendedAttributeDescriptor;
    propagateChanges: boolean;
    _log(level: string, text: string, value: any, record: Record): void;
    constructor(name: string, a_options: ExtendedAttributeDescriptor);
    getHook: (value, key: string) => any;
    get: (value, key: string) => any;
}
