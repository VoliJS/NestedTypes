import { define, tools, eventsApi, EventMap, definitions, mixinRules, EventsDefinition, Mixable } from '../object-plus'
import { ItemsBehavior, transactionApi, Transactional, CloneOptions, Transaction, TransactionOptions, TransactionalDefinition, Owner } from '../transactions'
import { Record, SharedType, AggregatedType, createSharedTypeSpec } from '../record'

import { IdIndex, free, sortElements, dispose, Elements, CollectionCore, addIndex, removeIndex, updateIndex, Comparator, CollectionTransaction } from './commons'
import { addTransaction, AddOptions } from './add'
import { setTransaction, emptySetTransaction } from './set'
import { removeOne, removeMany } from './remove'
import { IOPromise, startIO } from '../io-tools'

const { trigger2, on, off } = eventsApi,
    { begin, commit, markAsDirty } = transactionApi,
    { omit, log, assign, defaults, assignToClassProto } = tools;

let _count = 0;

export type GenericComparator = string | ( ( x : Record ) => number ) | ( ( a : Record, b : Record ) => number ); 

export interface CollectionOptions extends TransactionOptions {
    comparator? : GenericComparator
    model? : typeof Record
}

export type Predicate<R> = ( val : R, key : number ) => boolean | object;

export interface CollectionDefinition extends TransactionalDefinition {
    model? : typeof Record,
    itemEvents? : EventsDefinition
    _itemEvents? : EventMap
}

const slice = Array.prototype.slice;

class CollectionRefsType extends SharedType {
    static defaultValue = [];
}

@define({
    // Default client id prefix 
    cidPrefix : 'c',
    model : Record,
    _changeEventName : 'changes',
    _aggregationError : null
})
@definitions({
    comparator : mixinRules.value,
    model : mixinRules.protoValue,
    itemEvents : mixinRules.merge
})
export class Collection< R extends Record = Record> extends Transactional implements CollectionCore {
    _shared : number
    _aggregationError : R[]

    static Subset : typeof Collection
    static Refs : typeof Collection
    static _SubsetOf : typeof Collection
    
    createSubset( models : ElementsArg, options ){
        const SubsetOf = (<any>this.constructor).subsetOf( this ).options.type,
            subset   = new SubsetOf( models, options );
            
        subset.resolve( this );
        return subset;
    }

    static onExtend( BaseClass : typeof Transactional ){
        // Cached subset collection must not be inherited.
        const Ctor = this;
        this._SubsetOf = null;

        function RefsCollection( a, b, listen? ){
            Ctor.call( this, a, b, ItemsBehavior.share | ( listen ? ItemsBehavior.listen : 0 ) );
        }

        Mixable.mixins.populate( RefsCollection );
        
        RefsCollection.prototype = this.prototype;
        RefsCollection._attribute = CollectionRefsType;

        this.Refs = this.Subset = <any>RefsCollection;

        Transactional.onExtend.call( this, BaseClass );
        createSharedTypeSpec( this, SharedType );
    }
    
    static onDefine( definition : CollectionDefinition, BaseClass : any ){
        if( definition.itemEvents ){
            const eventsMap = new EventMap( BaseClass.prototype._itemEvents );
            eventsMap.addEventsMap( definition.itemEvents );
            this.prototype._itemEvents = eventsMap;
        }

        if( definition.comparator !== void 0 ) this.prototype.comparator = definition.comparator;

        Transactional.onDefine.call( this, definition );
    }

    static subsetOf : ( collectionReference : any ) => any;
    
    _itemEvents : EventMap

    /***********************************
     * Core Members
     */
    // Array of the records
    models : R[]

    // Polymorphic accessor for aggregated attribute's canBeUpdated().
    get __inner_state__(){ return this.models; }

    // Index by id and cid
    _byId : { [ id : string ] : R }

    set comparator( x : GenericComparator ){
        let compare;

        switch( typeof x ){
            case 'string' :
                this._comparator = ( a, b ) => {
                    const aa = a[ <string>x ], bb = b[ <string>x ];
                    if( aa === bb ) return 0;
                    return aa < bb ? -1 : + 1;
                } 
                break;
            case 'function' :
                if( x.length === 1 ){
                    this._comparator = ( a, b ) => {
                        const aa = (<any>x).call( this, a ), bb = (<any>x).call( this, b );
                        if( aa === bb ) return 0;
                        return aa < bb ? -1 : + 1;
                    }
                }
                else{
                    this._comparator = ( a, b ) => (<any>x).call( this, a, b );
                }
                break;
                
            default :
                this._comparator = null;
        }
    }
    
