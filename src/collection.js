var Backbone = require( './backbone+' ),
    Model    = require( './model' ),
    error    = require( './errors' ),
    _        = require( 'underscore' );

var CollectionProto = Backbone.Collection.prototype;

function transaction( func ){
    return function(){
        this.__changing++ || ( this._changed = false );

        var res = func.apply( this, arguments );

        --this.__changing || ( this._changed && this.trigger( this.triggerWhenChanged, this ) );

        return res;
    };
}

function handleChange(){
    if( this.__changing ){
        this._changed = true;
    }
    else{
        this.trigger( this.triggerWhenChanged, this );
    }
}

module.exports = Backbone.Collection.extend( {
    triggerWhenChanged : 'changes',
    _listenToChanges : Backbone.VERSION >= '1.2.0' ? 'update change reset' : 'add remove change reset',
    __class            : 'Collection',

    model : Model,

    _owner : null,
    _store : null,

    __changing : 0,
    _changed : false,

    constructor : function(){
        this.__changing = 0;
        this._changed = false;

        Backbone.Collection.apply( this, arguments );

        this.listenTo( this, this._listenToChanges, handleChange );
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

    get : function( obj ){
        if( obj == null ){
            return void 0;
        }
        return typeof obj === 'object' ? this._byId[ obj.id ] || this._byId[ obj.cid ] : this._byId[ obj ];
    },

    deepClone : function(){ return this.clone( { deep : true } ); },

    clone : function( options ){
        var models = options && options.deep ?
                     this.map( function( model ){
                         return model.clone( options );
                     } ) : this.models;

        return new this.constructor( models );
    },

    set : transaction( function( models, options ){
        if( models ){
            if( typeof models !== 'object' || !( models instanceof Array || models instanceof Model ||
                Object.getPrototypeOf( models ) === Object.prototype ) ){
                error.wrongCollectionSetArg( this, models );
            }
        }

        return CollectionProto.set.call( this, models, options );
    } ),

    transaction : function( func, self, args ){
        return transaction( func ).apply( self || this, args );
    },

    remove : transaction( CollectionProto.remove ),
    add    : transaction( CollectionProto.add ),
    reset  : transaction( CollectionProto.reset ),
    sort   : transaction( CollectionProto.sort ),

    getModelIds : function(){ return _.pluck( this.models, 'id' ); },

    createSubset : function( models, options ){
        var SubsetOf = this.constructor.subsetOf( this ).createAttribute().type;
        return new SubsetOf( models, options );
    }
}, {
    // Cache for subsetOf collection subclass.
    __subsetOf : null,
    defaults   : function( attrs ){
        return this.prototype.model.extend( { defaults : attrs } ).Collection;
    },
    extend     : function(){
        // Need to subsetOf cache when extending the collection
        var This = Backbone.Collection.extend.apply( this, arguments );
        This.__subsetOf = null;
        return This;
    }
} );
