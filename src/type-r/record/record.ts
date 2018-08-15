/**
 * Record core implementing transactional updates.
 * The root of all definitions. 
 */

import { tools, eventsApi, Mixable, definitions, mixins,  mixinRules, define } from '../object-plus'

import { CloneOptions, Transactional, TransactionalDefinition, Transaction, TransactionOptions, Owner } from '../transactions'
import { ChildrenErrors } from '../validation'

import { Collection } from '../collection'

import { AnyType, AggregatedType, setAttribute, UpdateRecordMixin, 
    AttributesValues, AttributesContainer,
    ConstructorsMixin, AttributesConstructor, AttributesCopyConstructor } from './attributes'

import { IORecord, IORecordMixin } from './io-mixin'
import { IOPromise, IOEndpoint } from '../io-tools'

const { assign, isEmpty, log } = tools;

/*******************************************************
 * Record core implementation
 */

export interface ConstructorOptions extends TransactionOptions{
    clone? : boolean
}

// Client unique id counter
let _cidCounter : number = 0;

/***************************************************************
 * Record Definition as accepted by Record.define( definition )
 */
export interface RecordDefinition extends TransactionalDefinition {
    idAttribute? : string
    attributes? : AttributesValues
    collection? : object
    Collection? : typeof Transactional
}

@define({
    // Default client id prefix 
    cidPrefix : 'm',

    // Name of the change event
    _changeEventName : 'change',

    // Default id attribute name
    idAttribute : 'id'
})
@definitions({
    defaults : mixinRules.merge,
    attributes : mixinRules.merge,
    collection : mixinRules.merge,
    Collection : mixinRules.value,
    idAttribute : mixinRules.protoValue
})
export class Record extends Transactional implements IORecord, AttributesContainer {
    // Hack
    static onDefine( definition, BaseClass ){}

    static Collection : typeof Collection;
    static DefaultCollection : typeof Collection;

    static from : ( collectionReference : any ) => any;
    
    static defaults( attrs : AttributesValues ) : typeof Record {
        return <any>this.extend({ attributes : attrs });
    }
    
    static attributes : AttributesValues

    /********************
     * IO Methods
     */
     _endpoints : { [ name : string ] : IOEndpoint }

     // Save record
     save( options? : object ) : IOPromise<this> { throw new Error( 'Implemented by mixin' ); }

     // Destroy record
     destroy( options? : object ) : IOPromise<this> { throw new Error( 'Implemented by mixin' ); }

    /***********************************
     * Core Members
     */
    // Previous attributes
    _previousAttributes : {}

    previousAttributes(){ return new this.AttributesCopy( this._previousAttributes ); } 

    // Current attributes    
    attributes : AttributesValues

    // Polymorphic accessor for aggregated attribute's canBeUpdated().
    get __inner_state__(){ return this.attributes; }

    // Lazily evaluated changed attributes hash
    _changedAttributes : AttributesValues

    get changed(){
        let changed = this._changedAttributes;

        if( !changed ){
            const prev = this._previousAttributes;
            changed = {};

            const { _attributes, attributes } = this;

            for( let attr of this._attributesArray ){
                const key = attr.name,
                    value = attributes[ key ];

                if( attr.isChanged( value, prev[ key ] ) ){
                    changed[ key ] = value;
                }
            }

            this._changedAttributes = changed;
        }

        return changed;    
    }

    changedAttributes( diff? : {} ) : boolean | {} {
        if( !diff ) return this.hasChanged() ? assign( {}, this.changed ) : false;

        var val, changed : {} | boolean = false,
            old          = this._transaction ? this._previousAttributes : this.attributes,
            attrSpecs    = this._attributes;

        for( var attr in diff ){
            if( !attrSpecs[ attr ].isChanged( old[ attr ], ( val = diff[ attr ] ) ) ) continue;
            (changed || (changed = {}))[ attr ] = val;
        }

        return changed;        
    }

    hasChanged( key? : string ) : boolean {
        const { _previousAttributes } = this;
        if( !_previousAttributes ) return false;

        return key ?
                this._attributes[ key ].isChanged( this.attributes[ key ], _previousAttributes[ key ] ) :
                !isEmpty( this.changed );
    }

    previous( key : string ) : any {
        if( key ){
            const { _previousAttributes } = this;
            if( _previousAttributes ) return _previousAttributes[ key ];
        }
        
        return null;
    }

    isNew() : boolean {
        return this.id == null;
    }

    has( key : string ) : boolean {
        return this[ key ] != void 0;
    }

