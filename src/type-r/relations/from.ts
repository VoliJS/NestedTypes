import { AnyType, AttributeOptions } from '../record'
import { parseReference, CollectionReference } from './commons'
import { Collection } from '../collection'
import { Record } from '../record'

import { ChainableAttributeSpec } from '../record'

/********
 * Reference to model by id.
 * 
 * Untyped attribute. Holds model id, when unresolved. When resolved, is substituted
 * with a real model.
 * 
 * No model changes are detected and counted as owner's change. That's intentional.
 */

/** @private */
type RecordRefValue = Record | string;

/** @private */
class RecordRefType extends AnyType {
    // It is always serialized as an id, whenever it's resolved or not. 
    toJSON( value : RecordRefValue ){
        return value && typeof value === 'object' ? value.id : value;
    }

    // Wne 
    clone( value : RecordRefValue ){
        return value && typeof value === 'object' ? value.id : value;
    }

    // Model refs by id are equal when their ids are equal.
    isChanged( a : RecordRefValue, b : RecordRefValue){
        var aId = a && ( (<Record>a).id == null ? a : (<Record>a).id ),
            bId = b && ( (<Record>b).id == null ? b : (<Record>b).id );

        return aId !== bId;
    }

    // Refs are always valid.
    validate( model, value, name ){}
}

Record.from = function from( masterCollection : CollectionReference ) : ChainableAttributeSpec {
    const getMasterCollection = parseReference( masterCollection );

    const typeSpec = new ChainableAttributeSpec({
        value : null,
        _attribute : RecordRefType
    });
    
    return typeSpec
        .get( function( objOrId : RecordRefValue, name : string ) : Record {
            if( typeof objOrId === 'object' ) return objOrId;

            // So, we're dealing with an id reference. Resolve it.
            const collection = getMasterCollection( this );
            let   record : Record = null;

            // If master collection exists and is not empty...
            if( collection && collection.length ){
                // Silently update attribute with record from this collection.
                record = collection.get( objOrId ) || null;
                this.attributes[ name ] = record;

                // Subscribe for events manually. delegateEvents won't be invoked.
                record && this._attributes[ name ].handleChange( record, null, this, {} );
            }

            return record;
        });
};