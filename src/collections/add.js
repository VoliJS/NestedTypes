/**
 * Add models to collection, if models with the same id doesn't belong to collection
 * options:
 *  - silent = false
 *  - sort = true
 *  - at = null
 *  - pass through other options
 */

function AddOptions( a_options ){
    var options = a_options || {};
    this.silent = options.silent;
    this.parse  = options.parse;
    this.sort   = options.sort;

    this.at     = options.at;
    this.index  = null;
}

AddOptions.prototype = {
    add    : true,
    remove : false,
    merge  : false
};

// fast-path for singular add and remove...
function addOne( collection, el, a_options ){
    var options = new AddOptions( a_options );

    var model = collection.get( el );
    if( model ){
        return model;
    }

    model = castAndRef( collection, el, options );

    if( model ){
        var models = collection.models,
            at     = options.at;

        if( at == null ){
            // if collection is sorted, use binary search to find position
            if( collection.comparator && options.sort !== false ){
                at = sortedIndex( models, model, collection.comparator, collection );
            }
        }
        else{
            // if at is given, it overrides sorting option...
            at = +at;
            if( at < 0 ) at += this.length + 1;
            if( at < 0 ) at = 0;
            if( at > this.length ) at = this.length;
        }

        if( at ){
            models.splice( at, 0, model );
        }
        else{
            models.push( model );
        }

        _addIndex( collection._byId, model );

        if( !options.silent ){
            trigger3( model, 'add', model, collection, options );
            trigger2( collection, 'update', collection, options );
        }

        return model;
    }
}

/**
 * update index and models array.
 */
function addMany( self, models, a_options ){
    var options = new AddOptions( a_options ),
        notify  = !options.silent,
        added   = [];

    _append( self, models, function( source ){
        var model = castAndRef( self, source, options );
        if( model ){
            added.push( model );
            return model;
        }
    } );

    var at     = a_options.at,
        insert = at != null,
        sort   = self.comparator && added.length && options.sort !== false && !insert;

    if( insert ){
        _move( this.models, at, added.length );
    }
    else if( sort ){
        self.sort( silence );
    }

    if( notify ){
        _notifyAdd( self, added, options );
        sort && trigger2( self, 'sort', self, options );
        if( added.length ){
            trigger2( self, 'update', self, options );
        }
    }

    return added;
}

// append data to model and index
function _append( self, source, getModel ){
    var models = self.models,
        _byId  = self._byId;

    for( var i = 0; i < source.length; i++ ){
        var src = source[ i ];
        if( src && !self.get( src ) ){
            var model = getModel( src, _byId );
            // add to array and indexes...
            if( model ){
                models.push( model );
                _addIndex( _byId, model );
            }
        }
    }
}

function _move( source, at, len ){
    for( var j = source.length - len, i = at; j < source.length; i++, j++ ){
        var x       = source[ i ];
        source[ i ] = source[ j ];
        source[ j ] = x;
    }
}