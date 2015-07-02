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

Object.defineProperty( exports, 'store', require( './store' ) );

Object.assign( exports, {
    Class     : require( './object+' ),
    error     : require( './errors' ),
    attribute : attribute,
    options   : attribute,

    value : function( value ){
        return attribute( { value : value } );
    },

    Collection : Collection,
    Model      : Model,

    // proxy backbone classes...
    View    : Backbone.View,
    Events  : Backbone.Events,
    Router  : Backbone.Router,
    History : Backbone.History,

    defaults : function( x ){
        return Model.defaults( x );
    }
} );