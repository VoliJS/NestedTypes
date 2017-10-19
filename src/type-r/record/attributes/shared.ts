import { AnyType } from './any'
import { AttributesContainer, ConstructorOptions } from './updates'
import { ItemsBehavior, Owner, transactionApi, Transactional, TransactionOptions } from '../../transactions' 
import { tools, eventsApi } from '../../object-plus'

const { on, off } = eventsApi,
    { free, aquire } = transactionApi;

/************************
 * Shared attribute definition.
 * - Not serialized.
 * - Listening to the changes.
 * - Doesn't take ownership when assigned with object of proper type.
 * - Takes ownership on objects which are converted.
 */

const shareAndListen = ItemsBehavior.listen | ItemsBehavior.share;

/** @private */
export class SharedType extends AnyType {
    type : typeof Transactional

     doInit( value, record : AttributesContainer, options : ConstructorOptions ){
        const v = options.clone ? this.clone( value, record ) : (
            value === void 0 ? this.defaultValue() : value
        );

        const x = this.transform( v, void 0, record, options );
        this.handleChange( x, void 0, record, options );
        return x;
    }

    doUpdate( value, record, options, nested : any[] ){ // Last to things can be wrapped to an object, either transaction or ad-hoc
        const key = this.name, { attributes } = record; 
        const prev = attributes[ key ];
        let update;

        // This can be moved to transactional attribute. And chained with the rest.
        if( update = this.canBeUpdated( prev, value, options ) ) { // todo - skip empty updates.
            const nestedTransaction = prev._createTransaction( update, options );
            if( nestedTransaction ){
                if( nested ){
                    nested.push( nestedTransaction );
                }
                else{
                    nestedTransaction.commit( record );
                }

                if( this.propagateChanges ) return true;
            }

            return false;
        }

        const next = this.transform( value, prev, record, options );
        attributes[ key ] = next;

        if( this.isChanged( next, prev ) ) { // Primitives and nested comparison can be inlined.
            // Do the rest of the job after assignment
            this.handleChange( next, prev, record, options );

            return true;
        }

        return false;
    }

    clone( value : Transactional, record : AttributesContainer ) : Transactional {
        // References are not cloned.
        if( !value || value._owner !== record ) return value;

        // Implicitly created objects are cloned.
        const clone = value.clone();
        aquire( record, clone, this.name );
        return clone;
    }

    // Do not serialize by default.
    toJSON(){}

    canBeUpdated( prev : Transactional, next : any, options : TransactionOptions ) : any {
        // If an object already exists, and new value is of incompatible type, let object handle the update.
        if( prev && next != null && !( next instanceof this.type ) ){
            return next;
        }
    }

    convert( next : any, prev : any, record : AttributesContainer, options : TransactionOptions ) : Transactional {
        if( next == null || next instanceof this.type ) return next;

        // Convert type using implicitly created rtransactional object.
        const implicitObject = new ( this.type as any )( next, options, shareAndListen );

        // To prevent a leak, we need to take an ownership on it.
        aquire( record, implicitObject, this.name );

        return implicitObject;
    }

    // Refs are always valid.
    validate( model, value, name ){}

    // They are always created as null.
    create() : Transactional {
        return null;
    }

    // Listening to the change events
    _handleChange( next : Transactional, prev : Transactional, record : AttributesContainer, options ){
        if( prev ){
            // If there was an implicitly created object, remove an ownership.
            if( prev._owner === record ){
                free( record, prev );
                options.unset || prev.dispose();
            }
            else{
                off( prev, prev._changeEventName, this._onChange, record );
            }
        }  
 
        if( next ){
            // No need to take an ownership for an implicit object - already done in convert or clone.
            if( next._owner !== record ){
                on( next, next._changeEventName, this._onChange, record );
            }
        } 
    }

    dispose( record : AttributesContainer, value : Transactional ){
        if( value ){
            this.handleChange( void 0, value, record, {} );
        }
    }

    _onChange : ( child : Transactional, options : TransactionOptions, initiator : Transactional ) => void 

    initialize( options ){
        // Create change event handler which knows current attribute name. 
        const attribute = this;
        this._onChange = this.propagateChanges ? function( child, options, initiator ){
            this === initiator || this.forceAttributeChange( attribute.name, options );
        } : ignore;

        options.changeHandlers.unshift( this._handleChange );
    }
}

function ignore(){}