export declare const ModelMixin: {
    pick(...args: any[]): any;
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
