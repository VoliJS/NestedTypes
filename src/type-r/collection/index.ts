import { IOPromise, startIO } from '../io-tools';
import { define, definitions, EventMap, eventsApi, EventsDefinition, Logger, logger, LogLevel, Mixable, MixableConstructor, mixinRules, tools } from '../object-plus';
import { AggregatedType, ChainableAttributeSpec, createSharedTypeSpec, Record, SharedType } from '../record';
import { CloneOptions, ItemsBehavior, Transactional, TransactionalDefinition, transactionApi, TransactionOptions } from '../transactions';
import { AddOptions, addTransaction } from './add';
import { CollectionCore, CollectionTransaction, Elements, free, sortElements, updateIndex } from './commons';
import { removeMany, removeOne } from './remove';
import { emptySetTransaction, setTransaction } from './set';


const { trigger2 } = eventsApi,
    { begin, commit, markAsDirty } = transactionApi,
    { assign, defaults } = tools;

let _count = 0;

export type GenericComparator = string | ( ( x : Record ) => number ) | ( ( a : Record, b : Record ) => number ); 

export interface CollectionOptions extends TransactionOptions {
    comparator? : GenericComparator
    model? : typeof Record
}

export type Predicate<R> = ( ( val : R, key? : number ) => boolean ) | Partial<R>;

export interface CollectionDefinition extends TransactionalDefinition {
    model? : typeof Record,
    itemEvents? : EventsDefinition
    _itemEvents? : EventMap
}

const slice = Array.prototype.slice;

class CollectionRefsType extends SharedType {
    static defaultValue = [];
}

export interface CollectionConstructor<R extends Record = Record > extends MixableConstructor {
    new ( records? : Partial<R> | Partial<R>[], options?: CollectionOptions ) : Collection<R>
    prototype : Collection<R>
    Refs : CollectionConstructor<R>
    subsetOf( C : Collection<R> | string | ( () => Collection<R> ) ) : ChainableAttributeSpec
};


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
export class Collection< R extends Record = Record> extends Transactional implements CollectionCore, Iterable<R> {
    _shared : number
    _aggregationError : R[]

    static Subset : typeof Collection
    static Refs : typeof Collection
    static _SubsetOf : typeof Collection
    
