import { tools } from '../object-plus';
import { CloneOptions, Transactional, TransactionalDefinition, Transaction, TransactionOptions, Owner } from '../transactions';
import { ChildrenErrors } from '../validation';
import { Collection } from '../collection';
import { AnyType, AttributesValues, AttributesContainer, AttributesConstructor, AttributesCopyConstructor } from './attributes';
export interface ConstructorOptions extends TransactionOptions {
    clone?: boolean;
}
export interface RecordDefinition extends TransactionalDefinition {
    idAttribute?: string;
    attributes?: AttributesValues;
    collection?: object;
    Collection?: typeof Transactional;
}
export declare class Record extends Transactional implements AttributesContainer {
    static onDefine(definition: any, BaseClass: any): void;
    static Collection: typeof Collection;
    static DefaultCollection: typeof Collection;
    static from: (collectionReference: any) => any;
    static defaults(attrs: AttributesValues): typeof Record;
    static attributes: AttributesValues;
    _previousAttributes: {};
    previousAttributes(): AttributesValues;
    attributes: AttributesValues;
    readonly __inner_state__: AttributesValues;
    _changedAttributes: AttributesValues;
    readonly changed: AttributesValues;
    changedAttributes(diff?: {}): boolean | {};
    hasChanged(key?: string): boolean;
    previous(key: string): any;
    isNew(): boolean;
    has(key: string): boolean;
    unset(key: string, options?: any): any;
    clear(options?: any): this;
    getOwner(): Owner;
    idAttribute: string;
    id: string | number;
    _attributes: {
        [key: string]: AnyType;
    };
    _attributesArray: AnyType[];
    Attributes: AttributesConstructor;
    AttributesCopy: AttributesCopyConstructor;
    forEachAttr(attrs: {}, iteratee: (value: any, key?: string, spec?: AnyType) => void): void;
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
    readonly collection: any;
    dispose(): void;
    _log(level: tools.LogLevel, text: string, props: object): void;
    getClassName(): string;
    _createTransaction(values: object, options: TransactionOptions): Transaction;
    forceAttributeChange: (key: string, options: TransactionOptions) => void;
    _onChildrenChange: (child: Transactional, options: TransactionOptions) => void;
}
