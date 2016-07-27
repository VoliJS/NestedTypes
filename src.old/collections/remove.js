/**
 * Remove single element from collection
 * el: ModelId | ModelCid | Model | ModelAttrs
 * Options:
 *      - silent : Boolean = false
 */

var Commons         = require( './commons' ),
    removeIndex     = Commons.removeIndex,
    removeReference = Commons.removeReference;

var Events   = require( '../backbone+' ).Events,
    trigger3 = Events.trigger3,
    trigger2 = Events.trigger2;

function RemoveOptions( options ){
    this.silent = options.silent;
}

RemoveOptions.prototype = {
    add    : false,
    remove : true,
    merge  : false
};

exports.removeOne = function removeOne( collection, el, a_options ){
    var options = new RemoveOptions( a_options );

    var model = collection.get( el );
    if( model ){
        var models = collection.models,
            // TODO: for sorted collection, find element with binary search.
            at     = _.indexOf( models, model ),
            silent = options.silent;

        models.splice( at, 1 );

        removeIndex( collection._byId, model );

        silent || trigger3( model, 'remove', model, collection, options );

        removeReference( collection, model );

        silent || trigger2( collection, 'update', collection, options );

        return model;
    }
};

/** Optimized for removing many elements
 * 1. Remove elements from the index, checking for duplicates
 * 2. Create new models array matching index
 * 3. Send notifications and remove references
 */
exports.removeMany = function removeMany( collection, toRemove, a_options ){
    var options = new RemoveOptions( a_options );

    var removed = _removeFromIndex( collection, toRemove );

    _reallocate( collection, removed.length );

    _removeModels( collection, removed, options );

    options.silent || !removed.length || trigger2( collection, 'update', collection, options );

    return removed;
};

// remove models from the index...
function _removeFromIndex( collection, toRemove ){
    var removed = Array( toRemove.length ),
        _byId   = collection._byId;

    for( var i = 0, j = 0; i < toRemove.length; i++ ){
        var model = collection.get( toRemove[ i ] );
        if( model ){
            removed[ j++ ] = model;
            removeIndex( _byId, model );
        }
    }

    removed.length = j;

    return removed;
}

// Allocate new models array removing models not present in the index.
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

function _removeModels( collection, removed, options ){
    var silent = options.silent;
    for( var i = 0; i < removed.length; i++ ){
        var model = removed[ i ];
        silent || trigger3( model, 'remove', model, collection, options );
        removeReference( collection, model );
    }
}