    // Return attribute value, setting an attribute to undefined.
    // TODO: If attribute was aggregated, don't dispose it.
    unset( key : string, options? ) : any {
        const value = this[ key ];
        this.set({ [ key ] : void 0 }, { unset : true, ...options });
        return value;
    }

    // Undocumented. Move to NestedTypes?
    clear( options? ) : this {
        const nullify = options && options.nullify;

        this.transaction( () =>{
            this.forEachAttr( this.attributes, ( value, key ) => this[ key ] = nullify ? null : void 0 );
        }, options );

        return this;
    }

    // Returns Record owner skipping collections. TODO: Move out
    getOwner() : Owner {
        const owner : any = this._owner;

        // If there are no key, owner must be transactional object, and it's the collection.
        // We don't expect that collection can be the member of collection, so we're skipping just one level up. An optimization.
        return this._ownerKey ? owner : owner && owner._owner;
    }

    /***********************************
     * Identity managements
     */

    // Id attribute name ('id' by default)
    idAttribute : string;

    // Fixed 'id' property pointing to id attribute
    get id() : string | number { return this.attributes[ this.idAttribute ]; }
    set id( x : string | number ){ setAttribute( this, this.idAttribute, x ); }

    /***********************************
     * Dynamically compiled stuff
     */

    // Attributes specifications 
    _attributes : { [ key : string ] : AnyType }
    _attributesArray : AnyType[]

    // Attributes object copy constructor
    Attributes : AttributesConstructor
    AttributesCopy : AttributesCopyConstructor

    // forEach function for traversing through attributes, with protective default implementation
    // Overriden by dynamically compiled loop unrolled function in define.ts
    forEachAttr( attrs : {}, iteratee : ( value : any, key? : string, spec? : AnyType ) => void ) : void {
        const { _attributes } = this;
        let unknown : string[];

        for( let name in attrs ){
            const spec = _attributes[ name ];

            if( spec ){
                iteratee( attrs[ name ], name, spec );
            }
            else{
                unknown || ( unknown = [] );
                unknown.push( `'${ name }'` );
            }
        }

        if( unknown ){
            this._log( 'warn', `attributes ${ unknown.join(', ')} are not defined`,{
                attributes : attrs
            } );
        }
    }

    each( iteratee : ( value? : any, key? : string ) => void, context? : any ){
        const fun = context !== void 0 ? ( v, k ) => iteratee.call( context, v, k ) : iteratee,
            { attributes } = this;

        for( const key in this.attributes ){
            const value = attributes[ key ];
            if( value !== void 0 ) fun( value, key );
        }
    }

    // Get array of attribute keys (Record) or record ids (Collection) 
    keys() : string[] {
        const keys : string[] = [];

        this.each( ( value, key ) => value === void 0 || keys.push( key ) );

        return keys;
    }

    // Get array of attribute values (Record) or records (Collection)
    values() : any[] {
        return this.map( value => value );
    }

    // Create record default values, optionally augmenting given values.
    defaults( values = {} ){
        const defaults = {},
            { _attributesArray } = this;

        for( let attr of _attributesArray ){
            const key = attr.name,
            value = values[ key ];

            defaults[ key ] = value === void 0 ? attr.defaultValue() : value;
        }

        return defaults;
    }

    /***************************************************
     * Record construction
     */
    // Create record, optionally setting an owner
    constructor( a_values? : {}, a_options? : ConstructorOptions ){
        super( _cidCounter++ );
        this.attributes = {};
        
        const options = a_options || {},
              values = ( options.parse ? this.parse( a_values, options ) :  a_values ) || {};

        if( log.level > 1 ) typeCheck( this, values );

        this._previousAttributes = this.attributes = new this.Attributes( this, values, options );

        this.initialize( a_values, a_options );

        if( this._localEvents ) this._localEvents.subscribe( this, this );
    }

    // Initialization callback, to be overriden by the subclasses 
    initialize( values?, options? ){}

    // Deeply clone record, optionally setting new owner.
    clone( options : CloneOptions = {} ) : this {
        const copy : this = new (<any>this.constructor)( this.attributes, { clone : true } );
        
        if( options.pinStore ) copy._defaultStore = this.getStore();

        return copy;
    }

    // Deprecated, every clone is the deep one now.
    deepClone() : this { return this.clone() };

    // Validate attributes.
    _validateNested( errors : ChildrenErrors ) : number {
        var length    = 0;

        this.forEachAttr( this.attributes, ( value, name, attribute ) => {
            const error = attribute.validate( this, value, name );

            if( error ){
                errors[ name ] = error;
                length++;
            }
        } );

        return length;
    }

