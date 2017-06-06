import { Record, RecordDefinition, AttributeDescriptorMap } from './transaction'
import { Mixable, ClassDefinition, tools } from '../object-plus'
import { compile, AttributesSpec } from './define'
import { ChainableAttributeSpec } from './typespec'
import { Transactional } from '../transactions'

import { AggregatedType, MSDateType, TimestampType, NumericType, SharedType } from './attributes'

export * from './attributes'
export { Record, ChainableAttributeSpec }

const { assign, defaults, omit, getBaseClass } = tools;

Record.define = function( protoProps : RecordDefinition = {}, staticProps ){
    const BaseConstructor : typeof Record = getBaseClass( this ),
          baseProto : Record = BaseConstructor.prototype,
          // Extract record definition from static members, if any.
          staticsDefinition : RecordDefinition = tools.getChangedStatics( this, 'attributes', 'collection', 'Collection', 'idAttribute' ),
          // Definition can be made either through statics or define argument.
          // Merge them together, so we won't care about it below. 
          definition = assign( staticsDefinition, protoProps );

    if( 'Collection' in this && this.Collection === void 0 ){
        tools.log.error( `[Model Definition] ${ this.prototype.getClassName() }.Collection is undefined. It must be defined _before_ the model.`, definition );
    }

    // Compile attributes spec, creating definition mixin.
    const dynamicMixin = compile( this.attributes = getAttributes( definition ), <AttributesSpec> baseProto._attributes );

    // Explicit 'properties' declaration overrides auto-generated attribute properties.
    if( definition.properties === false ){
        dynamicMixin.properties = {};
    }

    assign( dynamicMixin.properties, protoProps.properties || {} );

    // Merge in definition.
    assign( dynamicMixin, omit( definition, 'attributes', 'collection', 'defaults', 'properties', 'forEachAttr' ) );            
    Mixable.define.call( this, dynamicMixin, staticProps );
    defineCollection.call( this, definition.collection || definition.Collection );

    return this;
}

Record.predefine = function(){
    Transactional.predefine.call( this );

    this.Collection = getBaseClass( this ).Collection.extend();
    this.Collection.prototype.model = this;

    createSharedTypeSpec( this, SharedType );

    return this;
}

Record._attribute = AggregatedType;
createSharedTypeSpec( Record, SharedType );

function getAttributes({ defaults, attributes, idAttribute } : RecordDefinition ) : AttributeDescriptorMap {
    const definition = typeof defaults === 'function' ? (<any>defaults)() : attributes || defaults || {};
    
    // If there is an undeclared idAttribute, add its definition as untyped generic attribute.
    if( idAttribute && !( idAttribute in definition ) ){
        definition[ idAttribute ] = void 0;
    }

    return definition;
}

function defineCollection( collection : {} ){
    // If collection constructor is specified, take it as it is. 
    if( typeof collection === 'function' ) {
        this.Collection = collection;
        
        // Link collection with the record
        this.Collection.prototype.model = this;
    } 
    // Otherwise, define implicitly created Collection.
    else{
        this.Collection.define( collection || {} );
    }
}

// Add extended Date attribute types.
declare global {
    interface DateConstructor {
        microsoft
        timestamp
    }
}

Object.defineProperties( Date, {
    microsoft : {
        get(){
            return new ChainableAttributeSpec({
                type : Date,
                _attribute : MSDateType
            })
        }
    },

    timestamp : {
        get(){
            return new ChainableAttributeSpec({
                type : Date,
                _attribute : TimestampType
            })
        }
    }
});

// Add Number.integer attrubute type
declare global {
    interface NumberConstructor {
        integer : Function
    }

    interface Window {
        Integer : Function;
    }
}

Number.integer = function( x ){ return x ? Math.round( x ) : 0; }
Number.integer._attribute = NumericType;

if( typeof window !== 'undefined' ){
    window.Integer = Number.integer;
}

/** @private */
export function createSharedTypeSpec( Constructor, Attribute ){
    Constructor.hasOwnProperty( 'shared' ) ||
        Object.defineProperty( Constructor, 'shared', {
            get(){
                return new ChainableAttributeSpec({
                    value : null,
                    type : Constructor,
                    _attribute : Attribute
                });
            }
        });
}