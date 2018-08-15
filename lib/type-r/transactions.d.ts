import { Messenger, CallbacksByEvents, MessengersByCid, MixinsState, MessengerDefinition, eventsApi } from './object-plus';
import { ValidationError, Validatable, ChildrenErrors } from './validation';
import { Traversable } from './traversable';
import { IOEndpoint, IOPromise, IONode } from './io-tools';
export interface TransactionalDefinition extends MessengerDefinition {
    endpoint?: IOEndpoint;
}
export declare enum ItemsBehavior {
    share = 1,
    listen = 2,
    persistent = 4
}
export declare abstract class Transactional implements Messenger, IONode, Validatable, Traversable {
    static endpoint: IOEndpoint;
    static __super__: object;
    static mixins: MixinsState;
    static define: (definition?: TransactionalDefinition, statics?: object) => typeof Transactional;
    static extend: <T extends TransactionalDefinition>(definition?: T, statics?: object) => any;
    static onDefine(definitions: TransactionalDefinition, BaseClass: typeof Transactional): void;
    static onExtend(BaseClass: typeof Transactional): void;
    static create(a: any, b?: any): Transactional;
    on: (events: string | CallbacksByEvents, callback: any, context?: any) => this;
    once: (events: string | CallbacksByEvents, callback: any, context?: any) => this;
    off: (events?: string | CallbacksByEvents, callback?: any, context?: any) => this;
    trigger: (name: string, a?: any, b?: any, c?: any, d?: any, e?: any) => this;
    stopListening: (source?: Messenger, a?: string | CallbacksByEvents, b?: Function) => this;
    listenTo: (source: Messenger, a: string | CallbacksByEvents, b?: Function) => this;
    listenToOnce: (source: Messenger, a: string | CallbacksByEvents, b?: Function) => this;
    _disposed: boolean;
    readonly __inner_state__: any;
    _shared?: number;
    dispose(): void;
    initialize(): void;
    _events: eventsApi.HandlersByEvent;
    _listeningTo: MessengersByCid;
    _localEvents: eventsApi.EventMap;
    cid: string;
    cidPrefix: string;
    static shared: any;
    _changeToken: {};
    _transaction: boolean;
    _isDirty: TransactionOptions;
    _owner: Owner;
    _ownerKey: string;
    _changeEventName: string;
    onChanges(handler: Function, target?: Messenger): void;
    offChanges(handler?: Function, target?: Messenger): void;
    listenToChanges(target: Transactional, handler: any): void;
    constructor(cid: string | number);
    abstract clone(options?: CloneOptions): this;
    transaction(fun: (self: this) => void, options?: TransactionOptions): void;
    updateEach(iteratee: (val: any, key: string | number) => void, options?: TransactionOptions): void;
    set(values: any, options?: TransactionOptions): this;
    assignFrom(source: Transactional | Object): this;
    abstract _createTransaction(values: any, options?: TransactionOptions): Transaction | void;
    parse(data: any, options?: TransactionOptions): any;
    abstract toJSON(options?: object): {};
    abstract get(key: string): any;
    deepGet(reference: string): any;
    getOwner(): Owner;
    _defaultStore: Transactional;
    getStore(): Transactional;
    abstract each(iteratee: (val: any, key: string | number) => void, context?: any): any;
    map<T>(iteratee: (val: any, key: string | number) => T, context?: any): T[];
    _endpoint: IOEndpoint;
    _ioPromise: IOPromise<this>;
    hasPendingIO(): IOPromise<this>;
    fetch(options?: object): IOPromise<this>;
    getEndpoint(): IOEndpoint;
    mapObject<T>(iteratee: (val: any, key: string | number) => T, context?: any): {
        [key: string]: T;
    };
    _validationError: ValidationError;
    readonly validationError: ValidationError;
    abstract _validateNested(errors: ChildrenErrors): number;
    validate(obj?: Transactional): any;
    getValidationError(key: string): any;
    deepValidationError(reference: string): any;
    eachValidationError(iteratee: (error: any, key: string, object: Transactional) => void): void;
    isValid(key: string): boolean;
    valueOf(): Object;
    toString(): string;
    getClassName(): string;
    abstract _log(level: string, text: string, value: any): void;
}
export interface CloneOptions {
    pinStore?: boolean;
}
export interface Owner extends Traversable, Messenger {
    _onChildrenChange(child: Transactional, options: TransactionOptions): void;
    getOwner(): Owner;
    getStore(): Transactional;
}
export interface Transaction {
    object: Transactional;
    commit(initiator?: Transactional): any;
}
export interface TransactionOptions {
    parse?: boolean;
    silent?: boolean;
    merge?: boolean;
    remove?: boolean;
    reset?: boolean;
    unset?: boolean;
    validate?: boolean;
    ioUpdate?: boolean;
    upsert?: boolean;
}
export declare const transactionApi: {
    begin(object: Transactional): boolean;
    markAsDirty(object: Transactional, options: TransactionOptions): boolean;
    commit(object: Transactional, initiator?: Transactional): void;
    aquire(owner: Owner, child: Transactional, key?: string): boolean;
    free(owner: Owner, child: Transactional): void;
};
