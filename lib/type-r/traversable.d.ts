export interface Traversable {
    getStore(): Traversable;
    getOwner(): Traversable;
    get(key: string): any;
}
export declare type ResolveReference = (root: Traversable) => any;
export declare class CompiledReference {
    resolve: ResolveReference;
    tail: string;
    local: boolean;
    constructor(reference: string, splitTail?: boolean);
}
export declare function resolveReference(root: Traversable, reference: string, action: (object: any, key: string) => any): any;
