import { define, mixins, Mixable, Mixin, MixableConstructor, MixinsState, mixinRules, definitions, MixinMergeRules } from './mixins'
import { omit, transform } from './tools'
import { EventMap, EventsDefinition, EventSource, HandlersByEvent } from './eventsource'
import * as _eventsApi from './eventsource'

const { EventHandler, strings, on, off, once, trigger5, trigger2, trigger3 } = _eventsApi;

/** @hidden */
const eventSplitter = /\s+/;

/** @hidden */
let _idCount = 0;

/** @hidden */
function uniqueId() : string {
    return 'l' + _idCount++;
}

export { EventMap, EventsDefinition }

export interface MessengerDefinition {
    _localEvents? : EventMap
    localEvents? : EventsDefinition
    properties? : PropertyMap
    [ name : string ] : any
}

export interface PropertyMap {
    [ name : string ] : Property
}

export type Property = PropertyDescriptor | ( () => any )

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

@define
@definitions({
    properties : mixinRules.merge,
    localEvents : mixinRules.merge
})
export abstract class Messenger implements Mixable, EventSource {
    // Define extendable mixin static properties.
    static __super__ : object;
    static mixins : MixinsState;
    static onExtend : ( BaseClass : Function ) => void;
    static define : ( definition? : MessengerDefinition, statics? : object ) => MixableConstructor;
    static extend : ( definition? : MessengerDefinition, statics? : object ) => MixableConstructor;
    static onDefine({ localEvents, _localEvents, properties } : MessengerDefinition, BaseClass? : typeof Mixable ){
        // Handle localEvents definition
        if( localEvents || _localEvents ){
            const eventsMap = new EventMap( this.prototype._localEvents );

            localEvents && eventsMap.addEventsMap( localEvents );
            _localEvents && eventsMap.merge( _localEvents );
            
            this.prototype._localEvents = eventsMap;
        }

        // Handle properties definitions...
        if( properties ){
            Object.defineProperties( this.prototype, transform( {}, <PropertyMap>properties, toPropertyDescriptor ) );
        }
    }

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

        // TODO: local events subscribe?
    }

    /** Method is called at the end of the constructor */
    initialize() : void {}
    
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

/**
 * Backbone 1.2 API conformant Events mixin.
 */
export const Events : Messenger = <Messenger> omit( Messenger.prototype, 'constructor', 'initialize' );

/**
 * Messenger Private Helpers 
 */

function toPropertyDescriptor( x : Property ) : PropertyDescriptor {
    if( x ){
        return typeof x === 'function' ? { get : < () => any >x } : <PropertyDescriptor> x;
    }
}

/** @hidden */
function addReference( listener : Messenger, source : Messenger ){
      const listeningTo = listener._listeningTo || (listener._listeningTo = Object.create( null ) ),
            cid = source.cid || ( source.cid = uniqueId() );

      listeningTo[ cid ] = source;
}