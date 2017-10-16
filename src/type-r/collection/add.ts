import { Transaction, transactionApi } from '../transactions'
import { CollectionTransaction, logAggregationError, sortElements, convertAndAquire, free, CollectionOptions, addIndex, updateIndex, CollectionCore } from './commons'
import { Record } from '../record'

const { begin, commit, markAsDirty } = transactionApi;

export interface AddOptions extends CollectionOptions {
    at? : number 
}

/** @private */
export function addTransaction( collection : CollectionCore, items : any[], options : AddOptions, merge? : boolean ){
    const isRoot = begin( collection ),
          nested : Transaction[]= [];

    var added = appendElements( collection, items, nested, options, merge );

    if( added.length || nested.length ){
        let needSort = sortOrMoveElements( collection, added, options );
        if( markAsDirty( collection, options ) ){
            return new CollectionTransaction( collection, isRoot, added, [], nested, needSort );
        }

        if( collection._aggregationError ) logAggregationError( collection );
    }

    // No changes...
    isRoot && commit( collection );
};

// Handle sort or insert at options for add operation. Reurns true if sort happened.
/** @private */ 
function sortOrMoveElements( collection : CollectionCore, added : Record[], options : AddOptions ) : boolean {
    let at = options.at;

    // if `at` option is given, it overrides sorting option...
    if( at != null ){
        // Take an original collection's length. 
        const length = collection.models.length - added.length;

        // Crazy Backbone rules about `at` index. I don't know what that guys smoke.
        at = Number( at );
        if( at < 0 ) at += length + 1;
        if( at < 0 ) at = 0;
        if( at > length ) at = length;

        // Move added elements to desired position. In place.
        moveElements( collection.models, at, added );
        return false;
    }

    return sortElements( collection, options );
}

/** @private */
function moveElements( source : any[], at : number, added : any[] ) : void {
    for( var j = source.length - 1, i = j - added.length; i >= at; i--, j-- ){
        source[ j ] = source[ i ];
    }

    for( i = 0, j = at; i < added.length; i++, j++ ){
        source[ j ] = added[ i ];
    }
}

// append data to model and index
/** @private */
function appendElements( collection : CollectionCore, a_items : any[], nested : Transaction[], a_options : AddOptions, forceMerge : boolean ){
    var { _byId, models } = collection,
        merge       = ( forceMerge || a_options.merge ) && !collection._shared,
        parse       = a_options.parse,
        idAttribute = collection.model.prototype.idAttribute,
        prevLength = models.length;

    for( const item of a_items ){
        let model = item ? _byId[ item[ idAttribute ] ] || _byId[ item.cid ] : null;

        if( model ){
            if( merge && item !== model ){
                var attrs = item.attributes || item;
                const transaction = model._createTransaction( attrs, a_options );
                transaction && nested.push( transaction );

                if( model.hasChanged( idAttribute ) ){
                    updateIndex( _byId, model );
                }
            }
        }
        else{
            model = convertAndAquire( collection, item, a_options );
            models.push( model );
            addIndex( _byId, model );
        }
    }

    return models.slice( prevLength );
}
