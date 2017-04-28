/**
 * Type spec engine. Declare attributes using chainable syntax,
 * and returns object with spec.
 */
import { Transactional } from '../transactions'
import { ChangeAttrHandler, AttributeDescriptor } from './attributes'
import { Record } from './transaction'
import { EventMap, EventsDefinition, Constructor, tools } from '../object-plus'

const { assign } = tools;

export interface AttributeCheck {
    ( value : any, key : string ) : boolean
    error? : any
}

export class ChainableAttributeSpec {
    options : AttributeDescriptor;

    constructor( options : AttributeDescriptor ) {
        // Shallow copy options, fill it with defaults.
        this.options = { getHooks : [], transforms : [], changeHandlers : []};
        if( options ) assign( this.options, options );
    }

    check( check : AttributeCheck, error : any ) : ChainableAttributeSpec {
        function validate( model, value, name ){
            if( !check.call( model, value, name ) ){
                const msg = error || check.error || name + ' is not valid';
                return typeof msg === 'function' ? msg.call( model, name ) : msg;
            }
        }

        const prev = this.options.validate;

        return this.metadata({
            validate : prev ? (
                            function( model, value, name ){
                                return prev( model, value, name ) || validate( model, value, name );
                            }
                       ) : validate
        });
    }

    get isRequired() : ChainableAttributeSpec {
        return this.metadata({ isRequired : true }); 
    }

    watcher( ref : string | ( ( value : any, key : string ) => void ) ) : ChainableAttributeSpec {
        return this.metadata({ _onChange : ref });
    }

    parse( fun ) : ChainableAttributeSpec {
        return this.metadata({ parse : fun });
    }

    toJSON( fun ) : ChainableAttributeSpec {
        return this.metadata({
            toJSON : typeof fun === 'function' ? fun : ( fun ? x => x && x.toJSON() : emptyFunction ) 
        });
    }

    // Attribute get hook.
    get( fun ) : ChainableAttributeSpec {
        return this.metadata({
            getHooks : this.options.getHooks.concat( fun )
        });
    }

    // Attribute set hook.
    set( fun ) : ChainableAttributeSpec {
        function handleSetHook( next, options, prev, model ) {
            if( this.isChanged( next, prev ) ) {
                var changed = fun.call( model, next, this.name );
                return changed === void 0 ? prev : this.convert( changed, options, prev, model );
            }

            return prev;
        }

        return this.metadata({
            transforms : this.options.transforms.concat( handleSetHook )
        });
    }

    changeEvents( events : boolean ) : ChainableAttributeSpec {
        return this.metadata({ changeEvents : events });
    }

    // Subsribe to events from an attribute.
    events( map : EventsDefinition ) : ChainableAttributeSpec {
        const eventMap = new EventMap( map );

        function handleEventsSubscribtion( next, prev, record : Record ){
            prev && prev.trigger && eventMap.unsubscribe( record, prev );

            next && next.trigger && eventMap.subscribe( record, next );
        }

        return this.metadata({
            changeHandlers : this.options.changeHandlers.concat( handleEventsSubscribtion )
        });
    }

    // Creates a copy of the spec.
    get has() : ChainableAttributeSpec {
        return this;
    }

    metadata( options : AttributeDescriptor ) : ChainableAttributeSpec {
        const cloned = new ChainableAttributeSpec( this.options );
        assign( cloned.options, options );
        return cloned;
    }

    value( x ) : ChainableAttributeSpec {
        return this.metadata({ value : x });
    }
}

function emptyFunction(){}

declare global {
    interface Function{
        value : ( x : any ) => ChainableAttributeSpec;
        isRequired : ChainableAttributeSpec;
        has : ChainableAttributeSpec;
    }
}

Function.prototype.value = function( x ) {
    return new ChainableAttributeSpec( { type : this, value : x } );
};

Object.defineProperty( Function.prototype, 'isRequired', {
    get() { return this._isRequired || this.has.isRequired; },
    set( x ){ this._isRequired = x; }
});

Object.defineProperty( Function.prototype, 'has', {
    get() {
        // workaround for sinon.js and other libraries overriding 'has'
        return this._has || new ChainableAttributeSpec( { type : this, value : this._attribute.defaultValue } );
    },

    set( value ) { this._has = value; }
} );

export function toAttributeDescriptor( spec : any ) : AttributeDescriptor {
    let attrSpec : ChainableAttributeSpec;

    if( typeof spec === 'function' ) {
        attrSpec = spec.has;
    }
    else if( spec && spec instanceof ChainableAttributeSpec ) {
        attrSpec = spec;
    }
    else{
        // Infer type from value.
        const type = inferType( spec );

        // Transactional types inferred from values must have shared type. 
        if( type && type.prototype instanceof Transactional ){
            attrSpec = (<any>type).shared.value( spec );
        }
        // All others will be created in regular way.
        else{
            attrSpec = new ChainableAttributeSpec({ type : type, value : spec });
        }
    }
 
    return attrSpec.options;
}

function inferType( value : {} ) : Constructor<any> {
    switch( typeof value ) {
        case 'number' :
            return Number;
        case 'string' :
            return String;
        case 'boolean' :
            return Boolean;
        case 'undefined' :
            return void 0;
        case 'object' :
            return value ? <any> value.constructor : void 0;
    }
}
