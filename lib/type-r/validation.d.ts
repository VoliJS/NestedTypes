export interface ChildrenErrors {
    [key: string]: ValidationError | any;
}
export interface Validatable {
    _validateNested(errors: ChildrenErrors): number;
    validate(self: any): any;
    get(key: string): any;
}
export declare class ValidationError {
    nested: ChildrenErrors;
    length: number;
    error: any;
    constructor(obj: Validatable);
    each(iteratee: (value: any, key: string) => void): void;
    eachError(iteratee: (error: any, key: string, object: Validatable) => void, object: Validatable): void;
}
