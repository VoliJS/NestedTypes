module.export = {
    fastCopy    : fastCopy,
    toModel     : toModel,
    addOne      : addOne,
    removeOne   : removeOne,
    removeMany  : removeMany,
    setMany     : setMany,
    replaceMany : replaceMany
};

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

// fast-path for singular add and remove...
function addOne( collection, el, options ){
    if( collection.get( el ) ){
        return;
    }

    var model = toModel( collection, el, options );
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
    _removeModels( this, removed, a_options );

    a_options.silent || !removed.length || trigger2( collection, 'update', collection, a_options );

    return removed;
}

var silence = { silent : true };

function replaceMany( self, models, a_options ){
    var options = fastCopy( {}, a_options ),
        notify  = !options.silent;

    var removed = this.models;
    var added   = _replaceModels( self, models, options );

    var sort = self.comparator && added.length && options.sort !== false;
    if( sort ) self.sort( silence );

    // Remove refs from old models, if any...
    removed.length && _removeModels( this, removed, options );

    if( notify ){
        added.length && _notifyAdd( self, added, options );
        sort && trigger2( self, 'sort', self, options );
        if( added.length || removed.length ){
            trigger2( self, 'update', self, options );
        }
    }

    return added;
}

function _removeModels( collection, removed, options ){
    var silent = options.silent;
    for( var i = 0; i < removed.length; i++ ){
        var model = removed[ i ];
        silent || trigger3( model, 'remove', model, this, options );
        _removeReference( collection, model );
    }
}

// assign models and update index
function _replaceModels( self, source, options ){
    var models = Array( source.length ),
        _byId  = {};

    for( var i = 0, j = 0; i < source.length; i++ ){
        var model = toModel( self, source[ i ] || {}, options );

        if( model ){
            models[ j++ ] = model;
            _addIndex( _byId, model );
            _addReference( self, model );
        }
    }

    self.length = models.length = j;
    self.models = models;
    self._byId  = _byId;

    return models;
}

// Update a collection by `set`-ing a new list of models, adding new ones,
// removing models that are no longer present, and merging models that
// already exist in the collection, as necessary. Similar to **Model#set**,
// the core operation for updating the data contained by the collection.
function setMany( self, a_models, a_options ){
    if( a_models == null ) return;

    var options = fastCopy( { add : true, remove : true, merge : true }, a_options ),
        models  = a_models;

    var at = options.at;
    if( at != null ) at = +at;
    if( at < 0 ) at += self.length + 1;

    var toAdd    = [],
        toRemove = [],
        modelMap = {};

    var add    = options.add,
        merge  = options.merge,
        remove = options.remove;

    var sort     = false,
        sortable = self.comparator && at == null && options.sort !== false,
        sortAttr = typeof self.comparator == 'string' ? self.comparator : null;

    // Turn bare objects into model references, and prevent invalid models
    // from being added.
    var model, reused = 0;

    for( var i = 0; i < models.length; i++ ){
        model = models[ i ];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        var existing = self.get( model );
        if( existing ){
            if( merge && model !== existing ){
                var attrs = model.attributes || model;
                if( options.parse ) attrs = existing.parse( attrs, options );
                existing.set( attrs, options );
                if( sortable && !sort ) sort = existing.hasChanged( sortAttr );
            }

            if( !modelMap[ existing.cid ] ){
                modelMap[ existing.cid ] = true;
                reused++;
            }
        }
        else if( add ){
            model = models[ i ] = self._prepareModel( model, options );
            _addReference( this, model );
            if( model ) toAdd.push( model );
        }
    }

    // Some models are reused...
    var toRemove = [];

    if( remove ){
        // fast path 1 - nothing to remove...
        if( reused == this.models.length ){
            fpAdd( self, toAdd );
        }
        // fast path 2 - no intersection...
        else if( !reused ){
            toRemove = this.models;
            fpNoIntersection( self, toAdd );
        }
        // No luck. Reallocate models, update index...
        else{
            toRemove = fpMerge( self, reused, modelMap, toAdd );
        }
    }
    else{
        // fast path 3 - not allowed to remove
        fpAdd( self, toAdd );
    }

    // alter position, whenever
    if( at !== void 0 ){
        _move( this.models, at, toAdd.length );
    }
    else if( sort || ( sortable && toAdd.length ) ){
        self.sort( { silent : true } );
    }

    if( toRemove.length ) _removeModels( this, toRemove, options );

    // Unless silenced, it's time to fire all appropriate add/sort events.
    if( !options.silent ){
        _notifyAdd( self, toAdd, options );
        if( sort ) trigger2( self, 'sort', self, options );
        if( toAdd.length || toRemove.length ) trigger2( self, 'update', self, options );
    }

    // Return the added (or merged) model (or models).
    return this.models;
}

function fpNoIntersection( collection, toAdd ){
    collection.models = toAdd;
    var _byId = collection._byId = {};

    // rebuild index...
    for( var i = 0; i < toAdd.length; i++ ){
        _addIndex( _byId, model );
    }
}

function fpAdd( collection, toAdd ){
    var models = collection.models,
        _byId = collection._byId;

    for( var i = 0; i < toAdd.length; i++ ){
        var model = toAdd[ i ];
        _addIndex( _byId, model );
        models.push( model );
    }
}

function fpMerge( collection, keepCount, toKeep, toAdd ){
    var nextModels = Array( keepCount + toAdd.length ),
        toRemove = Array( prevModels.length - keepCount ),
        prevModels = collection.models,
        _byId = collection._byId,
        j = 0, model;

    // Filter out removed models and remove them from the index...
    for( var i = 0, r = 0; i < prevModels.length; i++ ){
        model = prevModels[ i ];

        if( toKeep[ model.cid ] ){
            nextModels[ j++ ] = model;
        }
        else{
            _removeIndex( _byId, model );
            toRemove[ r++ ] = model;
        }
    }

    // Merge in added models and add them to the index...
    for( i = 0; i < toAdd.length; i++ ){
        model = toAdd[ i ];
        _addIndex( _byId, model );
        nextModels[ j++ ] = model;
    }

    this.models = nextModels;

    return toRemove;
}
/**
 * Helper functions
 */


// Ownership and events subscription
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