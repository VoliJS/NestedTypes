import { IOEndpoint } from '../io-tools';
import { eventsApi } from '../object-plus';
import { AnyType } from './metatypes';
import { ConstructorsMixin } from './updates';
export interface RecordAttributesMixin extends ConstructorsMixin {
    _attributes: AttributeDescriptors;
    _attributesArray: AnyType[];
    properties: PropertyDescriptorMap;
    _localEvents?: eventsApi.EventMap;
    _endpoints: {
        [name: string]: IOEndpoint;
    };
}
export interface AttributeDescriptors {
    [name: string]: AnyType;
}
export declare function createAttribute(spec: any, name: string): AnyType;
export declare function createAttributesMixin(attributesDefinition: object, baseClassAttributes: AttributeDescriptors): RecordAttributesMixin;
