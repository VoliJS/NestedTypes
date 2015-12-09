// NestedTypes namespace
// =======================

var Model      = require( './model' ),
    Collection = require( './collection' ),
    relations  = require( './relations' ),
    Backbone   = require( './backbone+' ),
    _          = require( 'underscore' ),
    attribute  = require( './attribute' ),
    Rest       = require( './rest-mixin' );

Rest.$ = Backbone.$;

require( './metatypes' );

Collection.subsetOf = relations.subsetOf;
Model.from          = relations.from;
Model.take          = Collection.take = relations.take;

Model.Collection = Collection;

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
} );

// allow sync and jQuery override
Object.defineProperties( exports, {
    'sync' : {
        get : function(){ return Rest.sync; },
        set : function( value ){ Rest.sync = value; }
    },
    'ajax' : {
        get : function(){ return Rest.ajax; },
        set : function( value ){ Rest.ajax = value; }
    },
    'history' : {
        get : function(){ return Backbone.history; },
        set : function( value ){ Backbone.history = value; }
    },

    '$'    : {
        get : function(){ return Backbone.$; },
        set : function( value ){ Backbone.$ = Rest.$ = value; }
    }
} );