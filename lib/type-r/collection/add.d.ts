import { CollectionTransaction, CollectionOptions, CollectionCore } from './commons';
export interface AddOptions extends CollectionOptions {
    at?: number;
}
export declare function addTransaction(collection: CollectionCore, items: any[], options: AddOptions, merge?: boolean): CollectionTransaction;
