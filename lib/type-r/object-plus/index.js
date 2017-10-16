import * as tools from './tools';
export { tools };
export * from './mixins';
export * from './events';
import * as eventsApi from './eventsource';
export { eventsApi };
import { Mixable } from './mixins';
Object.extend = function (protoProps, staticProps) { return Mixable.extend(protoProps, staticProps); };
Object.assign || (Object.assign = tools.assign);
Object.log = tools.log;
//# sourceMappingURL=index.js.map