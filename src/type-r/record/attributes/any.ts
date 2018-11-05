import { setAttribute, AttributesContainer, AttributeUpdatePipeline, RecordTransaction } from './updates'
import { tools } from '../../object-plus'
import { Owner, Transactional, TransactionOptions } from '../../transactions'
import { IOEndpoint } from '../../io-tools'

const { notEqual, assign} = tools;

declare global {
    interface Function {
        _attribute : typeof AnyType
    }
}

export type Transform = ( this : AnyType, next : any, prev : any, record : AttributesContainer, options : TransactionOptions ) => any;
export type ChangeHandler = ( this : AnyType, next : any, prev : any, record : AttributesContainer, options : TransactionOptions ) => void;

export interface AttributeOptions {
    _attribute? : typeof AnyType
    validate? : ( record : AttributesContainer, value : any, key : string ) => any
    isRequired? : boolean
    changeEvents? : boolean

    endpoint? : IOEndpoint

    type? : Function
    value? : any
    hasCustomDefault? : boolean

    parse? : Parse
    toJSON? : AttributeToJSON
   
    getHooks? : GetHook[]
    transforms? : Transform[]
    changeHandlers? : ChangeHandler[]

    _onChange? : ChangeAttrHandler
}

export type Parse = ( value : any, key : string ) => any;
export type GetHook = ( value : any, key : string ) => any;
export type AttributeToJSON = ( value : any, key : string ) => any
export type AttributeParse = ( value : any, key : string ) => any
export type ChangeAttrHandler = ( ( value : any, attr : string ) => void ) | string;

// TODO: interface differs from options, do something obout it
const emptyOptions : TransactionOptions = {};

/**
 * Typeless attribute. Is the base class for all other attributes.
 */
export class AnyType implements AttributeUpdatePipeline {
    // Factory method to create attribute from options 
    static create( options : AttributeOptions, name : string ) : AnyType {
        const type = options.type,
              AttributeCtor = options._attribute || ( type ? type._attribute : AnyType );

        return new AttributeCtor( name, options );
    }
    /**
     * Update pipeline functions
     * =========================
     *
     * Stage 0. canBeUpdated( value )
     * - presence of this function implies attribute's ability to update in place.
     */
    canBeUpdated( prev, next, options : TransactionOptions ) : any {}

    /**
     * Stage 1. Transform stage
     */
    transform( next : any, prev : any, model : AttributesContainer, options : TransactionOptions ) : any { return next; }

    // convert attribute type to `this.type`.
    convert( next : any, prev : any, model : AttributesContainer, options : TransactionOptions ) : any { return next; }

    /**
     * Stage 2. Check if attr value is changed
     */
    isChanged( a : any, b : any ) : boolean {
        return notEqual( a, b );
    }

    /**
     * Stage 3. Handle attribute change
     */
    handleChange( next : any, prev : any, model : AttributesContainer, options : TransactionOptions ) {}

    /**
     * End update pipeline definitions.
     */

    // create empty object passing backbone options to constructor...
    create() { return void 0; }

    // generic clone function for typeless attributes
    // Must be overriden in sublass
    clone( value : any, record : AttributesContainer ) {
        return value;
    }

    dispose( record : AttributesContainer, value : any ) : void {
        this.handleChange( void 0, value, record, emptyOptions );
    }

    validate( record : AttributesContainer, value : any, key : string ){}

    toJSON( value, key, options? : object ) {
        return value && value.toJSON ? value.toJSON( options ) : value;
    }

    createPropertyDescriptor() : PropertyDescriptor | void {
        const { name, getHook } = this;

        if( name !== 'id' ){
            return {
                // call to optimized set function for single argument.
                set( value ){
                    setAttribute( this, name, value );
                },

                // attach get hook to the getter function, if it present
                get : (
                    getHook ?
                        function() {
                            return getHook.call( this, this.attributes[ name ], name );
                        } :
                        function() { return this.attributes[ name ]; }
                )
            }
        }
    }

    value : any

    // Used as global default value for the given metatype
    static defaultValue : any;

    type : Function

    initialize( name : string, options : TransactionOptions ){}

    options : AttributeOptions

    doInit( value, record : AttributesContainer, options : TransactionOptions ){
        const v = value === void 0 ? this.defaultValue() : value,
            x = this.transform( v, void 0, record, options );
            
        this.handleChange( x, void 0, record, options );
        return x;
    }

