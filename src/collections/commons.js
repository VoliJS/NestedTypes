/**
 * Helper functions
 */

var Events   = require( '../backbone+' ).Events,
    trigger3 = Events.trigger3,
    trigger2 = Events.trigger2,
    onAll    = Events.onAll,
    offAll    = Events.offAll;

var _ = require( 'underscore' );

var silence = { silent : true };

module.exports = {
    SilentOptions : SilentOptions,
    silence       : silence,

    addReference    : addReference,
    removeReference : removeReference,

    addIndex    : addIndex,
    removeIndex : removeIndex,

    dispose : dispose,

    toModel : toModel,

    ModelEventsDispatcher : ModelEventsDispatcher
};

function SilentOptions( a_options ){
    var options = a_options || {};
    this.parse  = options.parse;
    this.sort   = options.sort;
}

SilentOptions.prototype = silence;


// Ownership and events subscription
function addReference( collection, model ){
    model.collection || ( model.collection = collection );
    onAll( model, collection._onModelEvent, collection );
    return model;
}

function removeReference( collection, model ){
    if( collection === model.collection ){
        model.collection = void 0;
    }

    offAll( model, collection._onModelEvent, collection );
}

function dispose( collection ){
    var models = collection.models;

    collection.models = [];
    collection._byId  = {};

    for( var i = 0; i < models.length; i++ ){
        removeReference( collection, models[ i ] );
    }

    return models;
}

// Index management
function addIndex( _byId, model ){
    _byId[ model.cid ] = model;
    var id             = model.id;
    if( id != null ){
        _byId[ id ] = model;
    }
}

function removeIndex( _byId, model ){
    delete _byId[ model.cid ];
    var id = model.id;
    if( id != null ){
        delete _byId[ id ];
    }
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

    var options = new ModelOptions( a_options, collection );

    // Use abstract class factory if defined.
    return Model.create ? Model.create( attrs, options ) : new Model( attrs, options );
}

function ModelEventsDispatcher( model ){
    this[ 'change:' + model.prototype.idAttribute ] = _updateIdAttr;
}

ModelEventsDispatcher.prototype = {
    change  : trigger2,
    sync    : trigger2,
    add     : _triggerWhenRelevant,
    remove  : _triggerWhenRelevant,
    destroy : function( self, event, model, collection, options ){
        self.remove( model, options );
        trigger3( self, event, model, collection, options );
    }
};

function _triggerWhenRelevant( self, event, model, collection, options ){
    if( collection === self ){
        trigger3( self, event, model, collection, options );
    }
}

function _updateIdAttr( self, event, model, collection, options ){
    var _byId = self._byId;

    _byId[ model._previousAttributes[ model.idAttribute ] ] = void 0;
    var id                                            = model.id;
    id == null || ( _byId[ id ] = model );

    trigger3( self, event, model, collection, options );
}