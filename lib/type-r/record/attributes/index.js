var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { tools as _, eventsApi } from '../../object-plus';
export * from './any';
export * from './owned';
export * from './date';
export * from './basic';
export * from './shared';
export * from './updates';
export * from './attrDef';
import { AnyType } from './any';
import { constructorsMixin } from './updates';
import { toAttributeOptions, ChainableAttributeSpec } from './attrDef';
import { CompiledReference } from '../../traversable';
export default function (attributesDefinition, baseClassAttributes) {
    var myAttributes = _.transform({}, attributesDefinition, createAttribute), allAttributes = _.defaults({}, myAttributes, baseClassAttributes);
    var ConstructorsMixin = constructorsMixin(allAttributes);
    return __assign({}, ConstructorsMixin, { _attributes: new ConstructorsMixin.AttributesCopy(allAttributes), _attributesArray: Object.keys(allAttributes).map(function (key) { return allAttributes[key]; }), properties: _.transform({}, myAttributes, function (x) { return x.createPropertyDescriptor(); }), _toJSON: createToJSON(allAttributes) }, parseMixin(allAttributes), localEventsMixin(myAttributes));
}
export function createAttribute(spec, name) {
    return AnyType.create(toAttributeOptions(spec), name);
}
function parseMixin(attributes) {
    var attrsWithParse = Object.keys(attributes).filter(function (name) { return attributes[name].parse; });
    return attrsWithParse.length ? {
        _parse: new Function('json', "\n            var _attrs = this._attributes;\n\n            " + attrsWithParse.map(function (name) { return "                \n                json." + name + " === void 0 || ( json." + name + " = _attrs." + name + ".parse.call( this, json." + name + ", \"" + name + "\" ) );\n            "; }).join('') + "\n\n            return json;\n        ")
    } : {};
}
function createToJSON(attributes) {
    return new Function("\n        var json = {},\n            v = this.attributes,\n            a = this._attributes;\n\n        " + Object.keys(attributes).map(function (key) {
        if (attributes[key].toJSON) {
            return "json." + key + " = a." + key + ".toJSON.call( this, v." + key + ", '" + key + "' );";
        }
    }).join('\n') + "\n\n        return json;\n    ");
}
export function createSharedTypeSpec(Constructor, Attribute) {
    if (!Constructor.hasOwnProperty('shared')) {
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
}
function localEventsMixin(attrSpecs) {
    var _localEvents;
    for (var key in attrSpecs) {
        var attribute = attrSpecs[key], _onChange = attribute.options._onChange;
        if (_onChange) {
            _localEvents || (_localEvents = new eventsApi.EventMap());
            _localEvents.addEvent('change:' + key, typeof _onChange === 'string' ?
                createWatcherFromRef(_onChange, key) :
                wrapWatcher(_onChange, key));
        }
    }
    return _localEvents ? { _localEvents: _localEvents } : {};
}
function wrapWatcher(watcher, key) {
    return function (record, value) {
        watcher.call(record, value, key);
    };
}
function createWatcherFromRef(ref, key) {
    var _a = new CompiledReference(ref, true), local = _a.local, resolve = _a.resolve, tail = _a.tail;
    return local ?
        function (record, value) {
            record[tail](value, key);
        } :
        function (record, value) {
            resolve(record)[tail](value, key);
        };
}
//# sourceMappingURL=index.js.map