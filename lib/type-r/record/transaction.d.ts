import { ClassDefinition, Constructor } from '../object-plus';
import { CloneOptions, Transactional, Transaction, TransactionOptions, Owner } from '../transactions';
import { ChildrenErrors } from '../validation';
export interface RecordDefinition extends ClassDefinition {
    attributes?: AttributeDescriptorMap;
    defaults?: AttributeDescriptorMap | (() => AttributeDescriptorMap);
    collection?: typeof Transactional | {};
    Collection?: typeof Transactional;
}
export interface AttributeDescriptorMap {
    [name: string]: AttributeDescriptor;
}
export interface AttributeDescriptor {
    type?: Constructor<any>;
    value?: any;
    parse?: AttributeParse;
    toJSON?: AttributeToJSON;
    getHooks?: GetHook[];
    transforms?: Transform[];
    changeHandlers?: ChangeHandler[];
    _onChange?: ChangeAttrHandler;
}
export declare type GetHook = (value: any, key: string) => any;
export declare type ChangeAttrHandler = ((value: any, attr: string) => void) | string;
export declare type Transform = (next: any, options: TransactionOptions, prev: any, record: Record) => any;
export declare type ChangeHandler = (next: any, prev: any, record: Record) => void;
export declare type AttributeToJSON = (value: any, key: string) => any;
export declare type AttributeParse = (value: any, key: string) => any;
export interface AttributesValues {
    id?: string | number;
    [key: string]: any;
}
export declare type CloneAttributesCtor = new (x: AttributesValues) => AttributesValues;
export interface AttributesSpec {
    [key: string]: Attribute;
}
export interface Attribute extends AttributeUpdatePipeline, AttributeSerialization {
    clone(value: any, record: Record): any;
    create(): any;
    dispose(record: Record, value: any): void;
    validate(record: Record, value: any, key: string): any;
}
export interface AttributeUpdatePipeline {
    canBeUpdated(prev: any, next: any, options: TransactionOptions): any;
    transform: Transform;
    isChanged(a: any, b: any): boolean;
    handleChange: ChangeHandler;
    propagateChanges: boolean;
}
export interface AttributeSerialization {
    toJSON: AttributeToJSON;
    parse: AttributeParse;
}
export interface ConstructorOptions extends TransactionOptions {
    clone?: boolean;
}
export declare class Record extends Transactional implements Owner {
    static define(protoProps: RecordDefinition, staticProps?: any): typeof Record;
    static predefine: () => typeof Record;
    static Collection: typeof Transactional;
    static from: (collectionReference: any) => any;
    static defaults(attrs: AttributeDescriptorMap): typeof Record;
    _previousAttributes: {};
    previousAttributes(): any;
    attributes: AttributesValues;
    readonly __inner_state__: AttributesValues;
    _changedAttributes: AttributesValues;
    readonly changed: AttributesValues;
    changedAttributes(diff?: {}): boolean | {};
    hasChanged(key?: string): boolean;
    previous(key: string): any;
    isNew(): boolean;
    has(key: string): boolean;
    unset(key: any, options?: any): this;
    clear(options?: any): this;
    getOwner(): Owner;
    idAttribute: string;
    id: string | number;
    _attributes: AttributesSpec;
    _keys: string[];
    Attributes(x: AttributesValues): void;
    forEachAttr(attrs: {}, iteratee: (value: any, key?: string, spec?: Attribute) => void): void;
    each(iteratee: (value?: any, key?: string) => void, context?: any): void;
    keys(): string[];
    values(): any[];
    _toJSON(): {};
    _parse(data: any): any;
    defaults(values?: {}): {};
    constructor(a_values?: {}, a_options?: ConstructorOptions);
    initialize(values?: any, options?: any): void;
    clone(options?: CloneOptions): this;
    deepClone(): this;
    _validateNested(errors: ChildrenErrors): number;
    get(key: string): any;
    toJSON(): Object;
    parse(data: any, options?: TransactionOptions): any;
    deepSet(name: string, value: any, options?: any): this;
    transaction(fun: (self: this) => void, options?: TransactionOptions): void;
    _createTransaction(a_values: {}, options?: TransactionOptions): Transaction;
    _onChildrenChange(child: Transactional, options: TransactionOptions): void;
    forceAttributeChange(key: string, options?: TransactionOptions): void;
    readonly collection: any;
    dispose(): void;
    _log(level: string, text: string, value: any): void;
    getClassName(): string;
}
export declare function setAttribute(record: Record, name: string, value: any): void;
