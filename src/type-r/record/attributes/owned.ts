import { Record } from '../transaction' 
import { AnyType } from './generic'
import { Owner, transactionApi, Transactional, ItemsBehavior, TransactionOptions, TransactionalConstructor } from '../../transactions'
import { tools } from '../../object-plus'
import { ValidationError } from '../../validation'

const { free, aquire } = transactionApi;

export class AggregatedType extends AnyType {
    type : TransactionalConstructor

    clone( value : Transactional ) : Transactional {
        return value ? value.clone() : value;
    }

    toJSON( x ){ return x && x.toJSON(); }

    canBeUpdated( prev : Transactional, next : any, options : TransactionOptions ) : any {
        // If an object already exists, and new value is of incompatible type, let object handle the update.
        if( prev && next != null ){
            if( next instanceof this.type ){
                // In case if merge option explicitly specified, force merge.
                if( options.merge ) return next.__inner_state__;
            }
            else{
                return next;
            }
        }
    }

    convert( value : any, options : TransactionOptions, prev : any, record : Record ) : Transactional {
        // Invoke class factory to handle abstract classes
        if( value == null ) return value;
        
        if( value instanceof this.type ){
            if( value._shared && !( value._shared & ItemsBehavior.persistent ) ) { // TODO: think more about shared types assignment compatibility. 
                this._log( 'error', 'aggregated attribute is assigned with shared collection type', value, record );
            }

            // With explicit 'merge' option we need to clone an object if its previous value was 'null'.
            // This is an only case we could be here when merge === true.
            return options.merge ? value.clone() : value;
        }

        return <any>this.type.create( value, options );
    }

    dispose ( record : Record, value : Transactional ){
        if( value ){
            this.handleChange( void 0, value, record );
            value.dispose();
        }
    }

    validate( record : Record, value : Transactional ) : ValidationError {
        var error = value && value.validationError;
        if( error ) return error;
    }

    create() : Transactional {
        return (<any>this.type).create(); // this the subclass of Transactional here.
    }

    initialize( options ){
        options.changeHandlers.unshift( this._handleChange );
    }

    _handleChange( next : Transactional, prev : Transactional, record : Record ){
        prev && free( record, prev );
        
        if( next && !aquire( record, next, this.name ) ){
            this._log( 'error', 'aggregated attribute assigned with object which is aggregated somewhere else', next, record );
        }
    }
}

Record._attribute = AggregatedType;