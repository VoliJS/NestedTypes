var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
import { Record } from './record';
import { tools, predefine } from '../object-plus';
import compile from './attributes';
import { Transactional } from '../transactions';
import { ChainableAttributeSpec, createSharedTypeSpec, AggregatedType, SharedType } from './attributes';
export * from './attributes';
export { Record, ChainableAttributeSpec };
var assign = tools.assign, defaults = tools.defaults, omit = tools.omit, getBaseClass = tools.getBaseClass;
Record.onExtend = function (BaseClass) {
    Transactional.onExtend.call(this, BaseClass);
    var Class = this;
    var DefaultCollection = (function (_super) {
        __extends(DefaultCollection, _super);
        function DefaultCollection() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return DefaultCollection;
    }(BaseClass.Collection));
    DefaultCollection.model = Class;
    DefaultCollection = __decorate([
        predefine
    ], DefaultCollection);
    this.DefaultCollection = DefaultCollection;
    if (Class.Collection === BaseClass.Collection) {
        this.Collection = DefaultCollection;
    }
    createSharedTypeSpec(this, SharedType);
};
Record.onDefine = function (definition, BaseClass) {
    var baseProto = BaseClass.prototype;
    var _a = compile(this.attributes = getAttributes(definition), baseProto._attributes), properties = _a.properties, _localEvents = _a._localEvents, dynamicMixin = __rest(_a, ["properties", "_localEvents"]);
    assign(this.prototype, dynamicMixin);
    definition.properties = defaults(definition.properties || {}, properties);
    definition._localEvents = _localEvents;
    Transactional.onDefine.call(this, definition, BaseClass);
    this.DefaultCollection.define(definition.collection || {});
    this.Collection = definition.Collection;
    this.Collection.prototype.model = this;
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
        return proto.asProp;
    }
}
export function prop(spec) {
    return spec.asProp;
}
//# sourceMappingURL=index.js.map