var Backbone = require( './backbone+' ),
    Model    = require( './model' ),
    Events   = Backbone.Events,
    error    = require( './errors' ),
    trigger1 = Events.trigger1,
    trigger2 = Events.trigger2,
    trigger3 = Events.trigger3;
_            = require( 'underscore' );

var CollectionProto = Backbone.Collection.prototype;

function transaction( func ){
    return function(){
        this.__changing++ || ( this._changed = false );

        var res = func.apply( this, arguments );

        --this.__changing || ( this._changed && trigger1( this, this.triggerWhenChanged, this ) );

        return res;
    };
}

function handleChange(){
    if( this.__changing ){
        this._changed = true;
    }
    else{
        trigger1( this, this.triggerWhenChanged, this );
    }
}

var attrChangeRegexp = /^change:(\w+)$/;

module.exports = Backbone.Collection.extend( {
    triggerWhenChanged : 'changes',
    _listenToChanges   : Backbone.VERSION >= '1.2.0' ? 'update change reset' : 'add remove change reset',
    __class            : 'Collection',

    model : Model,

    _owner : null,
    _store : null,

    __changing : 0,
    _changed   : false,

    // ATTENTION: Overriden backbone logic with bug fixes
    constructor : function( models, a_options ){
        var options = a_options || {};
        if( options.model ) this.model = options.model;
        if( options.comparator !== void 0 ) this.comparator = options.comparator;
        this._reset();

        this.__changing = 0;
        this._changed   = false;
        if( models ) this.reset( models, options );
        this.listenTo( this, this._listenToChanges, handleChange );
        this.initialize.apply( this, arguments );
    },

    getStore : function(){
        return this._store || ( this._store = this._owner ? this._owner.getStore() : this._defaultStore );
    },

    sync : function(){
        return this.getStore().sync.apply( this, arguments );
    },

    isValid : function( options ){
        return this.every( function( model ){
            return model.isValid( options );
        } );
    },

    // Toggle model in collection
    toggle : function( model, a_next ){
        var prev = Boolean( this.get( model ) ),
            next = a_next === void 0 ? !prev : Boolean( a_next );

        if( prev !== next ){
            if( prev ){
                this.remove( model );
            }
            else{
                this.add( model );
            }
        }

        return next;
    },

    // ATTENTION: Overriden backbone logic with bug fixes
    get : function( obj ){
        if( obj == null ){ return void 0; }

        if( typeof obj === 'object' ){
            return this._byId[ obj[ this.model.prototype.idAttribute ] ] || this._byId[ obj.cid ];
        }

        return this._byId[ obj ];
    },

    set : transaction( function( models, options ){
        if( models ){
            if( typeof models !== 'object' || !( models instanceof Array || models instanceof Model ||
                Object.getPrototypeOf( models ) === Object.prototype ) ){
                error.wrongCollectionSetArg( this, models );
            }
        }

        return this.length ? collectionSet( this, models, options ) : emptyCollectionSet( this, models, options );
    } ),

    create : function( a_model, a_options ){
        var options = {}, model = a_model;
        fastCopy( options, a_options );

        if( !(model = _prepareModel( this, model, options )) ) return false;
        if( !options.wait ) this.add( model, options );
        var collection  = this;
        var success     = options.success;
        options.success = function( model, resp ){
            if( options.wait ) collection.add( model, options );
            if( success ) success( model, resp, options );
        };

        model.save( null, options );
        return model;
    },

    _onModelEvent : function( event, model, collection, options ){
        var attrChange = event.match( attrChangeRegexp );
        if( attrChange ){
            if( model && attrChange[ 1 ] === model.idAttribute ){
                delete this._byId[ model.previous( model.idAttribute ) ];
                if( model.id != null ) this._byId[ model.id ] = model;
            }

            trigger3( this, event, model, collection, options );
            return;
        }

        switch( event ){
            case 'add' :
            case 'remove' :
                if( collection === this ) trigger3( this, event, model, collection, options );
                break;
            case 'change' :
            case 'sync' :
            case 'invalid' :
                trigger2( this, event, model, collection );
                break;
            case 'destroy' :
                this.remove( model, options );
                trigger3( this, event, model, collection, options );
                break;

            default:
                this.trigger.apply( this, arguments );
        }

    },

    deepClone : function(){ return this.clone( { deep : true } ); },

    clone : function( options ){
        var models = options && options.deep ?
                     this.map( function( model ){
                         return model.clone( options );
                     } ) : this.models;

        return new this.constructor( models );
    },

    transaction : function( func, self, args ){
        return transaction( func ).apply( self || this, args );
    },

    remove : transaction( CollectionProto.remove ),

    add : function( models, a_options ){
        var options = { merge : false, add : true, remove : false };
        fastCopy( options, a_options );
        return this.set( models, options );
    },

    reset : transaction( function( a_models, a_options ){
        var options = a_options || {},
            models = a_models,
            previous = this.models;

        for( var i = 0, l = previous.length; i < l; i++ ){
            this._removeReference( previous[ i ], options );
        }

        options.previousModels = previous;

        this._reset();

        var newOptions = { silent : true };
        fastCopy( newOptions, a_options );
        models = this.set( models, newOptions );

        options.silent || trigger2( this, 'reset', this, options );

        return models;
    } ),

    sort  : transaction( CollectionProto.sort ),

    getModelIds : function(){ return _.pluck( this.models, 'id' ); },

    createSubset : function( models, options ){
        var SubsetOf = this.constructor.subsetOf( this ).createAttribute().type;
        var subset   = new SubsetOf( models, options );
        subset.resolve( this );
        return subset;
    }
}, {
    // Cache for subsetOf collection subclass.
    __subsetOf : null,
    defaults   : function( attrs ){
        return this.prototype.model.extend( { defaults : attrs } ).Collection;
    },
    extend     : function(){
        // Need to subsetOf cache when extending the collection
        var This        = Backbone.Collection.extend.apply( this, arguments );
        This.__subsetOf = null;
        return This;
    }
} );

