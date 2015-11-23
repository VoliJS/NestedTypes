/**
 * Optimized collections core
 *
 * remove( models, options )
 * Optimized for few models removal. One?
 *  - dereference models, updating the index
 *  - pre-allocate array copy, fill with models present in index.
 *  - send 'remove' and 'update'

 * add( models, options )
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

 * setEmpty( models, options )
 *  - create pre-allocated array of models with index
 *  - sort if needed
 *  - send 'add' and 'update'
 */



// parsed, a_models is an array, a_options is (copied) object
var ObjectProto = Object.prototype;

exports.reset = emptySet;
function emptySet( self, a_models, a_options ){
    var singular    = !( a_models && a_models instanceof Array ),
        models      = singular ? ( a_models ? [ a_models ] : [] ) : a_models,
        options = fastCopy( {}, a_options );


    if( options.parse ) models = self.parse( models, options );

// Turn bare objects into model references, and prevent invalid models
// from being added.
    var models = emptyAssign( self, a_models, a_options ),
        sort = self.comparator && models.length && a_options.sort !== false;

// Silently sort the collection if appropriate.
    if( sort ) self.sort( { silent : true } );

// Unless silenced, it's time to fire all appropriate add/sort events.
    if( models.length && !options.silent ){
        notifyAdd( self, models, options );
        if( sort ) trigger2( self, 'sort', self, options );
        trigger2( self, 'update', self, options );
    }

    return models;
}

// assign models and update index
function emptyAssign( self, source, options ){
    var models = new Array( source.length ),
        _byId = {};

    for( var i = 0, j = 0; i < source.length; i++ ){
        var model = toModel( self, source[ i ] || {}, options );

        if( model ){
            models[ j++ ] = model;
            var    id = model.id;
            id == null || ( _byId[ id ] = model );
            _byId[ model.cid ] = model;

            model.collection || ( model.collection = self );
            onAll( model, self._onModelEvent, self );
        }
    }

    self.length = models.length = j;
    self.models = models;
    self._byId =_byId;

    return models;
}

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

exports.fastCopy = fastCopy;
function fastCopy( dest, source ){
    if( source ){
        for( var i in source ){
            dest[ i ] = source[ i ];
        }
    }

    return dest;
}

// todo: Special case optimizations:
// regular set as comes from fetch:
// - [] -> [ a, b, ... ]
//      When the set is initially empty, attrs, not models.
// - [ a, b, ... ] -> [ a, b, ... ]
//      Populated collection with a few changes, attrs, not models.

exports.set = set;
function set( self, a_models, a_options ){
    var options = { add : true, remove : true, merge : true },
        models  = a_models;

    fastCopy( options, a_options );

    if( options.parse ) models = self.parse( models, options );
    var singular    = !( models && models instanceof Array );
    models          = singular ? (models ? [ models ] : []) : models.slice();
    var i, l, id, model, attrs, existing, sort;
    var at          = options.at;
    var idAttribute = self.model.prototype.idAttribute || 'id';
    var sortable    = self.comparator && (at == null) && options.sort !== false;
    var sortAttr    = typeof self.comparator == 'string' ? self.comparator : null;
    var toAdd       = [], toRemove = [], modelMap = {};
    var add         = options.add, merge = options.merge, remove = options.remove;
    var order       = !sortable && add && remove ? [] : false;

// Turn bare objects into model references, and prevent invalid models
// from being added.
    for( i = 0, l = models.length; i < l; i++ ){
        attrs = models[ i ] || {};
        id = attrs instanceof Model ? ( model = attrs ) : attrs[ idAttribute ];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if( existing = self.get( id ) ){
            if( remove ) modelMap[ existing.cid ] = true;
            if( merge ){
                attrs = attrs === model ? model.attributes : attrs;
                if( options.parse ) attrs = existing.parse( attrs, options );
                existing.set( attrs, options );
                if( sortable && !sort && existing.hasChanged( sortAttr ) ) sort = true;
            }

            models[ i ] = existing;

            // If this is a new, valid model, push it to the `toAdd` list.
        }
        else if( add ){
            model = models[ i ] = toModel( self, attrs, options );
            if( !model ) continue;
            toAdd.push( model );
            _addReference( self, model );
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if( order && (model.isNew() || !modelMap[ model.id ]) ) order.push( model );
        modelMap[ model.id ] = true;
    }

// Remove nonexistent models if appropriate.
    if( remove ){
        for( i = 0, l = self.length; i < l; ++i ){
            if( !modelMap[ (model = self.models[ i ]).cid ] ) toRemove.push( model );
        }
        if( toRemove.length ) _removeModels( self, toRemove, options );
    }

// See if sorting is needed, update `length` and splice in new models.
    if( toAdd.length || (order && order.length) ){
        if( sortable ) sort = true;
        self.length += toAdd.length;
        if( at != null ){
            for( i = 0, l = toAdd.length; i < l; i++ ){
                self.models.splice( at + i, 0, toAdd[ i ] );
            }
        }
        else{
            if( order ) self.models.length = 0;
            var orderedModels = order || toAdd;
            for( i = 0, l = orderedModels.length; i < l; i++ ){
                self.models.push( orderedModels[ i ] );
            }
        }
    }

// Silently sort the collection if appropriate.
    if( sort ) self.sort( { silent : true } );

// Unless silenced, it's time to fire all appropriate add/sort events.
    if( !options.silent ){
        notifyAdd( self, models, options );
        if( sort || (order && order.length) ) trigger2( self, 'sort', self, options );
        if (toAdd.length || toRemove.length) trigger2( self, 'update', this, options);
    }

// Return the added (or merged) model (or models).
    return singular ? models[ 0 ] : models;
}

function notifyAdd( self, models, options ){
    for( var model, i = 0, l = models.length; i < l; i++ ){
        trigger3( model = models[ i ], 'add', model, self, options );
    }
}

// Internal method to create a model's ties to a collection.
function _addReference( self, model ) {
    self._byId[model.cid] = model;
    if (model.id != null) self._byId[model.id] = model;
    if (!model.collection) model.collection = self;

    onAll( model, self._onModelEvent, self );
}


// O( toRemove ) * 2 * O( models )
function _removeModels( self, toRemove, options ){
    var origLength = self.length,
        models = self.models,
        _byId = self._byId;

    for( var i = 0; i < toRemove.length; i++ ) {
        var model = self.get( toRemove[ i ] );
        if( model ){
            delete _byId[ model.id ];
            delete _byId[ model.cid ];

            var index = self.indexOf( model );
            models.splice( index, 1 );
            self.length--;

            if (!options.silent) {
                options.index = index;
                model.trigger('remove', model, self, options);
            }

            self._removeReference(model, options);
        }
    }

    return origLength - self.length;
}