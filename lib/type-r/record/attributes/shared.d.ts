import { Record } from '../transaction';
import { AnyType } from './generic';
import { Transactional, TransactionOptions, TransactionalConstructor } from '../../transactions';
export declare class SharedType extends AnyType {
    type: TransactionalConstructor;
    clone(value: Transactional, record: Record): Transactional;
    toJSON(): void;
    canBeUpdated(prev: Transactional, next: any, options: TransactionOptions): any;
    convert(value: any, options: TransactionOptions, prev: any, record: Record): Transactional;
    validate(model: any, value: any, name: any): void;
    create(): Transactional;
    _handleChange(next: Transactional, prev: Transactional, record: Record): void;
    dispose(record: Record, value: Transactional): void;
    _onChange: (child: Transactional, options: TransactionOptions, initiator: Transactional) => void;
    initialize(options: any): void;
}