    // Get attribute by key
    get( key : string ) : any {
        return this[ key ];
    }

    /**
     * Serialization control
     */

    // Default record-level serializer, to be overriden by subclasses 
    toJSON( options? : object ) : any {
        const json = {};

        this.forEachAttr( this.attributes, ( value, key : string, { toJSON } ) =>{
            // If attribute serialization is not disabled, and its value is not undefined...
            if( value !== void 0 ){
                // ...serialize it according to its spec.
                const asJson = toJSON.call( this, value, key, options );

                // ...skipping undefined values. Such an attributes are excluded.
                if( asJson !== void 0 ) json[ key ] = asJson; 
            }
        });

        return json;
    }
    
    // Default record-level parser, to be overriden by the subclasses.
    parse( data, options? : TransactionOptions ){
        return data;
    }

    // DEPRECATED: Attributes-level parse. Is moved to attribute descriptors.
    _parse( data ){ return data; }

    /**
     * Transactional control
     */

    deepSet( name : string, value : any, options? ){
        // Operation might involve series of nested object updates, thus it's wrapped in transaction.
        this.transaction( () => {
            const path  = name.split( '.' ),
                l     = path.length - 1,
                attr  = path[ l ];

            let model = this;

            // Locate the model, traversing the path.
            for( let i = 0; i < l; i++ ){
                const key = path[ i ];

                // There might be collections in path, so use `get`.
                let next    = model.get ? model.get( key ) : model[ key ];

                // Create models, if they are not exist.
                if( !next ){
                    const attrSpecs = model._attributes;
                    if( attrSpecs ){
                        // If current object is model, create default attribute
                        var newModel = attrSpecs[ key ].create();

                        // If created object is model, nullify attributes when requested
                        if( options && options.nullify && newModel._attributes ){
                            newModel.clear( options );
                        }

                        model[ key ] = next = newModel;
                    }
                    // Silently fail in other case.
                    else return;
                }
                
                model = next;
            }

            // Set model attribute.
            if( model.set ){
                model.set({ [ attr ] : value }, options );
            }
            else{
                model[ attr ] = value;
            }
        });

        return this;
    }
            
    // Returns owner without the key (usually it's collection)
    get collection() : any {
        return this._ownerKey ? null : this._owner;
    }

    // Dispose object and all childrens
    dispose(){
        if( this._disposed ) return;
        
        this.forEachAttr( this.attributes, ( value, key, attribute ) => {
            attribute.dispose( this, value );
        });

        super.dispose();
    }

    _log( level : tools.LogLevel, text : string, props : object ) : void {
        tools.log( level, '[Record] ' + text, {
            'Record' : this,
            'Attributes definition:' : this._attributes,
            ...props
        });
    }

    getClassName() : string {
        return super.getClassName() || 'Record';
    }

    // Dummies to 
    _createTransaction( values : object, options : TransactionOptions ) : Transaction { return void 0; }
    // Simulate attribute change 
    forceAttributeChange : ( key : string, options : TransactionOptions ) => void
    _onChildrenChange : ( child : Transactional, options : TransactionOptions ) => void
};

assign( Record.prototype, UpdateRecordMixin, IORecordMixin );

/***********************************************
 * Helper functions
 */

class BaseRecordAttributes {
    id : string | number

    constructor( record : Record, x : AttributesValues, options : TransactionOptions ) {
        this.id = x.id;
    }
}

Record.prototype.Attributes = BaseRecordAttributes;

class BaseRecordAttributesCopy {
    id : string | number

    constructor( x : AttributesValues ) {
        this.id = x.id;
    }
}

Record.prototype.AttributesCopy = BaseRecordAttributesCopy;

const IdAttribute = AnyType.create({ value : void 0 }, 'id' );
Record.prototype._attributes = { id : IdAttribute };
Record.prototype._attributesArray = [ IdAttribute ];
Record._attribute = AggregatedType;

import { shouldBeAnObject } from './attributes'

function typeCheck( record : Record, values : object ){
    if( shouldBeAnObject( record, values ) ){
        const { _attributes } = record;
        let unknown : string[];

        for( let name in values ){
            if( !_attributes[ name ] ){
                unknown || ( unknown = [] );
                unknown.push( `'${ name }'` );
            }
        }

        if( unknown ){
            record._log( 'warn', `undefined attributes ${ unknown.join(', ')} are ignored.`, { values } );
        }
    }
}