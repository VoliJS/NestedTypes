import { Record } from '../record'
import { Owner, Transaction, ItemsBehavior,
        TransactionOptions, Transactional, transactionApi } from '../transactions'

import { eventsApi, tools } from '../object-plus'

const { EventMap, trigger2, trigger3, on, off } = eventsApi,
      { commit, markAsDirty } = transactionApi,
      _aquire = transactionApi.aquire, _free = transactionApi.free;

/** @private */
export interface CollectionCore extends Transactional, Owner {
    _byId : IdIndex
    models : Record[]
    model : typeof Record
    idAttribute : string // TODO: Refactor inconsistent idAttribute usage
    _comparator : Comparator
    get( objOrId : string | Record | Object ) : Record    
    _itemEvents? : eventsApi.EventMap
    _shared : number
    _aggregationError : Record[]

    _log( level : string, text : string, value : any ) : void
}

// Collection's manipulation methods elements
export type Elements = ( Object | Record )[];

export interface CollectionOptions extends TransactionOptions {
    sort? : boolean
}

export type Comparator = ( a : Record, b : Record ) => number;  

/** @private */
export function dispose( collection : CollectionCore ) : Record[]{
    const { models } = collection;

    collection.models = [];
    collection._byId  = {};

    freeAll( collection, models );
    return models;
}

/** @private */
export function convertAndAquire( collection : CollectionCore, attrs : {} | Record, options : CollectionOptions ){
    const { model } = collection;
    
    let record : Record;

    if( collection._shared ){
        record = attrs instanceof model ? attrs : <Record>model.create( attrs, options );

        if( collection._shared & ItemsBehavior.listen ){
            on( record, record._changeEventName, collection._onChildrenChange, collection );
        }
    }
    else{
        record = attrs instanceof model ? ( options.merge ? attrs.clone() : attrs ) : <Record>model.create( attrs, options );

        if( !_aquire( collection, record ) ){
            const errors = collection._aggregationError || ( collection._aggregationError = [] );
            errors.push( record );
        }
    }    

    // Subscribe for events...
    const { _itemEvents } = collection;
    _itemEvents && _itemEvents.subscribe( collection, record );

    return record;
}

/** @private */
export function free( owner : CollectionCore, child : Record, unset? : boolean ) : void {
    if( owner._shared ){
        if( owner._shared & ItemsBehavior.listen ){
            off( child, child._changeEventName, owner._onChildrenChange, owner );
        }
    }
    else{
        _free( owner, child );
        unset || child.dispose();
    }

    const { _itemEvents } = owner;
    _itemEvents && _itemEvents.unsubscribe( owner, child );
}

/** @private */
export function freeAll( collection : CollectionCore, children : Record[] ) : Record[] {
    for( let child of children ){
        free( collection, child );
    }

    return children;
}

/**
 * Silently sort collection, if its required. Returns true if sort happened.
 * @private
 */   
export function sortElements( collection : CollectionCore, options : CollectionOptions ) : boolean {
    let { _comparator } = collection;
    if( _comparator && options.sort !== false ){
        collection.models.sort( _comparator );
        return true;
    }

    return false;
}

/**********************************
 * Collection Index
 * @private 
 */
export interface IdIndex {
    [ id : string ] : Record
}

/** @private Add record */ 
export function addIndex( index : IdIndex, model : Record ) : void {
    index[ model.cid ] = model;
    var id             = model.id;
    
    if( id || id === 0 ){
        index[ id ] = model;
    }
}

/** @private Remove record */ 
export function removeIndex( index : IdIndex, model : Record ) : void {
    delete index[ model.cid ];
    var id = model.id;
    if( id || id === 0 ){
        delete index[ id ];
    }
}

export function updateIndex( index : IdIndex, model : Record ){
    delete index[ model.previous( model.idAttribute ) ];

    const { id } = model;
    id == null || ( index[ id ] = model );
}

/***
 * In Collections, transactions appears only when
 * add remove or change events might be emitted.
 * reset doesn't require transaction.
 * 
 * Transaction holds information regarding events, and knows how to emit them.
 * 
 * Two major optimization cases.
 * 1) Population of an empty collection
 * 2) Update of the collection (no or little changes) - it's crucial to reject empty transactions.
 */


// Transaction class. Implements two-phase transactions on object's tree.
/** @private */ 
export class CollectionTransaction implements Transaction {
    // open transaction
    constructor(    public object : CollectionCore,
                    public isRoot : boolean,
                    public added : Record[],
                    public removed : Record[],
                    public nested : Transaction[],
                    public sorted : boolean ){}

    // commit transaction
    commit( initiator? : Transactional ){
        const { nested, object } = this,
              { _isDirty } = object;

        // Commit all nested transactions...
        for( let transaction of nested ){
            transaction.commit( object );
        }

        if( object._aggregationError ){
            logAggregationError( object );
        }

        // Just trigger 'change' on collection, it must be already triggered for models during nested commits.
        // ??? TODO: do it in nested transactions loop? This way appears to be more correct. 
        for( let transaction of nested ){
            trigger2( object, 'change', transaction.object, _isDirty );
        }

        // Notify listeners on attribute changes...
        const { added, removed } = this;

        // Trigger `add` events for both model and collection.
        for( let record of added ){
            trigger3( record, 'add', record, object, _isDirty );
            trigger3( object, 'add', record, object, _isDirty );
        }

        // Trigger `remove` events for both model and collection.
        for( let record of removed ){
            trigger3( record, 'remove', record, object, _isDirty );
            trigger3( object, 'remove', record, object, _isDirty );
        }

        if( this.sorted ){
            trigger2( object, 'sort', object, _isDirty );
        }

        if( added.length || removed.length ){
            trigger2( object, 'update', object, _isDirty );
        }

        this.isRoot && commit( object, initiator );
    }
}

export function logAggregationError( collection : CollectionCore ){
    collection._log( 'error', 'added records already have an owner', collection._aggregationError );
    collection._aggregationError = void 0;
}