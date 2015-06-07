// Backbone.nestedTypes 0.10.0 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin & Volicon, may be freely distributed under the MIT license

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

    value : function( value ){
        return attribute({ value: value });
    },

    Collection : Collection,
    Model      : Model,

    defaults   : function( x ){
        return Model.defaults( x );
    }
});