export interface Subclass<T> extends MixableConstructor {
    new (...args: any[]): T;
    prototype: T;
}
export interface MixableConstructor extends Function {
    __super__?: object;
    mixins?: MixinsState;
    onExtend?: (BaseClass: Function) => void;
    onDefine?: (definition: object, BaseClass: Function) => void;
    define?: (definition?: object, statics?: object) => MixableConstructor;
    extend?: <T extends object>(definition?: T, statics?: object) => Subclass<T>;
}
export interface MixableDefinition {
    mixins?: Mixin[];
}
export declare class Mixable {
    static onExtend: (BaseClass: Function) => void;
    static onDefine: (definition: object, BaseClass: Function) => object;
    static __super__: object;
    static mixins: MixinsState;
    static define(protoProps?: MixableDefinition, staticProps?: object): MixableConstructor;
    static extend<T extends object>(spec?: T, statics?: {}): Subclass<T>;
}
export declare function predefine(Constructor: MixableConstructor): void;
export declare function define(ClassOrDefinition: Function): void;
export declare function define(ClassOrDefinition: object): ClassDecorator;
export declare function definitions(rules: MixinMergeRules): ClassDecorator;
export declare function propertyListDecorator(listName: string): PropertyDecorator;
export declare function definitionDecorator(definitionKey: any, value: any): (proto: object, name: string) => void;
export declare class MixinsState {
    Class: MixableConstructor;
    mergeRules: MixinMergeRules;
    definitionRules: MixinMergeRules;
    definitions: object;
    appliedMixins: Mixin[];
    static get(Class: any): MixinsState;
    constructor(Class: MixableConstructor);
    getStaticDefinitions(BaseClass: Function): {
        [key: string]: any;
    };
    merge(mixins: Mixin[]): void;
    populate(...ctors: Function[]): void;
    mergeObject(dest: object, source: object, unshift?: boolean): void;
    mergeInheritedMembers(BaseClass: Function): void;
}
export interface MixinMergeRules {
    [name: string]: MixinMergeRule;
}
export declare type MixinMergeRule = (a: any, b: any) => any;
export declare type Mixin = {
    [key: string]: any;
} | Function;
export interface MixinRulesDecorator {
    (rules: MixinMergeRules): ClassDecorator;
    value(a: object, b: object): object;
    protoValue(a: object, b: object): object;
    merge(a: object, b: object): object;
    pipe(a: Function, b: Function): Function;
    defaults(a: Function, b: Function): Function;
    classFirst(a: Function, b: Function): Function;
    classLast(a: Function, b: Function): Function;
    every(a: Function, b: Function): Function;
    some(a: Function, b: Function): Function;
}
export declare const mixins: (...list: Mixin[]) => (Class: Function) => void;
export declare const mixinRules: MixinRulesDecorator;