    // TODO: Improve typing
    getStore() : Transactional {
        return this._store || ( this._store = this._owner ? this._owner.getStore() : this._defaultStore );
    }

    _store : Transactional

    get comparator(){ return this._comparator; }
    _comparator : ( a : R, b : R ) => number

    _onChildrenChange( record : R, options : TransactionOptions = {}, initiator? : Transactional ){
        // Ignore updates from nested transactions.
        if( initiator === this ) return;

        const { idAttribute } = this;

        if( record.hasChanged( idAttribute ) ){
            updateIndex( this._byId, record );
        }

        const isRoot = begin( this );

        if( markAsDirty( this, options ) ){
            // Forward change event from the record.
            trigger2( this, 'change', record, options )
        }

        isRoot && commit( this );
    }

    get( objOrId : string | R | Object ) : R {
        if( objOrId == null ) return;

        if( typeof objOrId === 'object' ){
            const id = objOrId[ this.idAttribute ];
            return ( id !== void 0 && this._byId[ id ] ) || this._byId[ (<R>objOrId).cid ];
        }
        else{
            return this._byId[ objOrId ];
        }        
    }

    each( iteratee : ( val : R, key : number ) => void, context? : any ){
        const fun = bindContext( iteratee, context ),
            { models } = this;

        for( let i = 0; i < models.length; i++ ){
            fun( models[ i ], i ); 
        }
    }

    forEach( iteratee : ( val : R, key? : number ) => void, context? : any ){
        return this.each( iteratee, context );
    }

    every( iteratee : Predicate<R>, context? : any ) : boolean {
        const fun = toPredicateFunction( iteratee, context ),
            { models } = this;

        for( let i = 0; i < models.length; i++ ){
            if( !fun( models[ i ], i ) ) return false;
        }

        return true;
    }

    filter( iteratee : Predicate<R>, context? : any ) : R[] {
        const fun = toPredicateFunction( iteratee, context ),
            { models } = this;

        return this.map( ( x, i ) => fun( x, i ) ? x : void 0 );
    }

    find( iteratee : Predicate<R>, context? : any ) : R {
        const fun = toPredicateFunction( iteratee, context ),
        { models } = this;

        for( let i = 0; i < models.length; i++ ){
            if( fun( models[ i ], i ) ) return models[ i ];
        }

        return null;
    }

    some( iteratee : Predicate<R>, context? : any ) : boolean {
        return Boolean( this.find( iteratee, context ) );
    }

    map< T >( iteratee : ( val : R, key : number ) => T, context? : any ) : T[]{
        const fun = bindContext( iteratee, context ),
            { models } = this,
            mapped = Array( models.length );

        let j = 0;

        for( let i = 0; i < models.length; i++ ){
            const x = fun( models[ i ], i );
            x === void 0 || ( mapped[ j++ ] = x ); 
        }

        mapped.length = j;

        return mapped;
    }

    _validateNested( errors : {} ) : number {
        // Don't validate if not aggregated.
        if( this._shared ) return 0;

        let count = 0;

        this.each( record => {
            const error = record.validationError;
            if( error ){
                errors[ record.cid ] = error;
                count++;
            }
        });

        return count;
    }

    model : typeof Record

    // idAttribute extracted from the model type.
    idAttribute : string

    constructor( records? : ( R | {} )[], options : CollectionOptions = {}, shared? : number ){
        super( _count++ );
        this.models = [];
        this._byId = {};
        
        this.comparator  = this.comparator;

        if( options.comparator !== void 0 ){
            this.comparator = options.comparator;
            options.comparator = void 0;
        }
        
        this.model       = this.model;
        
        if( options.model ){
            this.model = options.model;
            options.model = void 0;
        }

        this.idAttribute = this.model.prototype.idAttribute; //TODO: Remove?

        this._shared = shared || 0;

        if( records ){
            const elements = toElements( this, records, options );
            emptySetTransaction( this, elements, options, true );
        }

        this.initialize.apply( this, arguments );

        if( this._localEvents ) this._localEvents.subscribe( this, this );
    }

