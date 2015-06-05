// Backbone.nestedTypes 0.10.0 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin & Volicon, may be freely distributed under the MIT license

var Model       = require( './src/model' ),
    Collection  = require( './src/collection' ),
    relations   = require( './src/relations' ),
    attribute   = require( './src/attribute' );

require( './src/metatypes' );

Collection.subsetOf = relations.subsetOf;
Model.from          = relations.from;
Model.Collection    = Collection;

Object.defineProperty( exports, 'store', require( './src/store' ) );

Object.assign( exports, {
    Class : require( './src/object+' ),
    error : require( './src/errors' ),
    options : attribute,

    value : function( value ){
        return attribute({ value: value });
    },

    Collection : Collection,
    Model      : Model,

    defaults   : function( x ){
        return Model.defaults( x );
    }
});