import { AnyType } from './any';
import { AttributesContainer, ConstructorOptions } from './updates';
import { Transactional, TransactionOptions } from '../../transactions';
export declare class SharedType extends AnyType {
    type: typeof Transactional;
    doInit(value: any, record: AttributesContainer, options: ConstructorOptions): any;
    doUpdate(value: any, record: any, options: any, nested: any[]): boolean;
    clone(value: Transactional, record: AttributesContainer): Transactional;
    toJSON(): void;
    canBeUpdated(prev: Transactional, next: any, options: TransactionOptions): any;
    convert(next: any, prev: any, record: AttributesContainer, options: TransactionOptions): Transactional;
    validate(model: any, value: any, name: any): void;
    create(): Transactional;
    _handleChange(next: Transactional, prev: Transactional, record: AttributesContainer, options: any): void;
    dispose(record: AttributesContainer, value: Transactional): void;
    _onChange: (child: Transactional, options: TransactionOptions, initiator: Transactional) => void;
    initialize(options: any): void;
}
