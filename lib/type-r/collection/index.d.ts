import { tools, EventMap, EventsDefinition } from '../object-plus';
import { Transactional, CloneOptions, TransactionOptions, TransactionalDefinition } from '../transactions';
import { Record, AggregatedType } from '../record';
import { CollectionCore, CollectionTransaction } from './commons';
import { AddOptions } from './add';
import { IOPromise } from '../io-tools';
export declare type GenericComparator = string | ((x: Record) => number) | ((a: Record, b: Record) => number);
export interface CollectionOptions extends TransactionOptions {
    comparator?: GenericComparator;
    model?: typeof Record;
}
export declare type Predicate<R> = (val: R, key: number) => boolean | object;
export interface CollectionDefinition extends TransactionalDefinition {
    model?: typeof Record;
    itemEvents?: EventsDefinition;
    _itemEvents?: EventMap;
}
export declare class Collection<R extends Record = Record> extends Transactional implements CollectionCore {
    _shared: number;
    _aggregationError: R[];
    static Subset: typeof Collection;
    static Refs: typeof Collection;
    static _SubsetOf: typeof Collection;
    createSubset(models: ElementsArg, options: any): any;
    static onExtend(BaseClass: typeof Transactional): void;
    static onDefine(definition: CollectionDefinition, BaseClass: any): void;
    static subsetOf: (collectionReference: any) => any;
    _itemEvents: EventMap;
    models: R[];
    readonly __inner_state__: R[];
    _byId: {
        [id: string]: R;
    };
    comparator: GenericComparator;
    getStore(): Transactional;
    _store: Transactional;
    _comparator: (a: R, b: R) => number;
    _onChildrenChange(record: R, options?: TransactionOptions, initiator?: Transactional): void;
    get(objOrId: string | R | Object): R;
    each(iteratee: (val: R, key: number) => void, context?: any): void;
    forEach(iteratee: (val: R, key?: number) => void, context?: any): void;
    every(iteratee: Predicate<R>, context?: any): boolean;
    filter(iteratee: Predicate<R>, context?: any): R[];
    find(iteratee: Predicate<R>, context?: any): R;
    some(iteratee: Predicate<R>, context?: any): boolean;
    map<T>(iteratee: (val: R, key: number) => T, context?: any): T[];
    _validateNested(errors: {}): number;
    model: typeof Record;
    idAttribute: string;
    constructor(records?: (R | {})[], options?: CollectionOptions, shared?: number);
    initialize(): void;
    readonly length: number;
    first(): R;
    last(): R;
    at(a_index: number): R;
    clone(options?: CloneOptions): this;
    toJSON(options?: object): any;
    set(elements?: ElementsArg, options?: TransactionOptions): this;
    liveUpdates(enabled: LiveUpdatesOption): IOPromise<this>;
    _liveUpdates: object;
    fetch(a_options?: {
        liveUpdates?: LiveUpdatesOption;
    } & TransactionOptions): IOPromise<this>;
    dispose(): void;
    reset(a_elements?: ElementsArg, options?: TransactionOptions): R[];
    add(a_elements: ElementsArg, options?: AddOptions): Record[];
    remove(recordsOrIds: any, options?: CollectionOptions): R[] | R;
    _createTransaction(a_elements: ElementsArg, options?: TransactionOptions): CollectionTransaction | void;
    static _attribute: typeof AggregatedType;
    pluck(key: keyof R): any[];
    sort(options?: TransactionOptions): this;
    push(model: ElementsArg, options: CollectionOptions): Record[];
    pop(options: CollectionOptions): R;
    unset(modelOrId: R | string, options?: any): R;
    unshift(model: ElementsArg, options: CollectionOptions): Record[];
    shift(options?: CollectionOptions): R;
    slice(): R[];
    indexOf(modelOrId: any): number;
    modelId(attrs: {}): any;
    toggle(model: R, a_next?: boolean): boolean;
    _log(level: tools.LogLevel, text: string, value: any): void;
    getClassName(): string;
}
export declare type LiveUpdatesOption = boolean | ((x: any) => boolean);
export declare type ElementsArg = Object | Record | Object[] | Record[];
