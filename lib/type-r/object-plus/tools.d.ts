export declare function defaults<T>(dest: T, ...sources: Object[]): T;
export declare type Logger = (level: LogLevel, error: string, props?: object) => void;
export declare type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug' | 'log';
export interface Log extends Logger {
    level: number;
    throw: number;
    stop: number;
    logger: Logger;
}
export declare const log: Log;
export declare function isValidJSON(value: any): boolean;
export declare function getBaseClass(Class: Function): any;
export declare function assignToClassProto<T, K extends keyof T>(Class: any, definition: T, ...names: K[]): void;
export declare function isEmpty(obj: {}): boolean;
export declare type Iteratee = (value: any, key?: string | number) => any;
export declare function some(obj: any, fun: Iteratee): any;
export declare function every(obj: {}, predicate: Iteratee): boolean;
export declare function getPropertyDescriptor(obj: {}, prop: string): PropertyDescriptor;
export declare function omit(source: {}, ...rest: string[]): {};
export declare function transform<A, B>(dest: {
    [key: string]: A;
}, source: {
    [key: string]: B;
}, fun: (value: B, key: string) => A | void): {
    [key: string]: A;
};
export declare function fastAssign<A>(dest: A, source: {}): A;
export declare function fastDefaults<A>(dest: A, source: {}): A;
export declare function assign<T>(dest: T, ...sources: Object[]): T;
export declare function keys(o: any): string[];
export declare function once(func: Function): Function;
export declare function notEqual(a: any, b: any): boolean;
export declare function hashMap(obj?: any): any;
