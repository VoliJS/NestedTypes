import { PrimitiveType, NumericType, ObjectType, ImmutableClassType, FunctionType, ArrayType } from './basic';
import { DateType } from './date';
import { AnyType } from './any';
export * from './any';
export * from './basic';
export * from './date';
export * from './owned';
export * from './shared';
var builtins = [String, Number, Boolean, Date, Object, Array, Function], metatypes = [PrimitiveType, NumericType, PrimitiveType, DateType, ObjectType, ArrayType, FunctionType];
export function getMetatype(Ctor) {
    return Ctor._metatype || resolveBuiltins(Ctor);
}
AnyType.create = function (options, name) {
    var type = options.type, AttributeCtor = options._metatype || (type ? getMetatype(type) : AnyType);
    return new AttributeCtor(name, options);
};
function resolveBuiltins(Ctor) {
    var idx = builtins.indexOf(Ctor);
    return idx < 0 ? ImmutableClassType : metatypes[idx];
}
//# sourceMappingURL=index.js.map