import { IOEndpoint } from '../io-tools';
import { EventsDefinition } from '../object-plus';
import { AttributeOptions, Parse, AnyType } from './metatypes';
export interface AttributeCheck {
    (value: any, key: string): boolean;
    error?: any;
}
export declare class ChainableAttributeSpec {
    options: AttributeOptions;
    constructor(options: AttributeOptions);
    check(check: AttributeCheck, error?: any): ChainableAttributeSpec;
    readonly asProp: (proto: object, name: string) => void;
    readonly as: (proto: object, name: string) => void;
    readonly isRequired: ChainableAttributeSpec;
    readonly required: ChainableAttributeSpec;
    endpoint(endpoint: IOEndpoint): ChainableAttributeSpec;
    watcher(ref: string | ((value: any, key: string) => void)): ChainableAttributeSpec;
    parse(fun: Parse): ChainableAttributeSpec;
    toJSON(fun: any): ChainableAttributeSpec;
    get(fun: any): ChainableAttributeSpec;
    set(fun: any): ChainableAttributeSpec;
    changeEvents(events: boolean): ChainableAttributeSpec;
    events(map: EventsDefinition): ChainableAttributeSpec;
    readonly has: ChainableAttributeSpec;
    metadata(options: AttributeOptions): ChainableAttributeSpec;
    value(x: any): ChainableAttributeSpec;
    static from(spec: any): ChainableAttributeSpec;
}
export declare function type(this: void, type: ChainableAttributeSpec | Function, value?: any): ChainableAttributeSpec;
export declare function createSharedTypeSpec(Constructor: Function, Attribute: typeof AnyType): void;
