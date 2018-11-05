import { AnyType } from './any';
import { Transactional, TransactionOptions } from '../../transactions';
import { AttributesContainer, ConstructorOptions } from './updates';
import { ValidationError } from '../../validation';
export declare class AggregatedType extends AnyType {
    type: typeof Transactional;
    clone(value: Transactional): Transactional;
    toJSON(x: any, key: string, options: object): any;
    doInit(value: any, record: AttributesContainer, options: ConstructorOptions): any;
    doUpdate(value: any, record: any, options: any, nested: any[]): boolean;
    canBeUpdated(prev: Transactional, next: any, options: TransactionOptions): any;
    convert(next: any, prev: any, record: AttributesContainer, options: TransactionOptions): Transactional;
    dispose(record: AttributesContainer, value: Transactional): void;
    validate(record: AttributesContainer, value: Transactional): ValidationError;
    create(): Transactional;
    initialize(options: any): void;
    _handleChange(next: Transactional, prev: Transactional, record: AttributesContainer, options: TransactionOptions): void;
}
