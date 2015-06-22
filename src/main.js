// NestedTypes namespace
// =======================

var Model       = require( './model' ),
    Collection  = require( './collection' ),
    relations   = require( './relations' ),
    attribute   = require( './attribute' );

require( './metatypes' );

Collection.subsetOf = relations.subsetOf;
Model.from          = relations.from;
Model.Collection    = Collection;

Object.defineProperty( exports, 'store', require( './store' ) );

Object.assign( exports, {
    Class : require( './object+' ),
    error : require( './errors' ),
    attribute : attribute,
    options : attribute,

    value : function( value ){
        return attribute({ value: value });
    },

    Collection : Collection,
    Model      : Model,

    defaults   : function( x ){
        return Model.defaults( x );
    },

    transaction : function( fun ){
        return function(){
            return this.transaction( fun, this, arguments );
        }
    }
});