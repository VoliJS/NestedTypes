import { Record } from '../record';
import { TransactionOptions } from '../transactions';
import { CollectionCore } from './commons';
export declare function removeOne(collection: CollectionCore, el: Record | {} | string, options: TransactionOptions): Record;
export declare function removeMany(collection: CollectionCore, toRemove: any[], options: any): any[];
