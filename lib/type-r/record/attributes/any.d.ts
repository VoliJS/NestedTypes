import { AttributesContainer, AttributeUpdatePipeline, RecordTransaction } from './updates';
import { tools } from '../../object-plus';
import { TransactionOptions } from '../../transactions';
import { IOEndpoint } from '../../io-tools';
declare global {
    interface Function {
        _attribute: typeof AnyType;
    }
}
export declare type Transform = (this: AnyType, next: any, prev: any, record: AttributesContainer, options: TransactionOptions) => any;
export declare type ChangeHandler = (this: AnyType, next: any, prev: any, record: AttributesContainer, options: TransactionOptions) => void;
export interface AttributeOptions {
    _attribute?: typeof AnyType;
    validate?: (record: AttributesContainer, value: any, key: string) => any;
    isRequired?: boolean;
    changeEvents?: boolean;
    endpoint?: IOEndpoint;
    type?: Function;
    value?: any;
    hasCustomDefault?: boolean;
    parse?: Parse;
    toJSON?: AttributeToJSON;
    getHooks?: GetHook[];
    transforms?: Transform[];
    changeHandlers?: ChangeHandler[];
    _onChange?: ChangeAttrHandler;
}
export declare type Parse = (value: any, key: string) => any;
export declare type GetHook = (value: any, key: string) => any;
export declare type AttributeToJSON = (value: any, key: string) => any;
export declare type AttributeParse = (value: any, key: string) => any;
export declare type ChangeAttrHandler = ((value: any, attr: string) => void) | string;
export declare class AnyType implements AttributeUpdatePipeline {
    name: string;
    static create(options: AttributeOptions, name: string): AnyType;
    canBeUpdated(prev: any, next: any, options: TransactionOptions): any;
    transform(next: any, prev: any, model: AttributesContainer, options: TransactionOptions): any;
    convert(next: any, prev: any, model: AttributesContainer, options: TransactionOptions): any;
    isChanged(a: any, b: any): boolean;
    handleChange(next: any, prev: any, model: AttributesContainer, options: TransactionOptions): void;
    create(): any;
    clone(value: any, record: AttributesContainer): any;
    dispose(record: AttributesContainer, value: any): void;
    validate(record: AttributesContainer, value: any, key: string): void;
    toJSON(value: any, key: any, options?: object): any;
    createPropertyDescriptor(): PropertyDescriptor | void;
    value: any;
    static defaultValue: any;
    type: Function;
    initialize(name: string, options: TransactionOptions): void;
    options: AttributeOptions;
    doInit(value: any, record: AttributesContainer, options: TransactionOptions): any;
    doUpdate(value: any, record: AttributesContainer, options: TransactionOptions, nested?: RecordTransaction[]): boolean;
    propagateChanges: boolean;
    _log(level: tools.LogLevel, text: string, value: any, record: AttributesContainer): void;
    defaultValue(): any;
    constructor(name: string, a_options: AttributeOptions);
    getHook: (value: any, key: string) => any;
    get: (value: any, key: string) => any;
}
