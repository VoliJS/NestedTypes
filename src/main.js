// NestedTypes namespace
// =======================

var Model      = require( './model' ),
    Collection = require( './collection' ),
    relations  = require( './relations' ),
    Backbone   = require( './backbone+' ),
    attribute  = require( './attribute' );

require( './metatypes' );

Collection.subsetOf = relations.subsetOf;
Model.from          = relations.from;
Model.Collection    = Collection;

var Store = require( './store' );
Object.defineProperty( exports, 'store', Store.globalProp );

Object.assign( exports, {
    $         : Backbone.$,
    Class     : require( './object+' ),
    error     : require( './errors' ),
    attribute : attribute,
    options   : attribute,

    value : function( value ){
        return attribute( { value : value } );
    },

    Collection : Collection,
    Model      : Model,
    Store      : Store.Model,
    LazyStore  : Store.Lazy,

    // proxy backbone classes...
    View    : Backbone.View,
    Events  : Backbone.Events,
    Router  : Backbone.Router,
    History : Backbone.History,

    defaults : function( x ){
        return Model.defaults( x );
    },

    transaction : function( fun ){
        return function(){
            return this.transaction( fun, this, arguments );
        }
    }
} );
