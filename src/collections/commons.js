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
    collection._byId  = {};

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


function ModelOptions( options, collection ){
    this.parse      = options.parse;
    this.collection = collection;
}

// convert argument to model. Return false if fails.
function toModel( collection, attrs, a_options ){
    // Only subtype of current collection model is allowed
    var Model = collection.model;
    if( attrs instanceof Model ) return attrs;

    var model          = new Model( attrs, new ModelOptions( a_options, collection ) );

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
        model              = new Model( attrs, new ModelOptions( a_options, collection ) );

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
        var low   = 0, high = array.length;
        while( low < high ){
            var mid = Math.floor( (low + high) / 2 );
            if( iteratee.call( context, array[ mid ], value ) < 0 ) low = mid + 1;
            else high = mid;
        }
        return low;
    }
    else return _.sortedIndex( array, obj, iteratee, context );
}

function ModelEventsDispatcher( model ){
    this[ 'change:' + model.prototype.idAttribute ] = updateIdAttr;
}

ModelEventsDispatcher.prototype = {
    change  : trigger2,
    sync    : trigger2,
    add     : triggerWhenRelevant,
    remove  : triggerWhenRelevant,
    destroy : function( self, event, model, collection, options ){
        self.remove( model, options );
        trigger3( self, event, model, collection, options );
    }
};

function triggerWhenRelevant( self, event, model, collection, options ){
    if( collection === self ){
        trigger3( self, event, model, collection, options );
    }
}

function updateIdAttr( self, event, model, collection, options ){
    var _byId = self._byId;

    _byId[ model._previousAttributes[ idAttribute ] ] = void 0;
    var id                                            = model.id;
    id == null || ( _byId[ id ] = model );

    trigger3( self, event, model, collection, options );
}