    createSubset( models : ElementsArg<R>, options ) : Collection<R>{
        const SubsetOf = (this.constructor as CollectionConstructor<R>).subsetOf( this ).options.type as CollectionConstructor<R>,
            subset   = new SubsetOf( models, options );
            
        ( subset as any ).resolve( this );
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
        RefsCollection._metatype = CollectionRefsType;

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

    get( objOrId : string | { id? : string, cid? : string } ) : R {
        if( objOrId == null ) return;

        if( typeof objOrId === 'object' ){
            const id = objOrId[ this.idAttribute ];
            return ( id !== void 0 && this._byId[ id ] ) || this._byId[ objOrId.cid ];
        }
        else{
            return this._byId[ objOrId ];
        }        
    }

    each( iteratee : ( val : R, key? : number ) => void, context? : any ) : void {
        this.models.forEach( iteratee, context );
    }

    // Loop through the members in the scope of transaction.
    // Transactional version of each()
    updateEach( iteratee : ( val : R, key? : number ) => void ){
        const isRoot = transactionApi.begin( this );
        this.models.forEach( iteratee );
        isRoot && transactionApi.commit( this );
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

    constructor( records? : ElementsArg<R>, options : CollectionOptions = {}, shared? : number ){
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
    set( elements : ElementsArg<R> = [], options : TransactionOptions = {} ) : this {
        if( (<any>options).add !== void 0 ){
            this._log( 'warn', "Type-R:InvalidOption", "Collection.set doesn't support 'add' option, behaving as if options.add === true.", options );
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

            // TODO: Return the resolved promise.
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

    reset( a_elements? : ElementsArg<R>, options : TransactionOptions = {} ) : R[] {
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
    add( a_elements : ElementsArg<R> , options : AddOptions = {} ){
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
    _createTransaction( a_elements : ElementsArg<R>, options : TransactionOptions = {} ) : CollectionTransaction | void {
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

    static _metatype = AggregatedType;

    /***********************************
     * Collection manipulation methods
     */

    pluck<K extends keyof R>( key : K ) : R[K][] {
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

    // Remove and return given model.
    unset( modelOrId : R | string, options? ) : R {
        const value = this.get( modelOrId );
        this.remove( modelOrId, { unset : true, ...options } );
        return value;
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

    _log( level : LogLevel, topic : string, text : string, value : object, a_logger? : Logger ) : void {
        ( a_logger || logger ).trigger( level, topic, `${ this.model.prototype.getClassName() }.${ this.getClassName() }: ` + text, {
            Argument : value,
            'Attributes spec' : this.model.prototype._attributes
        });
    }

    getClassName() : string {
        return super.getClassName() || 'Collection';
    }

    /***********************************
     * Proxied Array methods
     */

    get length() : number { return this.models.length; }

    // Add a model to the end of the collection.
    push(model : ElementsArg<R>, options? : CollectionOptions ) {
        return this.add(model, assign({at: this.length}, options));
    }

    // Remove a model from the end of the collection.
    pop( options? : CollectionOptions ) : R {
        var model = this.at(this.length - 1);
        this.remove(model, { unset : true, ...options });
        return model;
    }

    // Add a model to the beginning of the collection.
    unshift(model : ElementsArg<R>, options? : CollectionOptions ) {
        return this.add(model, assign({at: 0}, options));
    }
  
    // Remove a model from the beginning of the collection.
    shift( options? : CollectionOptions ) : R {
        const model = this.at(0);
        this.remove( model, { unset : true, ...options } );
        return model;
    }

    // Slice out a sub-array of models from the collection.
    slice( begin? : number, end? : number ) : R[] {
        return this.models.slice( begin, end );
    }
  
    indexOf( modelOrId : string | Partial<R> ) : number {
        return this.models.indexOf( this.get( modelOrId ) );
    }

    filter( iteratee : Predicate<R>, context? : any ) : R[] {
        return this.models.filter( toPredicateFunction( iteratee ), context );
    }

    find( iteratee : Predicate<R>, context? : any ) : R {
        return this.models.find( toPredicateFunction( iteratee ), context );
    }

    some( iteratee : Predicate<R>, context? : any ) : boolean {
        return this.models.some( toPredicateFunction( iteratee ), context );
    }

    forEach( iteratee : ( val : R, key? : number ) => void, context? : any ) : void {
        this.models.forEach( iteratee, context );
    }
    
    [ Symbol.iterator ]() : IterableIterator<R> {
        return this.models[ Symbol.iterator ]();
    }

    values() : IterableIterator<R> {
        return this.models.values();
    }

    entries() : IterableIterator<[ number, R ]>{
        return this.models.entries();
    }

    every( iteratee : Predicate<R>, context? : any ) : boolean {
        return this.models.every( toPredicateFunction( iteratee ), context );
    }

    includes( idOrObj : string | Partial<R> ){
        return Boolean( this.get( idOrObj ) );
    }

    // Map members to an array
    map<T>( iteratee : ( val : R, key? : number ) => T, context? : any ) : T[]{
        return this.models.map( iteratee, context );
    }

    
    reduce<T>( iteratee : (previousValue: any, currentValue: R, currentIndex?: number ) => T, init? : any ) : T {
        return this.models.reduce( iteratee, init );
    }
}

const d : CollectionConstructor = Collection;


export type LiveUpdatesOption = boolean | ( ( x : any ) => boolean );

export type ElementsArg<R = Record> = Partial<R> | Partial<R>[]

// TODO: make is safe for parse to return null (?)
function toElements<R extends Record>( collection : Collection<R>, elements : ElementsArg<R>, options : CollectionOptions ) : Elements {
    const parsed = options.parse ? collection.parse( elements, options ) : elements; 
    return Array.isArray( parsed ) ? parsed : [ parsed ];
}

createSharedTypeSpec( Collection, SharedType );

Record.Collection = Collection;

function toPredicateFunction<R>( iteratee : Predicate<R> ){
    switch( typeof iteratee ){
        case 'function' : return iteratee;
        case 'object' :
            const keys = Object.keys( iteratee );
            
            return x => {
                for( let key of keys ){
                    if( iteratee[ key ] !== x[ key ] )
                        return false;
                }

                return true;
            }
        default : throw new Error( 'Invalid iteratee' );
    }
}