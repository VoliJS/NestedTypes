var _        = require( 'underscore' ),
    Backbone = require( './backbone+' ),
    Model    = require( './model' );

var Events   = Backbone.Events,
    trigger1 = Events.trigger1,
    trigger2 = Events.trigger2,
    trigger3 = Events.trigger3;

var Commons = require( './collections/commons' ),
    toModel = Commons.toModel,
    dispose = Commons.dispose,
    ModelEventsDispatcher = Commons.ModelEventsDispatcher;

var Add     = require( './collections/add' ),
    addOne  = Add.addOne,
    addMany = Add.addMany,
    AddOptions = Add.AddOptions;

var Remove     = require( './collections/remove' ),
    removeOne  = Remove.removeOne,
    removeMany = Remove.removeMany;

var Set          = require( './collections/set' ),
    setMany      = Set.setMany,
    emptySetMany = Set.emptySetMany;

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
            models  = options.parse ? this.parse( a_models, options ) : a_models;

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

function SilentOptions( a_options ){
    var options = a_options || {};
    this.parse  = options.parse;
    this.sort   = options.sort;
}

SilentOptions.prototype.silent = true;

function CreateOptions( options, collection ){
    AddOptions.call( this, options, collection );
    this.wait = options && options.wait;
}

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

    _dispatcher : null,
    properties  : {
        length : function(){
            return this.models.length;
        }
    },

    modelId : function( attrs ){
        return attrs[ this.model.prototype.idAttribute || 'id' ];
    },

    constructor : function( models, a_options ){
        var options = a_options || {};

        this.__changing   = 0;
        this._changed     = false;
        this._changeToken = {};
        this._owner       = this._store = null;

        this.model      = options.model || this.model;
        this.comparator = options.comparator || this.comparator;

        this.models = [];
        this._byId  = {};

        if( models ) this.reset( models, new SilentOptions( options ) );

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
               emptySetMany( this, models, options );
    } ),

    reset : method( function( a_models, a_options ){
        var options = a_options || {},
            previousModels = dispose( this );

        var models             = emptySetMany( this, a_models, new SilentOptions( options ) );

        options.silent || trigger2( this, 'reset', this, _.defaults( { previousModels : previousModels }, options ) );

        return models;
    } ),

    sort : transaction( CollectionProto.sort ),

// Methods with singular fast-path
//------------------------------------------------
    add : transaction( function( a_models, a_options ){
        var options = a_options || {};

        if( a_models ){
            return a_models instanceof Array ? (
                this.length ?
                addMany( this, a_models, options )
                    : emptySetMany( this, a_models, options )
            ) : addOne( this, a_models, options );
        }
    } ),

    // Remove a model, or a list of models from the set.
    remove : transaction( function( a_models, a_options ){
        var options = a_options || {};

        if( a_models ){
            return a_models instanceof Array ?
                   removeMany( this, a_models, options )
                : removeOne( this, a_models, options );
        }
    } ),

    create : function( a_model, a_options ){
        var options = new CreateOptions( a_options, this ),
            model   = a_model;

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
        // lazy initialize dispatcher...
        var dispatcher = this._dispatcher || ( this.constructor.prototype._dispatcher = new ModelEventsDispatcher( this.model ) ),
            handler    = dispatcher[ event ] || trigger3;

        handler( this, event, model, collection, options );
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