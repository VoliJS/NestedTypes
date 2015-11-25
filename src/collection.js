var _        = require( 'underscore' ),
    Backbone = require( './backbone+' ),
    Model    = require( './model' ),
    Events   = Backbone.Events,
    error    = require( './errors' ),
    trigger1 = Events.trigger1,
    trigger2 = Events.trigger2,
    trigger3 = Events.trigger3,
    core     = require( './collectionset' );

var fastCopy    = core.fastCopy,
    toModel     = core.toModel,
    addOne      = core.addOne,
    removeOne   = core.removeOne,
    removeMany  = core.removeMany,
    setMany     = core.setMany,
    replaceMany = core.replaceMany;

CollectionProto = Backbone.Collection.prototype;

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
// wrap call in transaction and convert singular args
function method( method ){
    return function( a_models, a_options ){
        this.__changing++ || ( this._changed = false );

        var options = a_options || {},
            models = options.parse ? this.parse( a_models, options ) : a_models;

        var res = models ? (
            models instanceof Array ?
                method.call( this, models, options )
                : method.call( this, [ models ], options )[ 0 ]
        ) : method.call( this, [], options );

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

    __changing   : 0,
    _changed     : false,
    _changeToken : {},

    properties : {
        length : function(){
            return this.models.length;
        }
    },

    modelId: function( attrs ) {
        return attrs[this.model.prototype.idAttribute || 'id'];
    },

    constructor : function( models, a_options ){
        var options = a_options || {};

        this.__changing   = 0;
        this._changed     = false;
        this._changeToken = {};
        this._owner = this._store = null;

        this.model      = options.model || this.model;
        this.comparator = options.comparator || this.comparator;

        this.models = [];
        this._byId  = {};

        if( models ) this.reset( models, fastCopy( { silent : true }, options ) );

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
               setMany( this, models, options ) :
               replaceMany( this, models, options );
    } ),

    reset : method( function( a_models, a_options ){
        var options  = a_options || {},
            models   = a_models,
            previous = this.models;

        options.previousModels = previous;

        models = replaceMany( this, models, fastCopy( { silent : true }, options ) );

        options.silent || trigger2( this, 'reset', this, options );

        return models;
    } ),

    sort : transaction( CollectionProto.sort ),

// Methods with singular fast-path
//------------------------------------------------
    add : transaction( function( a_models, a_options ){
        if( a_models ){
            if( a_models instanceof Array ){
                return this.length ?
                       setMany( this, a_models, fastCopy( {
                           merge  : false,
                           add    : true,
                           remove : false
                       }, a_options ) )
                    : replaceMany( this, a_models, a_options || {} );
            }

            return addOne( this, a_models, a_options || {} );
        }
    } ),

    // Remove a model, or a list of models from the set.
    remove : transaction( function( a_models, a_options ){
        if( a_models ){
            if( a_models instanceof Array ){
                return removeMany( this, a_models, a_options || {} );
            }

            return removeOne( this, a_models, a_options || {} );
        }
    } ),

    create : function( a_model, a_options ){
        var options = {}, model = a_model;
        fastCopy( options, a_options );

        if( !(model = toModel( this, model, options )) ) return false;
        if( !options.wait ) addOne( this, model, options );
        var collection  = this;
        var success     = options.success;
        options.success = function( model, resp ){
            if( options.wait ) addOne( collection, model, options );
            if( success ) success( model, resp, options );
        };

        model.save( null, options );
        return model;
    },

    _onModelEvent : function( event, model, collection, options ){
        // TODO: create event map to optimize events dispatching
        // Make it a class. Member will be 'change:idAttr'
        if( event === 'change:' + model.idAttribute ){
            updateIndex( model, this._byId );
            trigger3( this, event, model, collection, options );
            return;
        }

        switch( event ){
            case 'change' : //TODO: does it need to be sorted when fields have changed?
            case 'sync' :
                trigger2( this, event, model, collection );
                break;

            case 'add' :
            case 'remove' :
                if( collection === this ) trigger3( this, event, model, collection, options );
                break;

            case 'destroy' :
                this.remove( model, options );
            default :
                trigger3( this, event, model, collection, options );
        }

    },

    deepClone : function(){ return this.clone( { deep : true } ); },

    clone : function( options ){
        var models = options && options.deep ?
                     this.map( function( model ){
                         return model.clone( options );
                     } ) : this.models;

        return new this.constructor( models, { model : this.model, comparator : this.comparator } );
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

function updateIndex( model, _byId ){
    delete _byId[ model._previousAttributes[ idAttribute ] ];
    var id = model.id;
    id == null || ( _byId[ id ] = model );
}