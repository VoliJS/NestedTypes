// NestedTypes namespace
// =======================

var Model      = require( './model' ),
    Collection = require( './collection' ),
    relations  = require( './relations' ),
    Backbone   = require( './backbone+' ),
    _          = require( 'underscore' ),
    attribute  = require( './attribute' );

require( './metatypes' );

Collection.subsetOf = relations.subsetOf;
Model.from          = relations.from;
Model.take = Collection.take = relations.take;

Model.Collection    = Collection;

var Store = require( './store' );
Object.defineProperty( exports, 'store', Store.globalProp );

exports.store = new Store.Model();

_.extend( exports, Backbone, {
    Backbone  : Backbone,
    Class     : require( './object+' ),
    error     : require( './errors' ),
    attribute : attribute,
    options   : attribute,

    value : function( value ){
        return attribute( { value : value } );
    },

    parseReference : relations.parseReference,

    Collection : Collection,
    Model      : Model,
    Store      : Store.Model,
    LazyStore  : Store.Lazy,

    defaults : function( x ){
        return Model.defaults( x );
    },

    transaction : function( fun ){
        return function(){
            return this.transaction( fun, this, arguments );
        }
    }
});

function linkToProp( name ){
    return {
        get : function(){ return Backbone[ name ]; },
        set : function( value ){ Backbone[ name ] = value; }
    }
}

// allow sync and jQuery override
Object.defineProperties( exports, {
    'sync' : linkToProp( 'sync' ),
    '$'    : linkToProp( '$' ),
    'ajax' : linkToProp( 'ajax' )
});