import { IOEndpoint, Record } from 'type-r';
export declare function proxyIO(record: typeof Record): ProxyEndpoint;
export declare class ProxyEndpoint implements IOEndpoint {
    Record: typeof Record;
    readonly endpoint: IOEndpoint;
    constructor(record: typeof Record);
    subscribe(events: any, target: any): Promise<any>;
    unsubscribe(events: any, target: any): void;
    list(options: any): Promise<any>;
    update(id: any, json: any, options: any): Promise<{
        _cas: any;
    }>;
    create(json: any, options: any): Promise<{
        id: any;
        _cas: any;
        _type: any;
    }>;
    read(id: any, options: object): Promise<any>;
    destroy(id: string, options: object): Promise<{}>;
}
