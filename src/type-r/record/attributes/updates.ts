import { Transactional, Transaction, TransactionOptions, Owner, transactionApi } from "../../transactions"
const { begin : _begin, markAsDirty : _markAsDirty, commit } = transactionApi;

import { eventsApi } from '../../object-plus'
const { trigger3 } = eventsApi;

export interface ConstructorsMixin {
    Attributes : AttributesConstructor
    AttributesCopy : AttributesCopyConstructor
}

export interface ConstructorOptions extends TransactionOptions{
    clone? : boolean
}

export type AttributesConstructor = new ( record : AttributesContainer, values : object, options : TransactionOptions ) => AttributesValues;
export type AttributesCopyConstructor = new ( values : object ) => AttributesValues;

export interface AttributesContainer extends Transactional, Owner, ConstructorsMixin {
    // Attribute descriptors.
    _attributes : AttributesDescriptors

    // Attribute values.
    attributes : AttributesValues

    // Previous attribute values.
    _previousAttributes : AttributesValues

    // Changed attributes cache. 
    _changedAttributes : AttributesValues
}

export interface AttributesValues {
    [ name : string ] : any
}

export interface AttributesDescriptors {
    [ name : string ] : AttributeUpdatePipeline
}

export interface AttributeUpdatePipeline{
    doUpdate( value, record : AttributesContainer, options : TransactionOptions, nested? : Transaction[] ) : boolean
}

 // Optimized single attribute transactional update. To be called from attributes setters
 // options.silent === false, parse === false. 
export function setAttribute( record : AttributesContainer, name : string, value : any ) : void {
    // Open the transaction.
    const isRoot  = begin( record ),
          options = {};

    // Update attribute.      
    if( record._attributes[ name ].doUpdate( value, record, options ) ){
        // Notify listeners on changes.
        markAsDirty( record, options );
        trigger3( record, 'change:' + name, record, record.attributes[ name ], options );
    }

    // Close the transaction.
    isRoot && commit( record );
}

function begin( record : AttributesContainer ){
    if( _begin( record ) ){
        record._previousAttributes = new record.AttributesCopy( record.attributes );
        record._changedAttributes = null;
        return true;
    }
    
    return false;
}

function markAsDirty( record : AttributesContainer, options : TransactionOptions ){
    // Need to recalculate changed attributes, when we have nested set in change:attr handler
    if( record._changedAttributes ){
        record._changedAttributes = null;
    }

    return _markAsDirty( record, options );
}

/**
 * TODO: There's an opportunity to create an optimized pipeline for primitive types and Date, which makes the majority
 * of attributes. It might create the major speedup.
 * 
 * Create the dedicated pipeline for owned and shared attributes as well.
 * 
 * Three elements of the pipeline:
 * - from constructor
 * - from assignment
 * - from `set`
 */

export const UpdateRecordMixin = {
// Need to override it here, since begin/end transaction brackets are overriden. 
    transaction( this : AttributesContainer, fun : ( self : AttributesContainer ) => void, options : TransactionOptions = {} ) : void{
        const isRoot = begin( this );
        fun.call( this, this );
        isRoot && commit( this );
    },
            
    // Handle nested changes. TODO: propagateChanges == false, same in transaction.
    _onChildrenChange( child : Transactional, options : TransactionOptions ) : void {
        const { _ownerKey } = child,
              attribute = this._attributes[ _ownerKey ];

        if( !attribute /* TODO: Must be an opposite, likely the bug */ || attribute.propagateChanges ) this.forceAttributeChange( _ownerKey, options );
    },

    // Simulate attribute change 
    forceAttributeChange( key : string, options : TransactionOptions = {} ){
        // Touch an attribute in bounds of transaction
        const isRoot = begin( this );

        if( markAsDirty( this, options ) ){
            trigger3( this, 'change:' + key, this, this.attributes[ key ], options );
        }
        
        isRoot && commit( this );
    },

    _createTransaction( this : AttributesContainer, a_values : {}, options : TransactionOptions = {} ) : Transaction {
        const isRoot = begin( this ),
                changes : string[] = [],
                nested : RecordTransaction[]= [],
                { _attributes } = this,
                values = options.parse ? this.parse( a_values, options ) : a_values;

        let unknown;

        if( shouldBeAnObject( this, values ) ){
            for( let name in values ){
                const spec = _attributes[ name ];

                if( spec ){
                    if( spec.doUpdate( values[ name ], this, options, nested ) ){
                        changes.push( name );
                    }
                }
                else{
                    unknown || ( unknown = [] );
                    unknown.push( `'${ name }'` );
                }
            }

            if( unknown ){
                // this._log( 'warn', `Undefined attributes ${ unknown.join(', ')} are ignored!`, values );
            }
        }
        
        if( changes.length && markAsDirty( this, options ) ){
            return new RecordTransaction( this, isRoot, nested, changes );
        }
        
        // No changes, but there might be silent attributes with open transactions.
        for( let pendingTransaction of nested ){
            pendingTransaction.commit( this );
        }

        isRoot && commit( this );
    }
};

// One of the main performance tricks of Type-R.
// Create loop unrolled constructors for internal attribute hash,
// so the hidden class JIT optimization will be engaged and they will become static structs.
// It dramatically improves record performance.
export function constructorsMixin( attrDefs : AttributesDescriptors ) : ConstructorsMixin {
    const attrs = Object.keys( attrDefs );

    const AttributesCopy : AttributesCopyConstructor = new Function( 'values', `
        ${ attrs.map( attr =>`
            this.${ attr } = values.${ attr };
        `).join( '' ) }
    `) as any;

    AttributesCopy.prototype = Object.prototype;

    const Attributes : AttributesConstructor = new Function( 'record', 'values', 'options', `
        var _attrs = record._attributes;

        ${ attrs.map( attr =>`
            this.${ attr } = _attrs.${ attr }.doInit( values.${ attr }, record, options );
        `).join( '' ) }
    `) as any;

    Attributes.prototype = Object.prototype;

    return { Attributes, AttributesCopy };
}

export function shouldBeAnObject( record : AttributesContainer, values : object ){
    if( values && values.constructor === Object ) return true;

    record._log( 'warn', 'update with non-object is ignored!', { values } );
    return false;
}

// Transaction class. Implements two-phase transactions on object's tree. 
// Transaction must be created if there are actual changes and when markIsDirty returns true. 
export class RecordTransaction implements Transaction {
    // open transaction
    constructor( public object : AttributesContainer,
                 public isRoot : boolean,
                 public nested : Transaction[],
                 public changes : string[] ){}

    // commit transaction
    commit( initiator? : AttributesContainer ) : void {
        const { nested, object, changes } = this;

        // Commit all pending nested transactions...
        for( let transaction of nested ){ 
            transaction.commit( object );
        }

        // Notify listeners on attribute changes...
        // Transaction is never created when silent option is set, so just send events out.
        const { attributes, _isDirty } = object;
        for( let key of changes ){
            trigger3( object, 'change:' + key, object, attributes[ key ], _isDirty );
        }

        this.isRoot && commit( object, initiator );
    }
}