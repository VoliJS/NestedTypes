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

var Commons      = require( './commons' ),
    addIndex     = Commons.addIndex,
    addReference = Commons.addReference,
    notifyAdd    = Commons.notifyAdd,
    sortedIndex  = Commons.sortedIndex,
    toModel      = Commons.toModel,
    silence      = Commons.silence;

exports.AddOptions = AddOptions = function( a_options, collection ){
    var options = a_options || {};

    this.silent = options.silent;
    this.parse  = options.parse;
    this.merge  = options.merge;

    // at option
    var at = options.at;
    if( at != null ){
        this.sort = false;

        // if at is given, it overrides sorting option...
        at = +at;
        if( at < 0 ) at += collection.length + 1;
        if( at < 0 ) at = 0;
        if( at > collection.length ) at = collection.length;
    }
    else{
        this.sort = collection.comparator && options.sort !== false;
    }

    this.at = at;
    this.index = null;
};

AddOptions.prototype = {
    add    : true,
    remove : false
};

// fast-path for singular add and remove...
exports.addOne = function addOne( collection, el, a_options ){
    return addMany( collection, [ el ], a_options )[ 0 ];

    /* var options = new AddOptions( a_options, collection );

    var model = collection.get( el );
    if( model ){
        return model;
    }

    model = toModel( collection, el, options );

    if( model ){
        var models = collection.models,
            at     = options.at;

        if( at == null ){
            // if collection is sorted, use binary search to find position
            if( collection.comparator && options.sort !== false ){
                at = sortedIndex( models, model, collection.comparator, collection );
            }
        }

        if( at ){
            models.splice( at, 0, model );
        }
        else{
            models.push( model );
        }

        addIndex( collection._byId, model );
        addReference( collection, model );

        if( !options.silent ){
            trigger3( model, 'add', model, collection, options );
            trigger2( collection, 'update', collection, options );
        }

        return model;
    } */
};

/**
 * update index and models array.
 */
exports.addMany = addMany = function addMany( collection, a_items, a_options ){
    var options = new AddOptions( a_options, collection ),
        items = options.parse ? collection.parse( a_items ) : a_items;

    var _changed = collection._changed;
    collection._changed = false;

    var added = _append( collection, items, options ),
        changed = collection._changed || added.length,
        needSort = options.sort && changed;

    collection._changed = changed || _changed;

    if( options.at != null ){
        _move( collection.models, options.at, added );
    }
    else if( needSort ){
        collection.sort( silence );
    }

    if( !options.silent ){
        notifyAdd( collection, added, options );
        needSort && trigger2( collection, 'sort', collection, options );
        if( added.length ){
            trigger2( collection, 'update', collection, options );
        }
    }

    return added;
};

// append data to model and index
function _append( collection, a_items, a_options ){
    var models = collection.models,
        _byId  = collection._byId,
        merge = a_options.merge,
        parse = a_options.parse,
        idAttribute = collection.model.prototype.idAttribute,
        added = [];

    for( var i = 0; i < a_items.length; i++ ){
        var item = a_items[ i ],
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