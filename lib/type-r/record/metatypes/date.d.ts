import { TransactionOptions } from '../../transactions';
import { AnyType } from './any';
import { AttributesContainer } from '../updates';
export declare class DateType extends AnyType {
    create(): Date;
    convert(next: any, a: any, record: any, options: any): any;
    validate(model: any, value: any, name: any): string;
    toJSON(value: any): any;
    isChanged(a: any, b: any): boolean;
    doInit(value: any, record: AttributesContainer, options: TransactionOptions): any;
    doUpdate(value: any, record: any, options: any, nested: any): boolean;
    clone(value: any): Date;
    dispose(): void;
}
