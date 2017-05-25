import { once as _once } from './tools'

/*******************
 * Prebuilt events map, used for optimized bulk event subscriptions.
 *
 * const events = new EventMap({
 *      'change' : true, // Resend this event from self as it is.
 *      'change:attr' : 'localTargetFunction',
 *      'executedInTargetContext' : function(){ ... }
 *      'executedInNativeContext' : '^props.handler'
 * })
 */
/** @hidden */
export interface EventsDefinition {
    [ events : string ] : Function | string | boolean
}

/** @hidden */
export class EventMap {
    handlers : EventDescriptor[] = [];

    constructor( map? : EventsDefinition | EventMap ){
        if( map ){
            if( map instanceof EventMap ){
                this.handlers = map.handlers.slice();
            }
            else{
                map && this.addEventsMap( map );
            }
        }
    }

    merge( map : EventMap ){
        this.handlers = this.handlers.concat( map.handlers );
    }

    addEventsMap( map : EventsDefinition ){
        for( let names in map ){
            this.addEvent( names, map[ names ] )
        }
    }

    bubbleEvents( names : string ){
        for( let name of names.split( eventSplitter ) ){
            this.addEvent( name, getBubblingHandler( name ) );
        }
    }

    addEvent( names : string, callback : Function | string | boolean ){
        const { handlers } = this;

        for( let name of names.split( eventSplitter ) ){
            handlers.push( new EventDescriptor( name, callback ) );
        }
    }

    subscribe( target : {}, source : EventSource ){
        for( let event of this.handlers ){
            on( source, event.name, event.callback, target );
        }
    }

    unsubscribe( target : {}, source : EventSource ){
        for( let event of this.handlers ){
            off( source, event.name, event.callback, target );
        }
    }
}

/** @hidden */
export class EventDescriptor {
    callback : Function

    constructor(
        public name : string,
        callback : Function | string | boolean
    ){
        if( callback === true ){
            this.callback = getBubblingHandler( name );
        }
        else if( typeof callback === 'string' ){
            this.callback =
                function localCallback(){
                    const handler = this[ callback ];
                    handler && handler.apply( this, arguments );
                };
        }
        else{
            this.callback = <Function>callback;
        }
    }
}

/** @hidden */
const _bubblingHandlers = {};

/** @hidden */
function getBubblingHandler( event : string ){
    return _bubblingHandlers[ event ] || (
        _bubblingHandlers[ event ] = function( a?, b?, c?, d?, e? ){
            if( d !== void 0 || e !== void 0 ) trigger5( this, event, a, b, c, d, e );
            if( c !== void 0 ) trigger3( this, event, a, b, c );
            else trigger2( this, event, a, b );
        }
    );
}

/** @hidden */
export interface HandlersByEvent {
    [ name : string ] : EventHandler
}

/** @hidden */
export class EventHandler {
    constructor( public callback : Callback, public context : any, public next = null ){}
}

/** @hidden */
function listOff( _events : HandlersByEvent, name : string, callback : Callback, context : any ){
    const head = _events[ name ];

    let filteredHead, prev;

    for( let ev = head; ev; ev = ev.next ){
        // Element must be kept
        if( ( callback && callback !== ev.callback && callback !== ev.callback._callback ) ||
            ( context && context !== ev.context ) ){
            
            prev = ev;
            filteredHead || ( filteredHead = ev );
        }
        // Element must be skipped
        else{
            if( prev ) prev.next = ev.next;
        }
    }

    if( head !== filteredHead ) _events[ name ] = filteredHead;
}

/** @hidden */
function listSend2( head : EventHandler, a, b ){
    for( let ev = head; ev; ev = ev.next ) ev.callback.call( ev.context, a, b );
}

/** @hidden */
function listSend3( head : EventHandler, a, b, c ){
    for( let ev = head; ev; ev = ev.next ) ev.callback.call( ev.context, a, b, c );
}

/** @hidden */
function listSend4( head : EventHandler, a, b, c, d ){
    for( let ev = head; ev; ev = ev.next ) ev.callback.call( ev.context, a, b, c, d );
}

/** @hidden */
function listSend5( head : EventHandler, a, b, c, d, e ){
    for( let ev = head; ev; ev = ev.next ) ev.callback.call( ev.context, a, b, c, d, e );
}

/** @hidden */
function listSend6( head : EventHandler, a, b, c, d, e, f ){
    for( let ev = head; ev; ev = ev.next ) ev.callback.call( ev.context, a, b, c, d, e, f );
}

/** @hidden */
export interface Callback extends Function {
    _callback? : Function
}

/** @hidden */
export function on( source : EventSource, name : string, callback : Callback, context? : any ) : void {
    if( callback ){
        const _events = source._events || ( source._events = Object.create( null ) );
        _events[ name ] = new EventHandler( callback, context, _events[ name ] );
    }
}

/** @hidden */
export function once( source : EventSource, name : string, callback : Callback, context? : any ) : void {
    if( callback ){
        const once : Callback = _once( function(){
            off( source, name, once );
            callback.apply(this, arguments);
        });

        once._callback = callback;
        on( source, name, once, context );
    }
}

/** @hidden */
export function off( source : EventSource, name? : string, callback? : Callback, context? : any ) : void {
    const { _events } = source;
    if( _events ){
        if( callback || context ) {
            if( name ){
                listOff( _events, name, callback, context );
            }
            else{
                for( let name in _events ){
                    listOff( _events, name, callback, context );
                }
            }
        }
        else if( name ){
            _events[ name ] = void 0;
        }
        else{
            source._events = void 0;
        }
    }
}

/** @hidden */
export interface EventSource {
    _events : HandlersByEvent
}

/** @hidden */
const eventSplitter = /\s+/;

/** @hidden */
export function strings( api : ApiEntry, source : EventSource, events : string, callback : Callback, context ){
    if( eventSplitter.test( events ) ){
        const names = events.split( eventSplitter );
        for( let name of names ) api( source, name, callback, context );
    }
    else api( source, events, callback, context );
}

/** @hidden */
export type ApiEntry = ( source : EventSource, event : string, callback : Callback, context? : any ) => void

/*********************************
 * Event-triggering API
 */

/** @hidden */
export function trigger2( self : EventSource, name : string, a, b ) : void {
    const { _events } = self;
    if( _events ){
        const queue = _events[ name ],
            { all } = _events;

        listSend2( queue, a, b );
        listSend3( all, name, a, b );
    }
};

/** @hidden */
export function trigger3( self : EventSource, name : string, a, b, c ) : void{
    const { _events } = self;
    if( _events ){
        const queue = _events[ name ],
            { all } = _events;

        listSend3( queue, a, b, c );
        listSend4( all, name, a, b, c );
    }
};

/** @hidden */
export function trigger5( self : EventSource, name : string, a, b, c, d, e ) : void{
    const { _events } = self;
    if( _events ){
        const queue = _events[ name ],
            { all } = _events;

        listSend5( queue, a, b, c, d, e );
        listSend6( all, name, a, b, c, d, e );
    }
};