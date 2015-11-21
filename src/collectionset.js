function collectionSet( self, a_models, a_options ){
    var options = { add : true, remove : true, merge : true },
        models  = a_models;

    fastCopy( options, a_options );

    if( options.parse ){
        models = self.parse( models, options );
    }

    var singular = !( models && models instanceof Array );
    models = singular ? (models ? [ models ] : []) : models.slice();

    var i, l, id, existing, sort;

    var at = options.at;
    var targetModel = self.model;
    var sortable = self.comparator && (at == null) && options.sort !== false;
    var sortAttr = typeof self.comparator == 'string' ? self.comparator : null;

    var toAdd    = [],
        modelMap = {};

    var add    = options.add,
        merge  = options.merge,
        remove = options.remove;

    var order = !sortable && add && remove ? [] : false;

// Turn bare objects into model references, and prevent invalid models
// from being added.
    for( i = 0, l = models.length; i < l; i++ ){
        var attrs = models[ i ] || {},
            model;

        if( attrs instanceof Model ){
            id = model = attrs;
        }
        else{
            id = attrs[ targetModel.prototype.idAttribute || 'id' ];
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if( existing = self.get( id ) ){
            if( remove ){
                modelMap[ existing.cid ] = true;
            }
            if( merge ){
                attrs = attrs === model ? model.attributes : attrs;
                if( options.parse ){
                    attrs = existing.parse( attrs, options );
                }
                existing.set( attrs, options );
                if( sortable && !sort && existing.hasChanged( sortAttr ) ){
                    sort = true;
                }
            }
            models[ i ] = existing;

            // If this is a new, valid model, push it to the `toAdd` list.
        }
        else if( add ){
            model = models[ i ] = self._prepareModel( attrs, options );
            if( !model ){
                continue;
            }
            toAdd.push( model );
            self._addReference( model, options );
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if( order && (model.isNew() || !modelMap[ model.id ]) ){
            order.push( model );
        }
        modelMap[ model.id ] = true;
    }

    // Remove nonexistent models if appropriate.
    if( remove ) doRemove( self, modelMap );

// See if sorting is needed, update `length` and splice in new models.
    if( toAdd.length || (order && order.length) ){
        if( sortable ){
            sort = true;
        }
        self.length += toAdd.length;
        if( at != null ){
            for( i = 0, l = toAdd.length; i < l; i++ ){
                self.models.splice( at + i, 0, toAdd[ i ] );
            }
        }
        else{
            if( order ){
                self.models.length = 0;
            }
            var orderedModels = order || toAdd;
            for( i = 0, l = orderedModels.length; i < l; i++ ){
                self.models.push( orderedModels[ i ] );
            }
        }
    }

// Silently sort the collection if appropriate.
    if( sort ){
        self.sort( { silent : true } );
    }

// Unless silenced, it's time to fire all appropriate add/sort events.
    if( !options.silent ){
        for( i = 0, l = toAdd.length; i < l; i++ ){
            trigger3( model = toAdd[ i ], 'add', model, self, options );
        }
        if( sort || (order && order.length) ){
            trigger2( self, 'sort', self, options );
        }
    }

// Return the added (or merged) model (or models).
    return singular ? models[ 0 ] : models;
}

function doRemove( self, modelMap ){
    var toRemove = [], model;

    for( var i = 0, l = self.length; i < l; ++i ){
        if( !modelMap[ (model = self.models[ i ]).cid ] ){
            toRemove.push( model );
        }
    }

    if( toRemove.length ){
        self.remove( toRemove, options );
    }
}