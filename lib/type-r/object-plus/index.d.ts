import * as tools from './tools';
export { tools };
export * from './mixins';
export * from './messenger';
import * as eventsApi from './eventsource';
export { eventsApi };
import { MixableConstructor } from './mixins';
declare global  {
    interface ObjectConstructor {
        assign<T>(dest: T, ...sources: Object[]): T;
        log: tools.Log;
        extend(protoProps: {}, staticProps: {}): MixableConstructor<any>;
    }
}
