/*************
 * Remove items from collections.
 * 
 * Cannot be a part of two-phase transaction on object tree.
 * Can be executed in the scope of ad-hoc transaction or from the trigger, though.
 *
 * Implemented with low-level API. 
 * Most frequent operation - single element remove. Thus, it have the fast-path.
 */

import { Record } from '../record'
import { free, CollectionCore, CollectionTransaction, removeIndex } from './commons'
import { eventsApi } from '../object-plus'
import { TransactionOptions, transactionApi } from '../transactions' 

const { trigger2, trigger3 } = eventsApi,
    { markAsDirty, begin, commit } = transactionApi;

/** @private */
export function removeOne( collection : CollectionCore, el : Record | {} | string, options : TransactionOptions ) : Record {
    var model : Record = collection.get( el );

    if( model ){
        const isRoot = begin( collection ),
              models = collection.models;

        // Remove model form the collection. 
        models.splice( models.indexOf( model ), 1 );
        removeIndex( collection._byId, model );
        
        // Mark transaction as dirty. 
        const notify = markAsDirty( collection, options );

        // Send out events.
        if( notify ){
            trigger3( model, 'remove', model, collection, options );
            trigger3( collection, 'remove', model, collection, options );
        } 

        free( collection, model, options.unset );

        notify && trigger2( collection, 'update', collection, options );

        // Commit transaction.
        isRoot && commit( collection );

        return model;
    }
};

/** Optimized for removing many elements
 * 1. Remove elements from the index, checking for duplicates
 * 2. Create new models array matching index
 * 3. Send notifications and remove references
 */

/** @private */
export function removeMany( collection : CollectionCore, toRemove : any[], options ){
    const removed = _removeFromIndex( collection, toRemove, options.unset );
    if( removed.length ){
        const isRoot = begin( collection );

        _reallocate( collection, removed.length );

        if( markAsDirty( collection, options ) ){
            const transaction = new CollectionTransaction( collection, isRoot, [], removed, [], false );
            transaction.commit();
        }
        else{
            // Commit transaction.
            isRoot && commit( collection );
        }
    }

    return removed;
};

// remove models from the index...
/** @private */
function _removeFromIndex( collection, toRemove, unset : boolean ){
    var removed = Array( toRemove.length ),
        _byId   = collection._byId;

    for( var i = 0, j = 0; i < toRemove.length; i++ ){
        var model = collection.get( toRemove[ i ] );
        if( model ){
            removed[ j++ ] = model;
            removeIndex( _byId, model );
            free( collection, model, unset );
        }
    }

    removed.length = j;

    return removed;
}

// Allocate new models array removing models not present in the index.
/** @private */
function _reallocate( collection, removed ){
    var prev   = collection.models,
        models = collection.models = Array( prev.length - removed ),
        _byId = collection._byId;

    for( var i = 0, j = 0; i < prev.length; i++ ){
        var model = prev[ i ];

        if( _byId[ model.cid ] ){
            models[ j++ ] = model;
        }
    }

    models.length = j;
}