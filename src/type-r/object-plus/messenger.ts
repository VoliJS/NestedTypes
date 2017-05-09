import * as Mixins from './mixins'
import { omit } from './tools'
import { EventMap, EventsDefinition, EventSource, HandlersByEvent } from './eventsource'
import * as _eventsApi from './eventsource'

const { mixins, define, extendable } = Mixins,
      // Force extranction to the local variabled.
      { EventHandler, strings, on, off, once, trigger5, trigger2, trigger3 } = _eventsApi;

/** @hidden */
const eventSplitter = /\s+/;

/** @hidden */
let _idCount = 0;

/** @hidden */
function uniqueId() : string {
    return 'l' + _idCount++;
}

export { EventMap, EventsDefinition }

export interface MessengerDefinition extends Mixins.ClassDefinition {
    _localEvents? : EventMap
    localEvents? : EventsDefinition
}

/** @hidden */
export interface MessengersByCid {
    [ cid : string ] : Messenger
}

/** @hidden */
export type CallbacksByEvents = { [ events : string ] : Function }

/*************************
 * Messenger is mixable class with capabilities of sending and receiving synchronous events.
 * This class itself can serve as both mixin and base class.
 */
@extendable
export abstract class Messenger implements Mixins.Mixable, EventSource {
    // Define extendable mixin static properties.
    static create : ( a : any, b? : any, c? : any ) => Messenger
    static mixins : ( ...mixins : ( Mixins.Constructor<any> | {} )[] ) => Mixins.MixableConstructor< Messenger >
    static mixinRules : ( mixinRules : Mixins.MixinRules ) => Mixins.MixableConstructor< Messenger >
    static mixTo : ( ...args : Mixins.Constructor<any>[] ) => Mixins.MixableConstructor< Messenger >
    static extend : (spec? : MessengerDefinition, statics? : {} ) => Mixins.MixableConstructor< Messenger >
    static predefine : () => Mixins.MixableConstructor< Messenger >

    /** @hidden */ 
    _events : HandlersByEvent = void 0;

    /** @hidden */ 
    _listeningTo : MessengersByCid = void 0

    /** Unique client-only id. */
    cid : string

    /** @hidden Prototype-only property to manage automatic local events subscription */ 
    _localEvents : EventMap

    /** @hidden */ 
    constructor(){
        this.cid = uniqueId();
        this.initialize.apply( this, arguments );
    }

    /** Method is called at the end of the constructor */
    initialize() : void {}

    /** @private */
    static define( protoProps? : MessengerDefinition , staticProps? ) : typeof Messenger {
        const spec : MessengerDefinition = omit( protoProps || {}, 'localEvents' );

        if( protoProps ){
            const { localEvents, _localEvents } = protoProps;
            if( localEvents || _localEvents ){
                const eventsMap = new EventMap( this.prototype._localEvents );
                localEvents && eventsMap.addEventsMap( localEvents );
                _localEvents && eventsMap.merge( _localEvents );
                spec._localEvents = eventsMap;
            }
        }

        return Mixins.Mixable.define.call( this, spec, staticProps );
    }
    
    on( events : string | CallbacksByEvents, callback, context? ) : this {
        if( typeof events === 'string' ) strings( on, this, events, callback, context );
        else for( let name in events ) strings( on, this, name, events[ name ], context || callback );

        return this;
    }

    once( events : string | CallbacksByEvents, callback, context? ) : this {
        if( typeof events === 'string' ) strings( once, this, events, callback, context );
        else for( let name in events ) strings( once, this, name, events[ name ], context || callback );

        return this;
    }

    off( events? : string | CallbacksByEvents, callback?, context? ) : this {
        if( !events ) off( this, void 0, callback, context );
        else if( typeof events === 'string' ) strings( off, this, events, callback, context );
        else for( let name in events ) strings( off, this, name, events[ name ], context || callback );

        return this;
    }

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger(name : string, a?, b?, c?, d?, e? ) : this {
        if( d !== void 0 || e !== void 0 ) trigger5( this, name, a, b, c, d, e );
        else if( c !== void 0 ) trigger3( this, name, a, b, c );
        else trigger2( this, name, a, b );
        return this;
    }

    listenTo( source : Messenger, a : string | CallbacksByEvents, b? : Function ) : this {
        if( source ){
            addReference( this, source );
            source.on( a, !b && typeof a === 'object' ? this : b, this );
        }

        return this;
    }

    listenToOnce( source : Messenger, a : string | CallbacksByEvents, b? : Function ) : this {
        if( source ){
            addReference( this, source );
            source.once( a, !b && typeof a === 'object' ? this : b, this );
        }

        return this;
    }

    stopListening( a_source? : Messenger, a? : string | CallbacksByEvents, b? : Function ) : this {
        const { _listeningTo } = this;
        if( _listeningTo ){
            const removeAll = !( a || b ),
                  second = !b && typeof a === 'object' ? this : b;

            if( a_source ){
                const source = _listeningTo[ a_source.cid ];
                if( source ){
                    if( removeAll ) delete _listeningTo[ a_source.cid ];
                    source.off( a, second, this );
                }
            }
            else if( a_source == null ){
                for( let cid in _listeningTo ) _listeningTo[ cid ].off( a, second, this );

                if( removeAll ) ( this._listeningTo = void 0 );
            }
        }

        return this;
    }

    /**
     * Destructor. Stops messenger from listening to all objects,
     * and stop others from listening to the messenger. 
     */
    _disposed : boolean

    dispose() : void {
        if( this._disposed ) return;

        this.stopListening();
        this.off();

        this._disposed = true;
    }
}

/** @hidden */
const slice = Array.prototype.slice;

/**
 * Backbone 1.2 API conformant Events mixin.
 */
export const Events : Messenger = <Messenger> omit( Messenger.prototype, 'constructor', 'initialize' );

/**
 * Messenger Private Helpers 
 */

/** @hidden */
function addReference( listener : Messenger, source : Messenger ){
      const listeningTo = listener._listeningTo || (listener._listeningTo = Object.create( null ) ),
            cid = source.cid || ( source.cid = uniqueId() );

      listeningTo[ cid ] = source;
}