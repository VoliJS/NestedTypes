import { AnyType } from './generic'
import { tools } from '../../object-plus'

// Default attribute type for all constructor functions...
/** @private */
class ConstructorType extends AnyType {
    type : new ( value : any ) => {}

    convert( value ) {
        return value == null || value instanceof this.type ? value : new this.type( value );
    }

    clone( value ) {
        // delegate to clone function or deep clone through serialization
        return value && value.clone ? value.clone() : this.convert( JSON.parse( JSON.stringify( value ) ) );
    }
}

Function.prototype._attribute = ConstructorType;

// Primitive Types.
/** @private */
export class PrimitiveType extends AnyType {
    type : NumberConstructor | StringConstructor | BooleanConstructor

    dispose(){}
    create() { return this.type(); }

    toJSON( value ) { return value; }

    convert( value ) { return value == null ? value : this.type( value ); }

    isChanged( a, b ) { return a !== b; }

    clone( value ) { return value; }
}

Boolean._attribute = String._attribute = PrimitiveType;

// Number type with special validation algothim.
/** @private */ 
export class NumericType extends PrimitiveType {
    type : NumberConstructor

    convert( value, a?, b?, record? ) {
        const num = value == null ? value : this.type( value );        

        if( num !== num ){
            this._log( 'warn', 'assigned with Invalid Number', value, record );
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
 * Compatibility wrapper for Array type.
 * @private
 */ 
export class ArrayType extends AnyType {
    toJSON( value ) { return value; }
    dispose(){}

    convert( value, a?, b?, record? ) {
        // Fix incompatible constructor behaviour of Array...
        if( value == null || Array.isArray( value ) ) return value;

        this._log( 'warn', 'assigned with non-array', value, record );

        return [];
    }

    clone( value ){ return value && value.slice(); }
}

Array._attribute = ArrayType;