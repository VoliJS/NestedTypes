/**
 * Optimized collections core
 * all methods receive array and options objects, and must return array.
 *
 * [x] remove( models, options )
 * Optimized for few models removal. One?
 *  - dereference models, updating the index
 *  - pre-allocate array copy, fill with models present in index.
 *  - send 'remove' and 'update'
 *  (!) options.index is not supported.

 * [x] add( models, options )
 * Optimized for few models added. One?
 *  - push models to existing array, updating the index
 *      - update existing models
 *      - for sorted collections, use binary search and splice. One? Yes.
 *  - send 'add' and 'update'

 * set( models, options )
 * Optimized for few added and few removed.
 *  - create pre-allocated array of models with index
 *      - use existing models when possible, set if merge == true
 *      - skip non-existing, when add === false
 *  - dereference models missing in new index
 *      - or add them to index, if remove == false
 *  - sort if needed
 *  - send 'add', 'remove', and 'update'

 * [x] setEmpty( models, options )
 *  - create pre-allocated array of models with index
 *  - sort if needed
 *  - send 'add' and 'update'
 */



// parsed, a_models is an array, a_options is (copied) object
var ObjectProto = Object.prototype;


function toModel( collection, attrs, a_options ){
    var Model = collection.model;
    if( attrs instanceof Model ) return attrs;

    var options = fastCopy( {}, a_options );
    options.collection = collection;
    var model = new Model( attrs, options );

    if( model.validationError ){
        trigger3( collection, 'invalid', collection, model.validationError, options );
        return false;
    }

    return model;
}

exports.fastCopy = function fastCopy( dest, source ){
    if( source ){
        for( var i in source ){
            dest[ i ] = source[ i ];
        }
    }

    return dest;
};

function appendIndex( model, _byId ){
    var    id = model.id;
    id == null || ( _byId[ id ] = model );
    _byId[ model.cid ] = model;
}

function addReference( self, model, _byId ){
    var    id = model.id;
    id == null || ( _byId[ id ] = model );
    _byId[ model.cid ] = model;

    model.collection || ( model.collection = self );
    onAll( model, self._onModelEvent, self );

    return model;
}

/**
 *  * set( models, options )
 * Guidlines:
 *      - fastest case should be - no add/remove.
 *          - keep index and models in place, sort if necessary.
 *      - no reused elements - switch to fast path.
 *
 *      - few things added and removed - reasonably ok.
 *
 *  - create pre-allocated array of models with index
 *      - use existing models when possible, set if merge == true
 *      - skip non-existing, when add === false
 *  - dereference models missing in new index
 *      - or add them to index, if remove == false
 *  - sort if needed
 *  - send 'add', 'remove', and 'update'
 */




exports.set = function set( self, a_toSet, a_options ){
    var options = a_options,
        toSet  = options.parse ? self.parse( a_toSet, options ) : a_toSet;

    var merge  = a_options.merge, add = a_options.add, remove = a_options.remove,
        parse = a_options.parse;

    if( merge  === void 0 ) merge  = true;
    if( add    === void 0 ) add    = true;
    if( remove === void 0 ) remove = true;

    var sort = false,
        sortable = self.comparator && (at == null) && a_options.sort !== false,
        sortAttr = typeof this.comparator === 'string' ? this.comparator : null;

    var Model = self.model,
        idAttribute = Model.prototype.idAttribute || 'id';

    // 1. Create new array and index
    var models = new Array( toSet.length ),
        _byId = {}, added = [];

    for( var i = 0, j =0; i < toSet.length; i++ ){
        // handle existing models...
        var source = toSet[ i ],
            existing  = self.get( source );

        if( existing ){
            models[ j++ ] = appendIndex( existing, _byId );

            if( merge ){
                var attrs = source.attributes || source;
                if( parse ) attrs = existing.parse( attrs, options );
                existing.set( attrs, options );
                if( sortable && !sort && existing.hasChanged( sortAttr ) ) sort = true;
            }
        }
        else if( add ){
            var model = toModel( self, source, options );
            if( model ){
                added.push( models[ j++ ] = addReference( self, model, _byId ) );
            }
        }

        // todo: Do not add multiple models with the same `id`.
    }

    models.length = j;

    // Put collection to consistent state...
    var prev = self.models;
    self.models = models;
    self._byId = _byId;

    // keep models, if removing is denied...
    remove || transferModels( self, prev );

    // sort, if needed...
    if( sort ) self.sort( { silent : true } );

    // dereference removed models...
    var removed = remove ? dereferenceModels( self, prev, options ) : 0;

    if( !options.silent ){
        notifyAdd( self, added, options );
        if( sort ) trigger2( self, 'sort', self, options );
        if (added.length || removed ) trigger2( self, 'update', this, options);
    }

    return models;
};