    initialize(){}

    get length() : number { return this.models.length; }
    first() : R { return this.models[ 0 ]; }
    last() : R { return this.models[ this.models.length - 1 ]; }
    at( a_index : number ) : R {
        const index = a_index < 0 ? a_index + this.models.length : a_index;    
        return this.models[ index ];
    }

    // Deeply clone collection, optionally setting new owner.
    clone( options : CloneOptions = {} ) : this {
        const models = this._shared & ItemsBehavior.share ? this.models : this.map( model => model.clone() ),
              copy : this = new (<any>this.constructor)( models, { model : this.model, comparator : this.comparator }, this._shared );
        
        if( options.pinStore ) copy._defaultStore = this.getStore();
        
        return copy;
    }

    toJSON( options? : object ) : any {
        return this.models.map( model => model.toJSON( options ) );
    }

    // Apply bulk in-place object update in scope of ad-hoc transaction 
    set( elements : ElementsArg = [], options : TransactionOptions = {} ) : this {
        if( (<any>options).add !== void 0 ){
            this._log( 'warn', "Collection.set doesn't support 'add' option, behaving as if options.add === true.", options );
        }

        // Handle reset option here - no way it will be populated from the top as nested transaction.
        if( options.reset ){
            this.reset( elements, options )
        }
        else{
            const transaction = this._createTransaction( elements, options );
            transaction && transaction.commit();
        } 

        return this;    
    }

        /**
     * Enable or disable live updates.
     * 
     * `true` enables full collection synchronization.
     * `false` cancel live updates.
     * `json => true | false` - filter updates
     */
    liveUpdates( enabled : LiveUpdatesOption ) : IOPromise<this> {
        if( enabled ){
            this.liveUpdates( false );

            const filter = typeof enabled === 'function' ? enabled : () => true;

            this._liveUpdates = {
                updated : json => {
                    filter( json ) && this.add( json, { parse : true, merge : true } );
                },

                removed : id => this.remove( id )
            };

            return this.getEndpoint().subscribe( this._liveUpdates, this ).then( () => this );
        }
        else{
            if( this._liveUpdates ){
                this.getEndpoint().unsubscribe( this._liveUpdates, this );
                this._liveUpdates = null;
            }
        }
    }

    _liveUpdates : object

    fetch( a_options : { liveUpdates? : LiveUpdatesOption } & TransactionOptions = {} ) : IOPromise<this> {
        const options = { parse : true, ...a_options },
            endpoint = this.getEndpoint();

        return startIO(
            this,
            endpoint.list( options, this ),
            options,

            json => {
                let result : any = this.set( json, { parse : true, ...options } as TransactionOptions );
                
                if( options.liveUpdates ){
                    result = this.liveUpdates( options.liveUpdates );
                }

                return result;
            }
        );
    }

    dispose() : void {
        if( this._disposed ) return;

        const aggregated = !this._shared;

        for( let record of this.models ){
            free( this, record );

            if( aggregated ) record.dispose();
        }

        this.liveUpdates( false );

        super.dispose();
    }

    reset( a_elements? : ElementsArg, options : TransactionOptions = {} ) : R[] {
        const isRoot = begin( this ),
              previousModels = this.models;

        // Make all changes required, but be silent.
        if( a_elements ){            
            emptySetTransaction( this, toElements( this, a_elements, options ), options, true );
        }
        else{
            this._byId = {};
            this.models = [];
        }

        markAsDirty( this, options );

        options.silent || trigger2( this, 'reset', this, defaults( { previousModels : previousModels }, options ) );

        // Dispose models which are not in the updated collection.
        const { _byId } = this;
        
        for( let toDispose of previousModels ){
            _byId[ toDispose.cid ] || free( this, toDispose );
        }

        isRoot && commit( this );
        return this.models;
    }

    // Add elements to collection.
    add( a_elements : ElementsArg , options : AddOptions = {} ){
        const elements = toElements( this, a_elements, options ),
              transaction = this.models.length ?
                    addTransaction( this, elements, options ) :
                    emptySetTransaction( this, elements, options );

        if( transaction ){
            transaction.commit();
            return transaction.added;
        }
    }

