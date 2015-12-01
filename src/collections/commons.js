/**
 * Helper functions
 */


// Ownership and events subscription
function _addReference( collection, model ){
    model.collection || ( model.collection = collection );
    onAll( model, collection._onModelEvent, collection );
    return model;
}

function _removeReference( collection, model ){
    if( collection === model.collection ){
        model.collection = void 0;
    }

    offAll( model, collection._onModelEvent, collection );
}

function _removeRefs( collection ){
    var models = collection.models;

    collection.models = [];
    collection._byId = {};

    for( var i = 0; i < models.length; i++ ){
        _removeReference( collection, models[ i ] );
    }

    return models;
}

// Index management
function _addIndex( _byId, model ){
    _byId[ model.cid ] = model;
    var id             = model.id;
    if( id != null ){
        _byId[ id ] = model;
    }
}

function _removeIndex( _byId, model ){
    delete _byId[ model.cid ];
    var id = model.id;
    if( id != null ){
        delete _byId[ id ];
    }
}

function _move( source, at, len ){
    for( var j = source.length - len, i = at; j < source.length; i++, j++ ){
        var x       = source[ i ];
        source[ i ] = source[ j ];
        source[ j ] = x;
    }
}

function _notifyAdd( self, models, options ){
    var at = options.at;

    for( var i = 0; i < models.length; i++ ){
        var model = models[ i ];
        if( at != null ) options.index = at + i;
        trigger3( model, 'add', model, self, options );
    }
}

// Copy options as fast as its possible.
function fastCopy( dest, source ){
    if( source ){
        for( var i in source ){
            dest[ i ] = source[ i ];
        }
    }

    return dest;
}

// convert argument to model. Return false if fails.
function toModel( collection, attrs, a_options ){
    // Only subtype of current collection model is allowed
    var Model = collection.model;
    if( attrs instanceof Model ) return attrs;

    var options        = fastCopy( {}, a_options );
    options.collection = collection;
    var model          = new Model( attrs, options );

    if( model.validationError ){
        trigger3( collection, 'invalid', collection, model.validationError, options );
        return false;
    }

    return model;
}

function castAndRef( collection, attrs, a_options ){
    // Only subtype of current collection model is allowed
    var Model = collection.model,
        model = attrs;

    if( !( attrs instanceof Model ) ){
        var options        = fastCopy( {}, a_options );
        options.collection = collection;
        model          = new Model( attrs, options );

        if( model.validationError ){
            trigger3( collection, 'invalid', collection, model.validationError, options );
            return false;
        }
    }

    _addReference( collection, model );

    return model;
}

function sortedIndex( array, obj, iteratee, context ){
    if( typeof iteratee === 'function' && iteratee.length == 2 ){
        var value = obj;
        var low = 0, high = array.length;
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (iteratee.call( context, array[mid], value) < 0 ) low = mid + 1; else high = mid;
        }
        return low;
    }
    else return _.sortedIndex( array, obj, iteratee, context );
}