function dereferenceModels( self, models, options ){
    var _byId = self._byId,
        silent = options.silent,
        removed = 0;

    for( var i = 0; i < models.length; i++ ){
        var model = models[ i ];

        if( !_byId[ model.cid ] ){
            silent || trigger3( model, 'remove', model, self, options );

            // remove reference to collection
            model.offAll( self._onModelEvent, self );
            if( self === model.collection ) model.collection = void 0;

            removed++;
        }
    }

    return removed;
}

function transferModels( self, toTransfer ){
    var models = self.models,
        _byId  = self._byId;

    for( var i = 0; i < toTransfer.length; i++ ){
        var model = toTransfer[ i ];

        if( !_byId[ model.cid ] ){
            models.push( appendIndex( prev[ i ], _byId ) );
        }
    }
}


// Update a collection by `set`-ing a new list of models, adding new ones,
// removing models that are no longer present, and merging models that
// already exist in the collection, as necessary. Similar to **Model#set**,
// the core operation for updating the data contained by the collection.
function set(self, models, options) {
    if (models == null) return;

    options = _.defaults({}, options, setOptions);
    if (options.parse && !self._isModel(models)) models = self.parse(models, options);

    var singular = !_.isArray(models);
    models = singular ? [models] : models.slice();

    var at = options.at;
    if (at != null) at = +at;
    if (at < 0) at += self.length + 1;

    var set = [];
    var toAdd = [];
    var toRemove = [];
    var modelMap = {};

    var add = options.add;
    var merge = options.merge;
    var remove = options.remove;

    var sort = false;
    var sortable = self.comparator && (at == null) && options.sort !== false;
    var sortAttr = _.isString(self.comparator) ? self.comparator : null;

    // Turn bare objects into model references, and prevent invalid models
    // from being added.
    var model, reused = 0;

    for (var i = 0; i < models.length; i++) {
        model = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        var existing = self.get( model );
        if (existing) {
            if (merge && model !== existing) {
                var attrs = model.attributes || model;
                if (options.parse) attrs = existing.parse(attrs, options);
                existing.set(attrs, options);
                if( sortable && !sort ) sort = existing.hasChanged( sortAttr );
            }

            if( !modelMap[ existing.cid ] ){
                modelMap[ existing.cid ] = true;
                reused++;
            }

            // If self is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
            model = models[i] = self._prepareModel(model, options);
            // todo: ref model here! (?) No
            if (model) toAdd.push( model );
        }
    }

    // (!) fast path 1 - no intersection.
    // Remove all, add all, valid models inside, all copied.
    if( !reused && remove ) return fastReplace( self, toAdd, options );

    var length = self.models.length;
    if( remove && reused < length ){
        var copy = Array( reused + toAdd.length ),
            j = 0;

        for (i = 0; i < self.length; i++) {
            model = self.models[i];
            if( modelMap[ model.cid ] ){
                copy[ j++ ] = model;
            }
            else{
                // remove refs
            }
        }

        for( i = 0; i < toAdd.length; i++ ){
            copy[ j++ ] = refModel( self, toAdd[ i ] );
        }
    }
    else {
        // Fast path 2 - nothing to remove, if all models are touched.
        // Modify array in place, using push.
        if( at !== void 0 ){
            var rest = self.models.splice( at, self.length - at );
            self.models = self.models.concat( toAdd, rest );
        }
        else{
            for( i = 0; i < toAdd.length; i++ ){
                // add reference, add to index, use push.
                self.models.push( refModel( self, toAdd[ i ] ) );
            }
        }
    }

    // Silently sort the collection if appropriate.
    if (sort || ( sortable && toAdd.length ) ) self.sort({silent: true});

    // Unless silenced, it's time to fire all appropriate add/sort events.
    if (!options.silent) {
        for (i = 0; i < toAdd.length; i++) {
            if (at != null) options.index = at + i;
            model = toAdd[i];
            model.trigger('add', model, self, options);
        }
        if (sort || orderChanged) self.trigger('sort', self, options);
        if (toAdd.length || toRemove.length) self.trigger('update', self, options);
    }

    // Return the added (or merged) model (or models).
    return singular ? models[0] : models;
}
