import { Collection } from '../collection';
import { Record } from '../record';
export declare type CollectionReference = (() => Collection) | Collection | string;
export declare function parseReference(collectionRef: CollectionReference): (root: Record) => Collection;
