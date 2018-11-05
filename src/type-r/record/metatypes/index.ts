import { PrimitiveType, NumericType, ObjectType, ImmutableClassType, FunctionType, ArrayType } from './basic';
import { DateType } from './date';
import { AnyType, AttributeOptions } from './any';

export * from './any';
export * from './basic';
export * from './date';
export * from './owned';
export * from './shared';

/**
 * Every record attribute type has the corresponding metatype controlling its behavior.
 * For built-in types, Type-R uses the predefined list to resolve metatype in order to avoid global objects modifications.
 * For user-defined types, static `_metatype` constructor member is used.
 */

const builtins : Function[] = [ String, Number, Boolean, Date, Object, Array, Function ],
      metatypes = [ PrimitiveType, NumericType, PrimitiveType, DateType, ObjectType, ArrayType, FunctionType ];

export function getMetatype( Ctor : Function ){
    return ( Ctor as any )._metatype || resolveBuiltins( Ctor );
}

AnyType.create = ( options : AttributeOptions, name : string ) => {
    const type = options.type,
          AttributeCtor = options._metatype || ( type ? getMetatype( type ): AnyType );

    return new AttributeCtor( name, options );
}

function resolveBuiltins( Ctor : Function ){
    const idx = builtins.indexOf( Ctor );
    return idx < 0 ? ImmutableClassType : metatypes[ idx ];
}