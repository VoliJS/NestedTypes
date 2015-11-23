// parsed, a_models is an array, a_options is (copied) object
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