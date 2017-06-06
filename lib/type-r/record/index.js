import { Record } from './transaction';
import { Mixable, tools } from '../object-plus';
import { compile } from './define';
import { ChainableAttributeSpec } from './typespec';
import { Transactional } from '../transactions';
import { AggregatedType, MSDateType, TimestampType, NumericType, SharedType } from './attributes';
export * from './attributes';
export { Record, ChainableAttributeSpec };
var assign = tools.assign, defaults = tools.defaults, omit = tools.omit, getBaseClass = tools.getBaseClass;
Record.define = function (protoProps, staticProps) {
    if (protoProps === void 0) { protoProps = {}; }
    var BaseConstructor = getBaseClass(this), baseProto = BaseConstructor.prototype, staticsDefinition = tools.getChangedStatics(this, 'attributes', 'collection', 'Collection', 'idAttribute'), definition = assign(staticsDefinition, protoProps);
    if ('Collection' in this && this.Collection === void 0) {
        tools.log.error("[Model Definition] " + this.prototype.getClassName() + ".Collection is undefined. It must be defined _before_ the model.", definition);
    }
    var dynamicMixin = compile(this.attributes = getAttributes(definition), baseProto._attributes);
    if (definition.properties === false) {
        dynamicMixin.properties = {};
    }
    assign(dynamicMixin.properties, protoProps.properties || {});
    assign(dynamicMixin, omit(definition, 'attributes', 'collection', 'defaults', 'properties', 'forEachAttr'));
    Mixable.define.call(this, dynamicMixin, staticProps);
    defineCollection.call(this, definition.collection || definition.Collection);
    return this;
};
Record.predefine = function () {
    Transactional.predefine.call(this);
    this.Collection = getBaseClass(this).Collection.extend();
    this.Collection.prototype.model = this;
    createSharedTypeSpec(this, SharedType);
    return this;
};
Record._attribute = AggregatedType;
createSharedTypeSpec(Record, SharedType);
function getAttributes(_a) {
    var defaults = _a.defaults, attributes = _a.attributes, idAttribute = _a.idAttribute;
    var definition = typeof defaults === 'function' ? defaults() : attributes || defaults || {};
    if (idAttribute && !(idAttribute in definition)) {
        definition[idAttribute] = void 0;
    }
    return definition;
}
function defineCollection(collection) {
    if (typeof collection === 'function') {
        this.Collection = collection;
        this.Collection.prototype.model = this;
    }
    else {
        this.Collection.define(collection || {});
    }
}
Object.defineProperties(Date, {
    microsoft: {
        get: function () {
            return new ChainableAttributeSpec({
                type: Date,
                _attribute: MSDateType
            });
        }
    },
    timestamp: {
        get: function () {
            return new ChainableAttributeSpec({
                type: Date,
                _attribute: TimestampType
            });
        }
    }
});
Number.integer = function (x) { return x ? Math.round(x) : 0; };
Number.integer._attribute = NumericType;
if (typeof window !== 'undefined') {
    window.Integer = Number.integer;
}
export function createSharedTypeSpec(Constructor, Attribute) {
    Constructor.hasOwnProperty('shared') ||
        Object.defineProperty(Constructor, 'shared', {
            get: function () {
                return new ChainableAttributeSpec({
                    value: null,
                    type: Constructor,
                    _attribute: Attribute
                });
            }
        });
}
//# sourceMappingURL=index.js.map