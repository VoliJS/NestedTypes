/**
 * Extend Type-R namespace
 */
import * as TypeR from 'type-r';
import { MixinsState, Store as BaseStore, tools } from 'type-r';
/**
 * Prepare backbone View, Router, History, and Events.
 */
import Backbone from './backbone';
import { RestCollection, RestModel } from './rest';
import { LazyStore, RestStore } from './rest-store';
import Sync from './sync';
import { CollectionMixin, ModelMixin } from './underscore-mixin';
export * from 'type-r';
export * from './backbone';
export { Backbone, RestStore, LazyStore, RestCollection as Collection, RestModel as Model };

/**
 * Prepare  
 */

export const Class : typeof TypeR.Messenger = TypeR.Messenger;

const Nested : typeof TypeR & typeof Backbone = Object.create( TypeR, tools.defaults({
        'sync'         : linkProperty( Sync, 'sync' ),
        'errorPromise' : linkProperty( Sync, 'errorPromise' ),
        'ajax'         : linkProperty( Sync, 'ajax' ),
        'history'      : linkProperty( Backbone, 'history' ),
        'store'        : linkProperty( BaseStore, 'global' ),
        '$' : {
            get(){ return Backbone.$; },
            set( value ){ (<any>Backbone).$ = (<any>Sync).$ = value; }
        }
    },
    toProps( { Backbone, Class, Model : RestModel, Collection : RestCollection, LazyStore, Store : RestStore, defaults } ),
    toProps( Backbone )
));

export default Nested;


export function defaults( x ) : typeof Nested.Record {
    return Nested.Model.defaults( x );
}


MixinsState.get( Nested.Mixable ).merge([ Nested.Events ]);
Nested.Messenger.mixins.populate( Backbone.View, Backbone.Router, Backbone.History );
Nested.Record.mixins.merge([ ModelMixin ]);
Nested.Record.Collection.mixins.merge([ CollectionMixin ]);

/**
 * Local utilities
 */
function linkProperty( Namespace, name ){
    return {
        get(){ return Namespace[ name ]; },
        set( value ){ Namespace[ name ] = value; }
    };
}

function toProps( obj ){
    return tools.transform({}, obj, x => ({ value : x }) );
} 