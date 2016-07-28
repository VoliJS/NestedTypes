/**
 * Prepare backbone View, Router, History, and Events.  
 */
import * as Nested from 'type-r/src'
export default Nested;
import * as Backbone from './backbone'
import { RestCollection, RestModel } from './rest'
import { Store } from 'type-r/src'
import * as Sync from './sync'
import { UnderscoreModel, UnderscoreCollection } from './underscore-mixin'
import RestStore from './rest-store'
 
Nested.Mixable.mixins( Nested.Events );
Nested.Mixable.mixTo( Backbone.View, Backbone.Router, Backbone.History );

const { assign } = Nested.tools;

assign( Nested, Backbone, {
    Backbone  : Backbone,
    Class     : Nested.Mixable,
    RestModel  : RestModel,
    RestCollection : RestCollection,
    LazyStore  : RestStore,

    defaults( x ){
        return Nested.Model.defaults( x );
    }
} );

/**
 * Prepare  
 */

// allow sync and jQuery override
Object.defineProperties( Nested, {
    'sync'         : linkProperty( Sync, 'sync' ),
    'errorPromise' : linkProperty( Sync, 'errorPromise' ),
    'ajax'         : linkProperty( Sync, 'ajax' ),
    'history'      : linkProperty( Backbone, 'history' ),
    'store'        : linkProperty( Store, 'global' ),
    '$' : {
        get(){ return Backbone.$; },
        set( value ){ Backbone.$ = Sync.$ = value; }
    }
} );

function linkProperty( Namespace, name ){
    return {
        get : function(){ return Namespace[ name ]; },
        set : function( value ){ Namespace[ name ] = value; }
    };
}
