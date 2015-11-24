// subscribe for events and ownership
function _addReference( collection, model ){
    model.collection || ( model.collection = collection );
    onAll( model, collection._onModelEvent, collection );
}

function _removeReference( collection, model ){
    if( this === model.collection ){
        model.collection = void 0;
    }
    offAll( model, collection._onModelEvent, collection );
}

function _addIndex( _byId, model ){
    _byId[ model.cid ] = model;
    var id = model.id;
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

function _toModel( collection, attrs, a_options ){
    var Model = collection.model;
    if( attrs instanceof Model ){
        return attrs;
    }

    var options = fastCopy( {}, a_options );
    options.collection = collection;
    var model = new Model( attrs, options );

    if( model.validationError ){
        trigger3( collection, 'invalid', collection, model.validationError, options );
        return false;
    }

    return model;
}

function _notifyAdd( self, models, options ){
    for( var i = 0; i < models.length; i++ ){
        var model = models[ i ];
        trigger3( model, 'add', model, self, options );
    }
}

// fast-path for singular add and remove...
function addOne( collection, el, options ){
    if( collection.get( el ) ){
        return;
    }

    var model = _toModel( collection, el, options );
    if( model ){
        var models = collection.models,
            at     = options.at;

        if( collection.comparator && at == null && options.sort !== false ){
            at = _.sortedIndex( models, model, collection.comparator );
        }

        if( at ){
            models.splice( at, 0, model );
        }
        else{
            models.push( model );
        }

        _addIndex( collection._byId, model );
        _addReference( collection, model );

        if( !options.silent ){
            trigger3( model, 'add', model, collection, options );
            trigger2( collection, 'update', collection, options );
        }

        return model;
    }
}

function move( source, at, len ){
    for( var j = source.length - len, i = at; j < source.length; i++, j++ ){
        var x = source[ i ];
        source[ i ] = source[ j ];
        source[ j ] = x;
    }
}

function addMany( collection, a_toAdd, a_options ){
    var insert = options.at != null,
        _byId  = collection._byId,
        models = collection.models,
        sort   = collection.comparator && !insert && options.sort !== false,
        toAdd  = options.parse ? collection.parse( a_toAdd, options ) : a_toAdd;

    var added = Array( toAdd.length );

    for( var i = 0, addedCount = 0; i < toAdd.length; i++ ){
        // skip existing models...
        var source = toAdd[ i ],
            model  = collection.get( source );

        if( model ){
            continue;
        }

        // convert source to model...
        // todo: check if we need to copy options
        model = _toModel( collection, source || {}, options );

        if( model ){
            _addReference( collection, model );
            _addIndex( _byId, model );
            models.push( model );
            added[ addedCount++ ] = model;
        }
    }

    added.length = addedCount;

    // update array...
    if( insert ){
        collection.models = move( models, options.at, addedCount );
    }

    if( sort && addedCount ){ collection.sort({ silent : true }); }

    if( !options.silent ){
        _notifyAdd( collection, added, options );
        addedCount && trigger2( collection, 'update', collection, a_options );
    }

    return added;
}

function removeOne( collection, el, options ){
    var model = collection.get( el );
    if( model ){
        var models = collection.models,
            sorted = collection.comparator && options.sort !== false;

        var at = sorted ?
                 _.sortedIndex( models, model, collection.comparator )
            : _.indexOf( models, model );

        models.splice( at, 1 );

        _removeIndex( collection._byId, model );

        if( !options.silent ){
            trigger3( model, 'remove', model, collection, options );
            trigger2( collection, 'update', collection, options );
        }

        _removeReference( collection, model );

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

    // 1. Remove models from index
    var removed = new Array[ toRemove.length ],
        removed = 0, i, j;

    for( i = 0, j = 0; i < toRemove.length; i++ ){
        var model = collection.get( toRemove[ i ] );
        if( model ){
            removed[ j++ ] = model;
            _removeIndex( _byId, model );
        }
    }

    removed.length = j;

    // 2. Remove models from array
    var prev   = collection.models,
        models = collection.models = new Array( prev.length - j );

    for( i = 0, j = 0; i < prev.length; i++ ){
        model = prev[ i ];

        if( _byId[ model.cid ] ){
            models[ j++ ] = model;
        }
    }

    models.length = j;

    // 3. Send notifications and dereference models
    for( i = 0; i < removed; i++ ){
        a_options.silent || trigger3( model, 'remove', model, collection, a_options );
        _removeReference( collection, model );
    }

    a_options.silent || !removed.length || trigger2( collection, 'update', collection, a_options );

    return removed;
}

exports.setEmpty = function setEmpty( self, a_models, a_options ){
    var options = fastCopy( {}, a_options ),
        models = options.parse ? self.parse( a_models, options ) : a_models;

    models = emptyAssign( self, models, a_options );

    var sort = self.comparator && models.length && a_options.sort !== false;

    if( sort ) self.sort( { silent : true } );

    if( models.length && !options.silent ){
        _notifyAdd( self, models, options );
        if( sort ) trigger2( self, 'sort', self, options );
        trigger2( self, 'update', self, options );
    }

    return models;
};

// assign models and update index
function emptyAssign( self, source, options ){
    var models = Array( source.length ),
        _byId = {};

    for( var i = 0, j = 0; i < source.length; i++ ){
        var model = _toModel( self, source[ i ] || {}, options );

        if( model ){
            models[ j++ ] = model;
            _addIndex( _byId, model );
            _addReference( self, model );
        }
    }

    self.length = models.length = j;
    self.models = models;
    self._byId =_byId;

    return models;
}