    // Remove elements. 
    remove( recordsOrIds : any, options : CollectionOptions = {} ) : R[] | R {
        if( recordsOrIds ){
            return Array.isArray( recordsOrIds ) ?
                        removeMany( this, recordsOrIds, options ) as R[]:
                        removeOne( this, recordsOrIds, options ) as R;
        }

        return [];
    }

    // Apply bulk object update without any notifications, and return open transaction.
    // Used internally to implement two-phase commit.   
    _createTransaction( a_elements : ElementsArg, options : TransactionOptions = {} ) : CollectionTransaction | void {
        const elements = toElements( this, a_elements, options );

        if( this.models.length ){
            return options.remove === false ?
                        addTransaction( this, elements, options, true ) :
                        setTransaction( this, elements, options );
        }
        else{
            return emptySetTransaction( this, elements, options );
        }
    }

    static _attribute = AggregatedType;

    /***********************************
     * Collection manipulation methods
     */

    pluck( key : keyof R ) : any[] {
        return this.models.map( model => model[ key ] );
    }

    sort( options : TransactionOptions = {} ) : this {
        if( sortElements( this, options ) ){
            const isRoot = begin( this );
            
            if( markAsDirty( this, options ) ){
                trigger2( this, 'sort', this, options );
            }

            isRoot && commit( this );
        }

        return this;
    }

    // Add a model to the end of the collection.
    push(model : ElementsArg, options : CollectionOptions ) {
      return this.add(model, assign({at: this.length}, options));
    }

    // Remove a model from the end of the collection.
    pop( options : CollectionOptions ) : R {
      var model = this.at(this.length - 1);
      this.remove(model, { unset : true, ...options });
      return model;
    }

    // Remove and return given model.
    // TODO: do not dispose the model for aggregated collection.
    unset( modelOrId : R | string, options? ) : R {
        const value = this.get( modelOrId );
        this.remove( modelOrId, { unset : true, ...options } );
        return value;
    }

    // Add a model to the beginning of the collection.
    unshift(model : ElementsArg, options : CollectionOptions ) {
      return this.add(model, assign({at: 0}, options));
    }

    // Remove a model from the beginning of the collection.
    shift( options? : CollectionOptions ) : R {
      var model = this.at(0);
      this.remove( model, { unset : true, ...options } );
      return model;
    }

    // Slice out a sub-array of models from the collection.
    slice() : R[] {
      return slice.apply(this.models, arguments);
    }

    indexOf( modelOrId : any ) : number {
        const record = this.get( modelOrId );
        return this.models.indexOf( record );
    }

    modelId( attrs : {} ) : any {
        return attrs[ this.model.prototype.idAttribute ];
    }

    // Toggle model in collection.
    toggle( model : R, a_next? : boolean ) : boolean {
        var prev = Boolean( this.get( model ) ),
            next = a_next === void 0 ? !prev : Boolean( a_next );

        if( prev !== next ){
            if( prev ){
                this.remove( model );
            }
            else{
                this.add( model );
            }
        }

        return next;
    }

    _log( level : tools.LogLevel, text : string, value ) : void {
        tools.log( level, `[Collection Update] ${ this.model.prototype.getClassName() }.${ this.getClassName() }: ` + text, {
            Argument : value,
            'Attributes spec' : this.model.prototype._attributes
        });
    }

    getClassName() : string {
        return super.getClassName() || 'Collection';
    }
}

export type LiveUpdatesOption = boolean | ( ( x : any ) => boolean );

export type ElementsArg = Object | Record | Object[] | Record[];

// TODO: make is safe for parse to return null (?)
function toElements( collection : Collection, elements : ElementsArg, options : CollectionOptions ) : Elements {
    const parsed = options.parse ? collection.parse( elements, options ) : elements; 
    return Array.isArray( parsed ) ? parsed : [ parsed ];
}

createSharedTypeSpec( Collection, SharedType );

Record.Collection = <any>Collection;

function bindContext( fun : Function, context? : any ){
    return context !== void 0 ? ( v, k ) => fun.call( context, v, k ) : fun;
}

function toPredicateFunction<R>( iteratee : Predicate<R>, context : any ){
    if( typeof iteratee === 'object' ){
        // Wrap object to the predicate...
        return x => {
            for( let key in iteratee as any ){
                if( iteratee[ key ] !== x[ key ] )
                    return false;
            }

            return true;
        }
    }
    
    return bindContext( iteratee, context );

}