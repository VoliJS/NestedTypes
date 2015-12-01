
module.exports = {
    removeOne : removeOne,
    removeMany : removeMany
};

/**
 * Remove single element from collection
 * el: ModelId | ModelCid | Model | ModelAttrs
 * Options:
 *      - silent : Boolean = false
 */

function removeOne( collection, el, options ){
    var model = collection.get( el );
    if( model ){
        // TODO: for sorted collection, find element with binary search.
        var at = _.indexOf( models, model ),
            silent = options.silent;

        models.splice( at, 1 );

        _removeIndex( collection._byId, model );

        silent || trigger3( model, 'remove', model, collection, options );

        _removeReference( collection, model );

        silent || trigger2( collection, 'update', collection, options );

        return model;
    }
}

/** Optimized for removing many elements
 * 1. Remove elements from the index, checking for duplicates
 * 2. Create new models array matching index
 * 3. Send notifications and remove references
 */
function removeMany( collection, toRemove, a_options ){
    var _byId = collection._byId;

    var removed = _removeFromIndex( collection, toRemove );

    _reallocate( collection, removed.length );

    _removeModels( collection, removed, a_options );

    a_options.silent || !removed.length || trigger2( collection, 'update', collection, a_options );

    return removed;
}

// remove models from the index...
function _removeFromIndex( collection, toRemove ){
    var removed = Array( toRemove.length ),
        _byId = collection._byId;

    for( var i = 0, j = 0; i < toRemove.length; i++ ){
        var model = collection.get( toRemove[ i ] );
        if( model ){
            removed[ j++ ] = model;
            _removeIndex( _byId, model );
        }
    }

    removed.length = j;

    return removed;
}

// Allocate new models array removing models not present in the index.
function _reallocate( collection, removed ){
    var prev   = collection.models,
        models = collection.models = Array( prev.length - removed ),
        _byId  = collection._byId;

    for( var i = 0, j = 0; i < prev.length; i++ ){
        var model = prev[ i ];

        if( _byId[ model.cid ] ){
            models[ j++ ] = model;
        }
    }

    models.length = j;
}