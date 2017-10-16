import { Transactional, Transaction, TransactionOptions, Owner } from "../../transactions";
export interface ConstructorsMixin {
    Attributes: AttributesConstructor;
    AttributesCopy: AttributesCopyConstructor;
}
export interface ConstructorOptions extends TransactionOptions {
    clone?: boolean;
}
export declare type AttributesConstructor = new (record: AttributesContainer, values: object, options: TransactionOptions) => AttributesValues;
export declare type AttributesCopyConstructor = new (values: object) => AttributesValues;
export interface AttributesContainer extends Transactional, Owner, ConstructorsMixin {
    _attributes: AttributesDescriptors;
    attributes: AttributesValues;
    _previousAttributes: AttributesValues;
    _changedAttributes: AttributesValues;
}
export interface AttributesValues {
    [name: string]: any;
}
export interface AttributesDescriptors {
    [name: string]: AttributeUpdatePipeline;
}
export interface AttributeUpdatePipeline {
    doUpdate(value: any, record: AttributesContainer, options: TransactionOptions, nested?: Transaction[]): boolean;
}
export declare function setAttribute(record: AttributesContainer, name: string, value: any): void;
export declare const UpdateRecordMixin: {
    transaction(this: AttributesContainer, fun: (self: AttributesContainer) => void, options?: TransactionOptions): void;
    _onChildrenChange(child: Transactional, options: TransactionOptions): void;
    forceAttributeChange(key: string, options?: TransactionOptions): void;
    _createTransaction(this: AttributesContainer, a_values: {}, options?: TransactionOptions): Transaction;
};
export declare function constructorsMixin(attrDefs: AttributesDescriptors): ConstructorsMixin;
export declare function shouldBeAnObject(record: AttributesContainer, values: object): boolean;
export declare class RecordTransaction implements Transaction {
    object: AttributesContainer;
    isRoot: boolean;
    nested: Transaction[];
    changes: string[];
    constructor(object: AttributesContainer, isRoot: boolean, nested: Transaction[], changes: string[]);
    commit(initiator?: AttributesContainer): void;
}
