var Commons         = require( './commons' ),
    addIndex        = Commons.addIndex,
    addReference    = Commons.addReference,
    notifyAdd       = Commons.notifyAdd,
    removeReference = Commons.removeReference,
    toModel         = Commons.toModel,
    silence         = Commons.silence;

var Events   = require( '../backbone+' ).Events,
    trigger3 = Events.trigger3,
    trigger2 = Events.trigger2;

function SetOptions( options ){
    this.silent = options.silent;
    this.parse  = options.parse;
    this.sort   = options.sort;

    this.merge = options.merge == null || options.merge;
}

SetOptions.prototype = {
    remove : true,
    add    : true
};

exports.emptySetMany = function emptySetMany( self, models, a_options, silent ){
    var options = new SetOptions( a_options );

    if( silent ){
        options.silent = silent;
    }

    var notify = !options.silent;

    _reallocateEmpty( self, models, options );

    var added = self.models;

    var sort = self.comparator && added.length && options.sort !== false;
    if( sort ) self.sort( silence );

    if( notify ){
        notifyAdd( self, added, options );
        sort && trigger2( self, 'sort', self, options );
        if( added.length ){
            trigger2( self, 'update', self, options );
        }
    }

    return added;
};

exports.setMany = function setMany( self, a_models, a_options ){
    var options = new SetOptions( a_options ),
        models  = a_models;

    var sort     = false,
        sortable = self.comparator && at == null && options.sort !== false,
        sortAttr = typeof self.comparator == 'string' ? self.comparator : null;

    var merge = options.merge ? function( source, existing ){
        if( source !== existing ){
            var attrs = source.attributes || source;
            if( options.parse ) attrs = existing.parse( attrs, options );
            existing.set( attrs, options );
            if( sortable && !sort ) sort = existing.hasChanged( sortAttr );
        }
    } : function(){};


    // Turn bare objects into model references, and prevent invalid models
    // from being added.
    var previous = self.models,
        toAdd    = [];

    _reallocate( self, models, function( source ){
        var model = toModel( self, source, options );
        if( model ){
            addReference( self, model );
            toAdd.push( model );
            return model;
        }
    }, merge );

    if( sort || ( sortable && toAdd.length ) ){
        self.sort( { silent : true } );
    }

    // remove references and fire 'remove' events if needed...
    var removed = self.models.length - toAdd.length < previous.length;
    if( removed ){
        _garbageCollect( self, previous, options );
    }

    // Unless silenced, it's time to fire all appropriate add/sort events.
    if( !options.silent ){
        notifyAdd( self, toAdd, options );
        if( sort ) trigger2( self, 'sort', self, options );
        if( toAdd.length || removed ) trigger2( self, 'update', self, options );
    }

    // Return the added (or merged) model (or models).
    return self.models;
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
function _reallocate( self, source, create, merge ){
    var models      = Array( source.length ),
        _byId       = {},
        _prevById   = self._byId,
        idAttribute = self.model.prototype.idAttribute;

    for( var i = 0, j = 0; i < source.length; i++ ){
        var src = source[ i ];

        if( src ){
            var id    = src[ idAttribute ],
                cid   = src.cid,
                model = _byId[ id ] || _byId[ cid ];

            if( model ){
                continue;
            }

            model = _prevById[ id ] || _prevById[ cid ];

            if( model ){
                merge( src, model );
            }
            else{
                model = create( src );
            }
        }
        else{
            model = create( src );
        }

        if( model ){
            models[ j++ ] = model;
            addIndex( _byId, model );
        }
    }

    models.length = j;
    self.models   = models;
    self._byId    = _byId;
}

function _reallocateEmpty( self, source, options ){
    var models      = Array( source.length ),
        _byId       = {},
        idAttribute = self.model.prototype.idAttribute;

    for( var i = 0, j = 0; i < source.length; i++ ){
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
    self.models   = models;
    self._byId    = _byId;
}