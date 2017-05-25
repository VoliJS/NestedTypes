import { AttributeDescriptor } from './attributes';
import { EventsDefinition } from '../object-plus';
export interface AttributeCheck {
    (value: any, key: string): boolean;
    error?: any;
}
export declare class ChainableAttributeSpec {
    options: AttributeDescriptor;
    constructor(options: AttributeDescriptor);
    check(check: AttributeCheck, error: any): ChainableAttributeSpec;
    readonly isRequired: ChainableAttributeSpec;
    watcher(ref: string | ((value: any, key: string) => void)): ChainableAttributeSpec;
    parse(fun: any): ChainableAttributeSpec;
    toJSON(fun: any): ChainableAttributeSpec;
    get(fun: any): ChainableAttributeSpec;
    set(fun: any): ChainableAttributeSpec;
    changeEvents(events: boolean): ChainableAttributeSpec;
    events(map: EventsDefinition): ChainableAttributeSpec;
    readonly has: ChainableAttributeSpec;
    metadata(options: AttributeDescriptor): ChainableAttributeSpec;
    value(x: any): ChainableAttributeSpec;
}
declare global  {
    interface Function {
        value: (x: any) => ChainableAttributeSpec;
        isRequired: ChainableAttributeSpec;
        has: ChainableAttributeSpec;
    }
}
export declare function toAttributeDescriptor(spec: any): AttributeDescriptor;
