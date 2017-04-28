import { AnyType } from './attributes';
import { Attribute, AttributeDescriptorMap, CloneAttributesCtor } from './transaction';
import { eventsApi } from '../object-plus';
export interface DynamicMixin {
    _attributes: AttributesSpec;
    Attributes: CloneAttributesCtor;
    properties: PropertyDescriptorMap;
    forEachAttr?: ForEach;
    defaults: Defaults;
    _toJSON: ToJSON;
    _parse?: Parse;
    _localEvents: eventsApi.EventMap;
    _keys: string[];
}
export interface AttributesSpec {
    [key: string]: AnyType;
}
export declare type ForEach = (obj: {}, iteratee: (val: any, key?: string, spec?: Attribute) => void) => void;
export declare type Defaults = (attrs?: {}) => {};
export declare type Parse = (data: any) => any;
export declare type ToJSON = () => any;
export declare function compile(rawSpecs: AttributeDescriptorMap, baseAttributes: AttributesSpec): DynamicMixin;
export declare function createForEach(attrSpecs: AttributesSpec): ForEach;
export declare function createCloneCtor(attrSpecs: AttributesSpec): CloneAttributesCtor;
