var Backbone = require( './backbone+' ),
    Model    = require( './model' ),
    Events   = Backbone.Events,
    error    = require( './errors' ),
    trigger1 = Events.trigger1,
    trigger2 = Events.trigger2,
    onAll    = Events.onAll,
    trigger3 = Events.trigger3;
_            = require( 'underscore' );

var CollectionProto = Backbone.Collection.prototype;

// transactional wrapper for collections
function transaction( func ){
    return function(){
        this.__changing++ || ( this._changed = false );

        var res = func.apply( this, arguments );

        if( !--this.__changing && this._changed ){
            this._changeToken = {};
            trigger1( this, 'changes', this );
        }

        return res;
    };
}

// wrapper for standard collections modification methods
// with type checks and casts
function method( method ){
    return function( a_models, options ){
        var res;

        this.__changing++ || ( this._changed = false );

        if( a_models ){
            if( a_models instanceof Array ){
                res = method( a_models, options );
            }
            else if( a_models instanceof collection.model || Object.getPrototypeOf( a_models ) === ObjectProto ){
                res = method( [ a_models ], options )[ 0 ];
            }
            else{
                error.wrongCollectionSetArg( collection, a_models );
            }
        }
        else{
            method( [], options );
        }

        if( !--this.__changing && this._changed ){
            this._changeToken = {};
            trigger1( this, 'changes', this );
        }

        return res;
    }
}

function handleChange(){
    if( this.__changing ){
        this._changed = true;
    }
    else{
        this._changeToken = {};
        trigger1( this, 'changes', this );
    }
}

var attrChangeRegexp = /^change:(\w+)$/;

module.exports = Backbone.Collection.extend( {
    triggerWhenChanged : 'changes',
    _listenToChanges   : 'update change reset',
    __class            : 'Collection',

    model : Model,

    _owner : null,
    _store : null,

    __changing : 0,
    _changed   : false,
    _changeToken : {},

    // ATTENTION: Overriden backbone logic with bug fixes
    constructor : function( models, a_options ){
        var options = a_options || {};
        if( options.model ) this.model = options.model;
        if( options.comparator !== void 0 ) this.comparator = options.comparator;
        this._reset();

        this.__changing = 0;
        this._changed   = false;
        this._changeToken = {};

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

    get : function( obj ){
        if( obj == null ){ return void 0; }

        if( typeof obj === 'object' ){
            return this._byId[ obj[ this.model.prototype.idAttribute ] ] || this._byId[ obj.cid ];
        }

        return this._byId[ obj ];
    },

    set : method( function( models, options ){
        return this.length ?
               collectionSet( this, models, options ) :
               emptyCollectionSet( this, models, options );
    } ),

    add : method( function( models, a_options ){
        var options = fastCopy({
            merge : false,
            add : true,
            remove : false
        }, a_options );

        return this.length ?
               collectionSet( this, models, options )
            : emptyCollectionSet( this, models, options );
    }),

    reset : method( function( a_models, a_options ){
        var options = a_options || {},
            models = a_models,
            previous = this.models;

        for( var i = 0, l = previous.length; i < l; i++ ){
            this._removeReference( previous[ i ], options );
        }

        options.previousModels = previous;

        this._reset();

        models = emptyCollectionSet( this, models, fastCopy( { silent : true }, options ) );

        options.silent || trigger2( this, 'reset', this, options );

        return models;
    } ),

    sort  : transaction( CollectionProto.sort ),
    // Remove a model, or a list of models from the set.
    remove: method( function(a_models, a_options) {
        var models = a_models.splice(),
            options = a_options || {};

        var removed = _removeModels( this, models, options );

        if (!options.silent && removed ) trigger2( this, 'update', this, options );
        return models;
    }),

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