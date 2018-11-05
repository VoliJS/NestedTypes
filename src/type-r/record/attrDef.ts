/**
 * Type spec engine. Declare attributes using chainable syntax,
 * and returns object with spec.
 */
import { IOEndpoint } from '../io-tools';
import { definitionDecorator, EventMap, EventsDefinition, tools } from '../object-plus';
import { Transactional } from '../transactions';
import { AttributeOptions, Parse, AnyType, getMetatype } from './metatypes';
import { AttributesContainer } from './updates';

const { assign } = tools;

export interface AttributeCheck {
    ( value : any, key : string ) : boolean
    error? : any
}

export class ChainableAttributeSpec {
    options : AttributeOptions;

    constructor( options : AttributeOptions ) {
        // Shallow copy options, fill it with defaults.
        this.options = { getHooks : [], transforms : [], changeHandlers : []};
        if( options ) assign( this.options, options );
    }

    check( check : AttributeCheck, error? : any ) : ChainableAttributeSpec {
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

    get asProp(){
        return definitionDecorator( 'attributes', this );
    }

    get as(){ return this.asProp; }

    get isRequired() : ChainableAttributeSpec {
        return this.required;
    }

    get required() : ChainableAttributeSpec {
        return this.metadata({ isRequired : true }); 
    }

    endpoint( endpoint : IOEndpoint ){
        return this.metadata({ endpoint });
    }

    watcher( ref : string | ( ( value : any, key : string ) => void ) ) : ChainableAttributeSpec {
        return this.metadata({ _onChange : ref });
    }

    // Attribute-specific parse transform
    parse( fun : Parse ) : ChainableAttributeSpec {
        return this.metadata({ parse : fun });
    }

    toJSON( fun ) : ChainableAttributeSpec {
        return this.metadata({
            toJSON : typeof fun === 'function' ? fun : ( fun ? ( x, k, o ) => x && x.toJSON( o ) : emptyFunction ) 
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
        function handleSetHook( next, prev, record : AttributesContainer, options ) {
            if( this.isChanged( next, prev ) ) {
                const changed = fun.call( record, next, this.name );
                return changed === void 0 ? prev : this.convert( changed, prev, record, options );
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

        function handleEventsSubscribtion( next, prev, record : AttributesContainer ){
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

    metadata( options : AttributeOptions ) : ChainableAttributeSpec {
        const cloned = new ChainableAttributeSpec( this.options );
        assign( cloned.options, options );
        return cloned;
    }

    value( x ) : ChainableAttributeSpec {
        return this.metadata({ value : x, hasCustomDefault : true });
    }

    static from( spec : any ) : ChainableAttributeSpec {
        let attrSpec : ChainableAttributeSpec;

        if( typeof spec === 'function' ) {
            attrSpec = type( spec );
        }
        else if( spec && spec instanceof ChainableAttributeSpec ) {
            attrSpec = spec;
        }
        else{
            // Infer type from value.
            const type = inferType( spec );
    
            // Transactional types inferred from values must have shared type. 
            if( type && type.prototype instanceof Transactional ){
                attrSpec = type( ( type as typeof Transactional ).shared ).value( spec );
            }
            // All others will be created in regular way.
            else{
                attrSpec = new ChainableAttributeSpec({ type : type, value : spec, hasCustomDefault : true });
            }
        }
    
        return attrSpec;
    }
}

function emptyFunction(){}

export function type( this : void, type : ChainableAttributeSpec | Function, value? : any ) : ChainableAttributeSpec {
    if( type instanceof ChainableAttributeSpec ) return type;

    const defaultValue = value === void 0 ? getMetatype( type ).defaultValue : value;
    return new ChainableAttributeSpec( {
        type,
        value : defaultValue,
        hasCustomDefault : defaultValue !== void 0
    } );
}

function inferType( value : {} ) : Function {
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

export function createSharedTypeSpec( Constructor : Function, Attribute : typeof AnyType ){
    if( !Constructor.hasOwnProperty( 'shared' ) ){
        Object.defineProperty( Constructor, 'shared', {
            get(){
                return new ChainableAttributeSpec({
                    value : null,
                    type : Constructor,
                    _metatype : Attribute
                });
            }
        });
    }
}