export interface ClassDefinition {
    properties?: PropertyMap | boolean;
    mixins?: Mixin[];
    mixinRules?: MixinRules;
    [name: string]: any;
}
export interface PropertyMap {
    [name: string]: Property;
}
export declare type Property = PropertyDescriptor | (() => any);
export declare type Mixin = Constructor<any> | {};
export interface MixinRules {
    [propertyName: string]: MergeRule | MixinRules;
}
export declare type MergeRule = 'merge' | 'mergeSequence' | 'pipe' | 'sequence' | 'reverse' | 'every' | 'some';
export interface Constructor<T> {
    new (...args: any[]): T;
}
export interface MixableConstructor<T> extends Constructor<T> {
    prototype: T;
    create(a: any, b?: any): T;
    mixins(...mixins: (Constructor<any> | {})[]): MixableConstructor<T>;
    mixinRules(mixinRules: MixinRules): MixableConstructor<T>;
    mixTo(...args: Constructor<any>[]): MixableConstructor<T>;
    define(definition: ClassDefinition, staticProps?: {}): MixableConstructor<T>;
    extend(spec?: ClassDefinition, statics?: {}): MixableConstructor<T>;
    predefine(): MixableConstructor<T>;
}
export declare class Mixable {
    constructor();
    initialize(): void;
    static create(a: any, b?: any): Mixable;
    protected static _mixinRules: MixinRules;
    static _appliedMixins: any[];
    static mixins(...mixins: (Mixin | Mixin[])[]): typeof Mixable;
    static mixTo<T>(...args: Function[]): typeof Mixable;
    static mixinRules(mixinRules: MixinRules): MixableConstructor<Mixable>;
    static define(definition?: ClassDefinition, staticProps?: {}): typeof Mixable;
    static extend(spec?: ClassDefinition, statics?: {}): typeof Mixable;
    static predefine(): typeof Mixable;
    static __super__: {};
}
export declare function mixinRules(rules: MixinRules): (Ctor: Function) => void;
export declare function mixins(...list: {}[]): (Ctor: Function) => void;
export declare function extendable(Type: Function): void;
export declare function predefine(Constructor: MixableConstructor<any>): void;
export declare function define(spec: ClassDefinition): ClassDecorator;
export declare function define(spec: MixableConstructor<any>): void;
export declare function mergeProps<T extends {}>(target: T, source: {}, rules?: MixinRules): T;
