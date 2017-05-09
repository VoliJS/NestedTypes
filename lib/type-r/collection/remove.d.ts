import { Record } from '../record';
import { CollectionCore } from './commons';
import { TransactionOptions } from '../transactions';
export declare function removeOne(collection: CollectionCore, el: Record | {} | string, options: TransactionOptions): Record;
export declare function removeMany(collection: CollectionCore, toRemove: any[], options: any): any[];
