export declare class Log {
    level: number;
    stops: LogOptions;
    throws: LogOptions;
    counts: {
        error: number;
        warn: number;
        info: number;
        debug: number;
    };
    logger: Logger;
    private doLogging(type, args);
    reset(): this;
    developer(trueDeveloper?: boolean): this;
    constructor();
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
    readonly state: string;
}
export interface Logger {
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
}
export interface LogOptions {
    error?: boolean;
    warn?: boolean;
    info?: boolean;
    debug?: boolean;
}
export declare let log: Log;
export declare function isValidJSON(value: any): boolean;
export declare function getBaseClass(Class: Function): any;
export declare function getChangedStatics(Ctor: Function, ...names: string[]): {};
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
export declare function defaults<T>(dest: T, ...sources: Object[]): T;
declare global  {
    interface ObjectConstructor {
        setPrototypeOf(target: Object, proto: Object): any;
    }
}
export declare function keys(o: any): string[];
export declare function once(func: Function): Function;
export declare function notEqual(a: any, b: any): boolean;
export {};