    doUpdate( value, record : AttributesContainer, options : TransactionOptions, nested? : RecordTransaction[] ){
        const { name } = this,
            { attributes } = record,
              prev = attributes[ name ];

        const next = this.transform( value, prev, record, options );
        attributes[ name ] = next;

        if( this.isChanged( next, prev ) ) {
            // Do the rest of the job after assignment
            this.handleChange( next, prev, record, options );
            return true;
        }

        return false;
    }

    propagateChanges : boolean

    _log( level : tools.LogLevel, text : string, value, record : AttributesContainer ){
        tools.log( level, `[Attribute Update Error] ${ record.getClassName() }.${ this.name }: ` + text, {
            'Record' : record,
            'Attribute definition' : this,
            'Prev. value' : record.attributes[ this.name ],
            'New value' : value
        });
    }

    defaultValue(){
        return this.value;
    }

    constructor( public name : string, a_options : AttributeOptions ) {        
        // Save original options...
        this.options = a_options;

        // Clone options.
        const options : AttributeOptions = assign( { getHooks : [], transforms : [], changeHandlers : [] }, a_options );
        options.getHooks = options.getHooks.slice();
        options.transforms = options.transforms.slice();
        options.changeHandlers = options.changeHandlers.slice();

        const {
                  value, type, parse, toJSON, changeEvents,
                  validate, getHooks, transforms, changeHandlers
              } = options;

        // Initialize default value...
        this.value = value;
        this.type  = type;

        // TODO: An opportunity to optimize for attribute subtype.
        if( !options.hasCustomDefault && type ){
            this.defaultValue = this.create;
        }
        else if( tools.isValidJSON( value ) ){ 
            // JSON literals must be deep copied.
            this.defaultValue = new Function( `return ${ JSON.stringify( value ) };` ) as any;
        }
        else{
            this.defaultValue = this.defaultValue;
        }

        // Changes must be bubbled when they are not disabled for an attribute and transactional object.
        this.propagateChanges = changeEvents !== false;

        this.toJSON = toJSON === void 0 ? this.toJSON : toJSON;

        this.validate = validate || this.validate;
        
        if( options.isRequired ){
            this.validate = wrapIsRequired( this.validate );
        }

        /**
         * Assemble pipelines...
         */

        // `convert` is default transform, which is always present...
        transforms.unshift( this.convert );

        // Get hook from the attribute will be used first...
        if( this.get ) getHooks.unshift( this.get );

        // let subclasses configure the pipeline...
        this.initialize.call( this, options );

        // let attribute spec configure the pipeline...
        if( getHooks.length ){
            const getHook = this.getHook = getHooks.reduce( chainGetHooks );

            const { validate } = this;
            this.validate = function( record : AttributesContainer, value : any, key : string ){
                return validate.call( this, record, getHook.call( record, value, key ), key );
            }
        }
        
        this.transform = transforms.length ? transforms.reduce( chainTransforms ) : this.transform;
        
        this.handleChange = changeHandlers.length ? changeHandlers.reduce( chainChangeHandlers ) : this.handleChange;

        // Attribute-level parse transform are attached as update hooks modifiers...
        const { doInit, doUpdate } = this;
        this.doInit = parse ? function( value, record : AttributesContainer, options : TransactionOptions ){
            return doInit.call( this, options.parse && value !== void 0 ? parse.call( record, value, this.name ) : value, record, options );
        } : doInit;

        this.doUpdate = parse ? function( value, record : AttributesContainer, options : TransactionOptions, nested? : RecordTransaction[] ){
            return doUpdate.call( this, options.parse && value !== void 0 ? parse.call( record, value, this.name ) : value, record, options, nested );
        } : doUpdate;
    }

    getHook : ( value, key : string ) => any = null
    get : ( value, key : string ) => any
}


function chainGetHooks( prevHook : GetHook, nextHook : GetHook ) : GetHook {
    return function( value, name ) {
        return nextHook.call( this, prevHook.call( this, value, name ), name );
    }
}

function chainTransforms( prevTransform : Transform, nextTransform : Transform ) : Transform {
    return function( next, prev, record, options ) {
        return nextTransform.call( this, prevTransform.call( this, next, prev, record, options ), prev, record, options );
    }
}

function chainChangeHandlers( prevHandler : ChangeHandler, nextHandler : ChangeHandler ) : ChangeHandler {
    return function( next, prev, record, options ) {
        prevHandler.call( this, next, prev, record, options );
        nextHandler.call( this, next, prev, record, options );
    }
}

function wrapIsRequired( validate ){
    return function( record : AttributesContainer, value : any, key : string ){
        return value ? validate.call( this, record, value, key ) : 'Required';
    }
}