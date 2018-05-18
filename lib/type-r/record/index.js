import * as tslib_1 from "tslib";
import { Record } from './record';
import { tools, predefine } from '../object-plus';
import compile, { ChainableAttributeSpec } from './attributes';
import { Transactional } from '../transactions';
import { createSharedTypeSpec, AggregatedType, SharedType } from './attributes';
export * from './attributes';
export { Record };
var assign = tools.assign, defaults = tools.defaults, omit = tools.omit, getBaseClass = tools.getBaseClass;
Record.onExtend = function (BaseClass) {
    Transactional.onExtend.call(this, BaseClass);
    var Class = this;
    var DefaultCollection = (function (_super) {
        tslib_1.__extends(DefaultCollection, _super);
        function DefaultCollection() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DefaultCollection.model = Class;
        DefaultCollection = tslib_1.__decorate([
            predefine
        ], DefaultCollection);
        return DefaultCollection;
    }(BaseClass.Collection));
    this.DefaultCollection = DefaultCollection;
    if (Class.Collection === BaseClass.Collection) {
        this.Collection = DefaultCollection;
    }
    createSharedTypeSpec(this, SharedType);
};
Record.onDefine = function (definition, BaseClass) {
    var baseProto = BaseClass.prototype;
    var _a = compile(this.attributes = getAttributes(definition), baseProto._attributes), properties = _a.properties, _localEvents = _a._localEvents, dynamicMixin = tslib_1.__rest(_a, ["properties", "_localEvents"]);
    assign(this.prototype, dynamicMixin);
    definition.properties = defaults(definition.properties || {}, properties);
    definition._localEvents = _localEvents;
    Transactional.onDefine.call(this, definition, BaseClass);
    this.DefaultCollection.define(definition.collection || {});
    this.Collection = definition.Collection;
    this.Collection.prototype.model = this;
    if (definition.endpoint)
        this.Collection.prototype._endpoint = definition.endpoint;
};
Record._attribute = AggregatedType;
createSharedTypeSpec(Record, SharedType);
function getAttributes(_a) {
    var defaults = _a.defaults, attributes = _a.attributes, idAttribute = _a.idAttribute;
    var definition = attributes || defaults || {};
    if (idAttribute && !(idAttribute in definition)) {
        definition[idAttribute] = void 0;
    }
    return definition;
}
export function attr(proto, attrName) {
    if (attrName) {
        if (typeof Reflect !== 'undefined' && Reflect.getMetadata) {
            Reflect
                .getMetadata("design:type", proto, attrName)
                .asProp(proto, attrName);
        }
        else {
            proto._log('error', 'Add import "reflect-metadata"; as the first line of your app.');
        }
    }
    else {
        return ChainableAttributeSpec.from(proto).asProp;
    }
}
export function prop(spec) {
    return spec.asProp;
}
//# sourceMappingURL=index.js.map