function fastCopy( dest, source ){
    if( source ){
        for( var i in source ){
            dest[ i ] = source[ i ];
        }
    }
}

// todo: Special case optimizations:
// regular set as comes from fetch:
// - [] -> [ a, b, ... ]
//      When the set is initially empty, attrs, not models.
// - [ a, b, ... ] -> [ a, b, ... ]
//      Populated collection with a few changes, attrs, not models.

function collectionSet( self, a_models, a_options ){
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
            model = models[ i ] = _prepareModel( self, attrs, options );
            if( !model ) continue;
            toAdd.push( model );
            self._addReference( model, options );
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
        if( toRemove.length ) self.remove( toRemove, options );
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
    }

// Return the added (or merged) model (or models).
    return singular ? models[ 0 ] : models;
}

function emptyCollectionSet( self, a_models, a_options ){
    var options = {}, models  = a_models;
    fastCopy( options, a_options );

    if( options.parse ) models = self.parse( models, options );
    var singular    = !( models && models instanceof Array );
    models          = singular ? (models ? [ models ] : []) : models;
    var sort;
    var sortable    = self.comparator && options.sort !== false;
    var order       = !sortable ? [] : false;

// Turn bare objects into model references, and prevent invalid models
// from being added.
    models = prepareAndRef( self, models, options );

// See if sorting is needed, update `length` and splice in new models.
    if( models.length || order ){
        if( sortable ) sort = true;
        self.length = models.length;
        self.models = models;
    }

// Silently sort the collection if appropriate.
    if( sort ) self.sort( { silent : true } );

// Unless silenced, it's time to fire all appropriate add/sort events.
    if( !options.silent ){
        notifyAdd( self, models, options );
        if( sort || order ) trigger2( self, 'sort', self, options );
    }

// Return the added (or merged) model (or models).
    return singular ? models[ 0 ] : models;
}

function prepareAndRef( self, models, options ){
    var copy = [];

    for( var i = 0; i < models.length; i++ ){
        var model = _prepareModel( self, models[ i ] || {}, options );

        if( model ){
            copy.push( model );
            self._addReference( model, options );
        }
    }

    return copy;
}

function notifyAdd( self, models, options ){
    for( var model, i = 0, l = models.length; i < l; i++ ){
        trigger3( model = models[ i ], 'add', model, self, options );
    }
}

function _prepareModel( collection, attrs, a_options ){
    if( attrs instanceof Model ) return attrs;

    var options = {};
    fastCopy( options, a_options );
    options.collection = collection;

    var model = new collection.model( attrs, options );

    if( !model.validationError ) return model;

    trigger3( collection, 'invalid', collection, model.validationError, options );

    return false;
}