// (c) 2016 Vlad Balin and Volicon
// MixtureJS may be freely distributed under the MIT license. 

import * as tools from './tools'
export { tools }
export * from './mixins'
export * from './messenger'
import * as eventsApi from './eventsource'
export { eventsApi }

import { Mixable, MixableConstructor } from './mixins'

declare global {
    interface ObjectConstructor {
        /** Polyfill for Object.assign */
        assign< T >( dest : T, ...sources : Object[] ) : T

        /** Global logging interface, for console debugging. */
        log : tools.Log

        /** ES5 Object.extend */
        extend( protoProps : {}, staticProps : {} ) : MixableConstructor< any >
    }
}

Object.extend = ( protoProps, staticProps ) => Mixable.extend( protoProps, staticProps );
Object.assign || ( Object.assign = tools.assign );
Object.log = tools.log;