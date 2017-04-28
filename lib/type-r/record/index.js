"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var transaction_1 = require("./transaction");
exports.Record = transaction_1.Record;
var object_plus_1 = require("../object-plus");
var define_1 = require("./define");
var typespec_1 = require("./typespec");
exports.ChainableAttributeSpec = typespec_1.ChainableAttributeSpec;
var transactions_1 = require("../transactions");
var attributes_1 = require("./attributes");
__export(require("./attributes"));
var assign = object_plus_1.tools.assign, defaults = object_plus_1.tools.defaults, omit = object_plus_1.tools.omit, getBaseClass = object_plus_1.tools.getBaseClass;
transaction_1.Record.define = function (protoProps, staticProps) {
    if (protoProps === void 0) { protoProps = {}; }
    var BaseConstructor = getBaseClass(this), baseProto = BaseConstructor.prototype, staticsDefinition = object_plus_1.tools.getChangedStatics(this, 'attributes', 'collection', 'Collection'), definition = assign(staticsDefinition, protoProps);
    if ('Collection' in this && this.Collection === void 0) {
        object_plus_1.tools.log.error("[Model Definition] " + this.prototype.getClassName() + ".Collection is undefined. It must be defined _before_ the model.", definition);
    }
    var dynamicMixin = define_1.compile(this.attributes = getAttributes(definition), baseProto._attributes);
    if (definition.properties === false) {
        dynamicMixin.properties = {};
    }
    assign(dynamicMixin.properties, protoProps.properties || {});
    assign(dynamicMixin, omit(definition, 'attributes', 'collection', 'defaults', 'properties', 'forEachAttr'));
    object_plus_1.Mixable.define.call(this, dynamicMixin, staticProps);
    defineCollection.call(this, definition.collection || definition.Collection);
    return this;
};
transaction_1.Record.predefine = function () {
    transactions_1.Transactional.predefine.call(this);
    this.Collection = getBaseClass(this).Collection.extend();
    this.Collection.prototype.model = this;
    createSharedTypeSpec(this, attributes_1.SharedType);
    return this;
};
transaction_1.Record._attribute = attributes_1.AggregatedType;
createSharedTypeSpec(transaction_1.Record, attributes_1.SharedType);
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
            return new typespec_1.ChainableAttributeSpec({
                type: Date,
                _attribute: attributes_1.MSDateType
            });
        }
    },
    timestamp: {
        get: function () {
            return new typespec_1.ChainableAttributeSpec({
                type: Date,
                _attribute: attributes_1.TimestampType
            });
        }
    }
});
Number.integer = function (x) { return x ? Math.round(x) : 0; };
Number.integer._attribute = attributes_1.NumericType;
if (typeof window !== 'undefined') {
    window.Integer = Number.integer;
}
function createSharedTypeSpec(Constructor, Attribute) {
    Constructor.hasOwnProperty('shared') ||
        Object.defineProperty(Constructor, 'shared', {
            get: function () {
                return new typespec_1.ChainableAttributeSpec({
                    value: null,
                    type: Constructor,
                    _attribute: Attribute
                });
            }
        });
}
exports.createSharedTypeSpec = createSharedTypeSpec;
//# sourceMappingURL=index.js.map