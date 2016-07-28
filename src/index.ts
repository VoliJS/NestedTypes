/**
 * Prepare backbone View, Router, History, and Events.  
 */
import { Events, Mixable, mixins, extendable, assign } from 'type-r/src/object-plus'
import { Model, Collection } from 'type-r/src'
import BackboneShim = require( './backbone.js' );
import { RestCollection, RestModel } from './rest'
import { Store } from 'type-r/src'

const Nested : any = {};
export default Nested;

assign( Nested, BackboneShim, Events, {
    Backbone  : BackboneShim,
    Class     : Mixable,
    attribute : attribute,
    options   : attribute,

    value : function( value ){
        return attribute( { value : value } );
    },

    parseReference : relations.parseReference,

    Collection : Collection,
    Model      : Model,
    RestModel  : RestModel,
    RestCollection : RestCollection,
    Store      : Store,
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

Nested.Events = Events;

Mixable.mixins( Events );
Mixable.mixTo( Nested.View, Nested.Router, Nested.History );

/**
 * Prepare  
 */

Nested.Class = Mixable;

// allow sync and jQuery override
Object.defineProperties( Nested, {
    'sync'         : linkProperty( Rest, 'sync' ),
    'errorPromise' : linkProperty( Rest, 'errorPromise' ),
    'ajax'         : linkProperty( Rest, 'ajax' ),
    'history'      : linkProperty( BackboneShim, 'history' ),
    'store'        : linkProperty( Store, 'global' ),
    '$' : {
        get : function(){ return BackboneShim.$; },
        set : function( value ){ BackboneShim.$ = Rest.$ = value; }
    }
} );

function linkProperty( Namespace, name ){
    return {
        get : function(){ return Namespace[ name ]; },
        set : function( value ){ Namespace[ name ] = value; }
    };
}
