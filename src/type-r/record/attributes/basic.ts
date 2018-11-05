/**
 * Built-in JSON types attributes: Object, Array, Number, String, Boolean, and immutable class.
 * 
 * Adds type assertions, default validation, and optimized update pipeline.
 */

import { AnyType } from './any'
import { tools } from '../../object-plus'
import { AttributesContainer } from './updates'
import { TransactionOptions } from '../../transactions'

/**
 * Custom class must be immutable class which implements toJSON() method
 * with a constructor taking json.
 */
class ImmutableClassType extends AnyType {
    type : new ( value? : any ) => {}

    create(){
        return new this.type();
    }

    convert( next : any ) : any {
        return next == null || next instanceof this.type ? next : new this.type( next );
    }

    toJSON( value, key? : string, options? : object ){
        return value && value.toJSON ? value.toJSON( options ) : value;
    }

    clone( value ) {
        return new this.type( this.toJSON( value ) );
    }

    isChanged( a, b ){
        return a !== b;
    }
}

Function.prototype._attribute = ImmutableClassType;

/**
 * Optimized attribute of primitive type.
 * 
 * Primitives has specialized simplified pipeline.
 */
export class PrimitiveType extends AnyType {
    type : NumberConstructor | StringConstructor | BooleanConstructor

    dispose(){}
    create() { return this.type(); }

    toJSON( value ) { return value; }

    convert( next ) { return next == null ? next : this.type( next ); }

    isChanged( a, b ) { return a !== b; }

    clone( value ) { return value; }

    doInit( value, record : AttributesContainer, options : TransactionOptions ){
        return this.transform( value === void 0 ? this.value : value, void 0, record, options );
    }

    doUpdate( value, record, options, nested ){
        const   { name } = this,
                { attributes } = record,
                prev = attributes[ name ];
        
        return prev !== ( attributes[ name ] = this.transform( value, prev, record, options ) );
    }

    initialize(){
        if( !this.options.hasCustomDefault ){
            this.value = this.type();
        }
    }
}

Boolean._attribute = String._attribute = PrimitiveType;

// Number type with special validation algothim.
/** @private */ 
export class NumericType extends PrimitiveType {
    type : NumberConstructor

    create(){
        return 0;
    }

    convert( next, prev?, record? ) {
        const num = next == null ? next : this.type( next );

        if( num !== num ){
            this._log( 'warn', 'assigned with Invalid Number', next, record );
        }
        
        return num;
    }

    validate( model, value, name ) {
        // Whatever is not symmetrically serializable to JSON, is not valid by default.
        if( value != null && !isFinite( value ) ) {
            return name + ' is not valid number';
        }
    }
}

Number._attribute = NumericType;

/**
 * Add Number.integer attrubute type
 */
declare global {
    interface NumberConstructor {
        integer : Function
    }

    interface Window {
        Integer : Function;
    }
}

function Integer( x ){
    return x ? Math.round( x ) : 0;
}
Integer._attribute = NumericType;
Number.integer = Integer;


if( typeof window !== 'undefined' ){
    window.Integer = Number.integer;
}

/**
 * Compatibility wrapper for Array type.
 * @private
 */ 
export class ArrayType extends AnyType {
    toJSON( value ) { return value; }
    dispose(){}
    create(){ return []; }

    convert( next, prev, record ) {
        // Fix incompatible constructor behaviour of Array...
        if( next == null || Array.isArray( next ) ) return next;

        this._log( 'warn', 'assignment of non-array to Array attribute is ignored', next, record );

        return [];
    }

    clone( value ){
        return value && value.slice();
    }
}

Array._attribute = ArrayType;

export class ObjectType extends AnyType {
    create(){ return {}; }

    convert( next, prev, record ) {
        if( next == null || typeof next === 'object' ) return next;
                
        this._log( 'warn', 'assignment of non-object to Object attribute is ignored', next, record );
        return {};
    }
}

Object._attribute = ObjectType;

export function doNothing(){}

export class FunctionType extends AnyType {
    // Functions are not serialized.
    toJSON( value ) { return void 0; }
    create(){ return doNothing; }
    dispose(){}

    convert( next, prev, record ) {
        // Fix incompatible constructor behaviour of Function...
        if( next == null || typeof next === 'function' ) return next;

        this._log( 'warn', 'assigned with non-function', next, record );

        return doNothing;
    }

    // Functions are not cloned.
    clone( value ){ return value; }
}

Function._attribute = FunctionType;