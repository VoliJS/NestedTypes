import { Model } from 'type-r';
export declare const ModelMixin: {
    pick(...args: any[]): any;
    values(this: Model): any[];
    each: (iteratee: (value?: any, key?: string) => void, context?: any) => void;
    escape(attr: any): any;
    matches(attrs: any): boolean;
    omit(...keys: string[]): {};
    invert(): {};
    pairs(): any;
    isEmpty(): boolean;
    chain(): any;
};
export declare const CollectionMixin: {
    where(attrs: any, first: any): any;
    findWhere(attrs: any): any;
};
