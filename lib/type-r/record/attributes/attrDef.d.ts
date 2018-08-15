import { AttributeOptions, Parse } from './any';
import { EventsDefinition } from '../../object-plus';
import { IOEndpoint } from '../../io-tools';
export interface AttributeCheck {
    (value: any, key: string): boolean;
    error?: any;
}
export declare class ChainableAttributeSpec {
    options: AttributeOptions;
    constructor(options: AttributeOptions);
    check(check: AttributeCheck, error: any): ChainableAttributeSpec;
    readonly asProp: (proto: object, name: string) => void;
    readonly as: (proto: object, name: string) => void;
    readonly isRequired: ChainableAttributeSpec;
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
export declare function type(this: void, spec: ChainableAttributeSpec | Function): ChainableAttributeSpec;
declare global {
    interface Function {
        value: (x: any) => ChainableAttributeSpec;
        isRequired: ChainableAttributeSpec;
        asProp: PropertyDecorator;
        has: ChainableAttributeSpec;
    }
}
