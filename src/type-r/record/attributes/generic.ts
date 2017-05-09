import { setAttribute, Record, Attribute, Transform, ChangeHandler, AttributeDescriptor } from '../transaction'
import { Constructor, tools } from '../../object-plus'
import { Owner, Transactional, TransactionOptions } from '../../transactions'

const { notEqual, assign} = tools;

type GetHook = ( value : any, key : string ) => any;
export type ChangeAttrHandler = ( ( value : any, attr : string ) => void ) | string;

declare global {
    interface Function {
        _attribute : typeof AnyType
    }
}

interface ExtendedAttributeDescriptor extends AttributeDescriptor {
    _attribute? : typeof AnyType
    validate? : ( record : Record, value : any, key : string ) => any
    isRequired? : boolean
    changeEvents? : boolean
} 

export { ExtendedAttributeDescriptor as AttributeDescriptor }

// TODO: interface differs from options, do something obout it
/** @private */
export class AnyType implements Attribute {
    // Factory method to create attribute from options 
    static create( options : ExtendedAttributeDescriptor, name : string ) : AnyType {
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
    transform( value, options : TransactionOptions, prev, model : Record ) { return value; }

    // convert attribute type to `this.type`.
    convert( value, options : TransactionOptions, prev, model : Record ) { return value; }

    /**
     * Stage 2. Check if attr value is changed
     */
    isChanged( a, b ) {
        return notEqual( a, b );
    }

    /**
     * Stage 3. Handle attribute change
     */
    handleChange( next, prev, model : Record ) {}

    /**
     * End update pipeline definitions.
     */

    // create empty object passing backbone options to constructor...
    create() { return new ( <any>this.type )(); }

    // generic clone function for typeless attributes
    // Must be overriden in sublass
    clone( value : any, record : Record ) {
        if( value && typeof value === 'object' ) {
            // delegate to object's clone(), if it exist...
            if( value.clone ) return value.clone();

            const proto = Object.getPrototypeOf( value );

            // attempt to deep copy raw objects, assuming they are JSON 
            if( proto === Object.prototype || proto === Array.prototype ){
                return JSON.parse( JSON.stringify( value ) ); // FIXME! This cloning will not work for Dates.
            }
        }

        return value;
    }

    dispose( record : Record, value : any ) : void {
        this.handleChange( void 0, value, record );
    }

    validate( record : Record, value : any, key : string ){}

    toJSON( value, key ) {
        return value && value.toJSON ? value.toJSON() : value;
    }

    createPropertyDescriptor() : PropertyDescriptor | void {
        const { name, getHook } = this;

        if( name !== 'id' ){
            return {
                // call to optimized set function for single argument.
                set( value ){
                    setAttribute( <any>this, name, value );
                },

                // attach get hook to the getter function, if present
                get : getHook ?
                      function() {
                          return getHook.call( this, this.attributes[ name ], name );
                      } :
                      function() {
                          return this.attributes[ name ];
                      }
            }
        }
    }

    value : any

    // Used as global default value for the given metatype  
    static defaultValue : any;

    type : Constructor< any >

    parse : ( value, key : string ) => any

    initialize( name : string, options ){}

    options : ExtendedAttributeDescriptor

    propagateChanges : boolean

    _log( level : string, text : string, value, record : Record ){
        tools.log[ level ]( `[Attribute Update] ${ record.getClassName() }.${ this.name }: ` + text, value, 'Attributes spec:', record._attributes );
    }

    constructor( public name : string, a_options : ExtendedAttributeDescriptor ) {        
        // Save original options...
        this.options = a_options;

        // Clone options.
        const options : ExtendedAttributeDescriptor = assign( { getHooks : [], transforms : [], changeHandlers : [] }, a_options );
        options.getHooks = options.getHooks.slice();
        options.transforms = options.transforms.slice();
        options.changeHandlers = options.changeHandlers.slice();

        const {
                  value, type, parse, toJSON, changeEvents,
                  validate, getHooks, transforms, changeHandlers
              } = options;

        this.value = value;
        this.type  = type;

        // Changes must be bubbled when they are not disabled for an attribute and transactional object.
        this.propagateChanges = changeEvents !== false;

        this.parse  = parse;
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
            this.validate = function( record : Record, value : any, key : string ){
                return validate.call( this, record, getHook.call( record, value, key ), key );
            }
        }
        
        if( transforms.length ){
            this.transform = transforms.reduce( chainTransforms );
        }
        
        if( changeHandlers.length ){
            this.handleChange = changeHandlers.reduce( chainChangeHandlers );
        }
    }

    getHook : ( value, key : string ) => any = null
    get : ( value, key : string ) => any
}

Record.prototype._attributes = { id : AnyType.create({ value : void 0 }, 'id' )};
Record.prototype.defaults = function( attrs : { id? : string } = {} ){ return { id : attrs.id } };

/** @private */
function chainChangeHandlers( prevHandler : ChangeHandler, nextHandler : ChangeHandler ) : ChangeHandler {
    return function( next, prev, model ) {
        prevHandler.call( this, next, prev, model );
        nextHandler.call( this, next, prev, model );
    }
}

/** @private */
function chainGetHooks( prevHook : GetHook, nextHook : GetHook ) : GetHook {
    return function( value, name ) {
        return nextHook.call( this, prevHook.call( this, value, name ), name );
    }
}

/** @private */
function chainTransforms( prevTransform : Transform, nextTransform : Transform ) : Transform {
    return function( value, options, prev, model ) {
        return nextTransform.call( this, prevTransform.call( this, value, options, prev, model ), options, prev, model );
    }
}

function wrapIsRequired( validate ){
    return function( record : Record, value : any, key : string ){
        return value ? validate.call( this, record, value, key ) : 'Required';
    }
}