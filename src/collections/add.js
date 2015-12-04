/**
 * Add models to collection, if models with the same id doesn't belong to collection
 * options:
 *  - silent = false
 *  - sort = true
 *  - at = null
 *  - pass through other options
 */
var Events   = require( '../backbone+' ).Events,
    trigger2 = Events.trigger2,
    trigger3 = Events.trigger3;

var Commons         = require( './commons' ),
    addIndex        = Commons.addIndex,
    addReference    = Commons.addReference,
    removeReference = Commons.removeReference,
    toModel         = Commons.toModel,
    silence         = Commons.silence;

var MergeOptions = exports.MergeOptions = function( a_options, collection ){
    var options = a_options || {};

    this.silent   = options.silent;
    this.parse    = options.parse;
    this.merge    = options.merge;
    this.validate = options.validate;

    // at option
    var at = options.at;
    if( at != null ){
        this.sort = false;

        // if at is given, it overrides sorting option...
        at = +at;
        if( at < 0 ) at += collection.length + 1;
        if( at < 0 ) at = 0;
        if( at > collection.length ) at = collection.length;

        this.at    = at;
        this.index = null;
    }
    else{
        this.sort = collection.comparator && options.sort !== false;
    }
};

MergeOptions.prototype = {
    notify : function( collection, added, sorted ){
        var at       = this.at,
            inserted = at != null;

        for( var i = 0; i < added.length; i++ ){
            var model = added[ i ];
            if( inserted ) this.index = at++;
            trigger3( model, 'add', model, collection, this );
        }

        sorted && trigger2( collection, 'sort', collection, this );

        if( added.length ){
            trigger2( collection, 'update', collection, this );
        }
    }
};

exports.add = function add( collection, items, a_options ){
    var options = new MergeOptions( a_options, collection );

    var _changed        = collection._changed;
    collection._changed = false;

    var added = _append( collection, items, options );

    var changed  = collection._changed || added.length,
        needSort = options.sort && changed;

    collection._changed = changed || _changed;

    if( options.at != null ){
        _move( collection.models, options.at, added );
    }
    else if( needSort ){
        collection.sort( silence );
    }

    options.silent || options.notify( collection, added, needSort );

    return added;
};

// append data to model and index
function _append( collection, a_items, a_options ){
    var models      = collection.models,
        _byId       = collection._byId,
        merge       = a_options.merge,
        parse       = a_options.parse,
        idAttribute = collection.model.prototype.idAttribute,
        added       = [];

    for( var i = 0; i < a_items.length; i++ ){
        var item  = a_items[ i ],
            model = item ? _byId[ item[ idAttribute ] ] || _byId[ item.cid ] : null;

        if( model ){
            if( merge && item !== model ){
                var attrs = item.attributes || item;
                if( parse ) attrs = model.parse( attrs, a_options );
                model.set( attrs, a_options );
            }
        }
        else{
            model = toModel( collection, item, a_options );
            if( model ){
                models.push( model );
                addReference( collection, model );
                addIndex( _byId, model );
                added.push( model );
            }
        }
    }

    return added;
}

function _move( source, at, added ){
    for( var j = source.length - 1, i = j - added.length; i >= at; i--, j-- ){
        source[ j ] = source[ i ];
    }

    for( i = 0, j = at; i < added.length; i++, j++ ){
        source[ j ] = added[ i ];
    }
}


exports.emptySet = function emptySet( collection, items, a_options, silent ){
    var options = new MergeOptions( a_options, collection );

    if( silent ){
        options.silent = silent;
    }

    var added = _reallocateEmpty( collection, items, options );

    collection._changed || ( collection._changed = added.length );

    var needSort = options.sort && added.length;
    if( needSort ) collection.sort( silence );

    options.silent || options.notify( collection, added, needSort );

    return added;
};

function _reallocateEmpty( self, source, options ){
    var len         = source ? source.length : 0,
        models      = Array( len ),
        _byId       = {},
        idAttribute = self.model.prototype.idAttribute;

    for( var i = 0, j = 0; i < len; i++ ){
        var src = source[ i ];

        if( src && ( _byId[ src[ idAttribute ] ] || _byId[ src.cid ] ) ){
            continue;
        }

        var model = toModel( self, src, options );
        if( model ){
            addReference( self, model );
            models[ j++ ] = model;
            addIndex( _byId, model );
        }
    }

    models.length = j;
    self._byId    = _byId;

    return self.models = models;
}

exports.set = function set( collection, items, a_options ){
    var options = new MergeOptions( a_options, collection );

    var _changed        = collection._changed;
    collection._changed = false;

    var previous = collection.models,
        added    = _reallocate( collection, items, options );

    var removed        = collection.models.length - added.length < previous.length,
        addedOrChanged = collection._changed || added.length,
        needSort       = options.sort && addedOrChanged;

    collection._changed = addedOrChanged || removed || _changed;

    if( needSort ){ collection.sort( silence ) }

    if( removed ){
        _garbageCollect( collection, previous, options );
    }

    // Unless silenced, it's time to fire all appropriate add/sort events.
    options.silent || options.notify( collection, added, needSort );

    // Return the added (or merged) model (or models).
    return collection.models;
};

// Remove references from models missing in collection's index
// Send 'remove' events if no silent
function _garbageCollect( collection, previous, options ){
    var _byId  = collection._byId,
        silent = options.silent;

    // Filter out removed models and remove them from the index...
    for( var i = 0; i < previous.length; i++ ){
        var model = previous[ i ];

        if( !_byId[ model.cid ] ){
            silent || trigger3( model, 'remove', model, collection, options );
            removeReference( collection, model );
        }
    }
}

// reallocate model and index
function _reallocate( self, source, options ){
    var models      = Array( source.length ),
        _byId       = {},
        merge       = options.merge == null ? true : options.merge,
        _prevById   = self._byId,
        idAttribute = self.model.prototype.idAttribute,
        toAdd       = [];

    // for each item in source set...
    for( var i = 0, j = 0; i < source.length; i++ ){
        var item  = source[ i ],
            model = null;

        if( item ){
            var id  = item[ idAttribute ],
                cid = item.cid;

            if( _byId[ id ] || _byId[ cid ] ) continue;

            model = _prevById[ id ] || _prevById[ cid ];
        }

        if( model ){
            if( merge && item !== model ){
                var attrs = item.attributes || item;
                if( options.parse ) attrs = model.parse( attrs, options );
                model.set( attrs, options );
            }
        }
        else{
            model = toModel( self, item, options );
            if( !model ) continue;

            addReference( self, model );
            toAdd.push( model );
        }

        models[ j++ ] = model;
        addIndex( _byId, model );
    }

    models.length = j;
    self.models   = models;
    self._byId    = _byId;

    return toAdd;
}