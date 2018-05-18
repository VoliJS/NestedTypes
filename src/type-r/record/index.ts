import { Record, RecordDefinition } from './record'
import { Mixable, tools, predefine, define, MixinsState } from '../object-plus'
import compile, { ChainableAttributeSpec } from './attributes'
import { Transactional } from '../transactions'

import { createSharedTypeSpec, AggregatedType, MSDateType, TimestampType, NumericType, SharedType } from './attributes'

export * from './attributes'
export { Record }

const { assign, defaults, omit, getBaseClass } = tools;

Record.onExtend = function( this : typeof Record, BaseClass : typeof Record ){
    Transactional.onExtend.call( this, BaseClass );

    // Create the default collection
    const Class = this;

    @predefine class DefaultCollection extends BaseClass.Collection<any> {
        static model = Class;
    }

    this.DefaultCollection = DefaultCollection;

    // If there are no collection defined in statics, use the default collection.
    // It will appear in onDefine's definition, overriding all other settings.
    if( Class.Collection === BaseClass.Collection ){
        this.Collection = DefaultCollection;
    }

    // Create Class.shared modifier
    createSharedTypeSpec( this, SharedType );
}

Record.onDefine = function( definition : RecordDefinition, BaseClass : typeof Record ){
    const baseProto : Record = BaseClass.prototype;

    // Compile attributes spec, creating definition mixin.
    const { properties, _localEvents, ...dynamicMixin } = compile( this.attributes = getAttributes( definition ), baseProto._attributes );
    assign( this.prototype, dynamicMixin );
    
    definition.properties = defaults( definition.properties || {}, properties );
    definition._localEvents = _localEvents;
    
    Transactional.onDefine.call( this, definition, BaseClass );

    // Finalize the definition of the default collection.
    this.DefaultCollection.define( definition.collection || {} );

    // assign collection from the definition.
    this.Collection = definition.Collection;
    this.Collection.prototype.model = this;

    if( definition.endpoint ) this.Collection.prototype._endpoint = definition.endpoint;    
}

Record._attribute = AggregatedType;
createSharedTypeSpec( Record, SharedType );

function getAttributes({ defaults, attributes, idAttribute } : RecordDefinition ) {
    const definition = attributes || defaults || {};
    
    // If there is an undeclared idAttribute, add its definition as untyped generic attribute.
    if( idAttribute && !( idAttribute in definition ) ){
        definition[ idAttribute ] = void 0;
    }

    return definition;
}

declare var Reflect;

export function attr( proto : object, attrName : string ) : void;
export function attr( spec : any ) : PropertyDecorator;
export function attr( proto, attrName? : string ) : any {
    if( attrName ){
        // Called without the spec. Extract the type.
        if( typeof Reflect !== 'undefined' && Reflect.getMetadata ){
            Reflect
                .getMetadata( "design:type", proto, attrName )
                .asProp( proto, attrName );
        }
        else{
            proto._log( 'error', 'Add import "reflect-metadata"; as the first line of your app.' );
        }
    }
    else{
        return ChainableAttributeSpec.from( proto ).asProp;
    }
}

export function prop( spec ) : any {
    return spec.asProp;
}