import { AnyType } from './any'
import { Owner, transactionApi, Transactional, ItemsBehavior, TransactionOptions } from '../../transactions'
import { tools } from '../../object-plus'
import { AttributesContainer, ConstructorOptions } from './updates'
import { ValidationError } from '../../validation'

const { free, aquire } = transactionApi;

export class AggregatedType extends AnyType {
    type : typeof Transactional

    clone( value : Transactional ) : Transactional {
        return value ? value.clone() : value;
    }

    toJSON( x, key : string, options : object ){ return x && x.toJSON( options ); }

    doInit( value, record : AttributesContainer, options : ConstructorOptions ){
        const v = options.clone ? this.clone( value ) : (
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

    convert( next : any, prev : any, record : AttributesContainer, options : TransactionOptions ) : Transactional {
        // Invoke class factory to handle abstract classes
        if( next == null ) return next;
        
        if( next instanceof this.type ){
            if( next._shared && !( next._shared & ItemsBehavior.persistent ) ) { // TODO: think more about shared types assignment compatibility. 
                this._log( 'error', 'aggregated collection attribute is assigned with shared collection', next, record );
            }

            // With explicit 'merge' option we need to clone an object if its previous value was 'null'.
            // This is an only case we could be here when merge === true.
            return options.merge ? next.clone() : next;
        }

        return <any>this.type.create( next, options );
    }

    dispose ( record : AttributesContainer, value : Transactional ){
        if( value ){
            this.handleChange( void 0, value, record, {} );
        }
    }

    validate( record : AttributesContainer, value : Transactional ) : ValidationError {
        var error = value && value.validationError;
        if( error ) return error;
    }

    create() : Transactional {
        return (<any>this.type).create(); // this the subclass of Transactional here.
    }

    initialize( options ){
        options.changeHandlers.unshift( this._handleChange );
    }

    _handleChange( next : Transactional, prev : Transactional, record : AttributesContainer, options : TransactionOptions ){
        if( prev ){
            free( record, prev );
            options.unset || prev.dispose();
        } 
        
        if( next && !aquire( record, next, this.name ) ){
            this._log( 'error', 'aggregated attribute assigned with object already having an owner', next, record );
        }
    }
}