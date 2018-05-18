import * as tslib_1 from "tslib";
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
import { ChainableAttributeSpec } from './attrDef';
import { CompiledReference } from '../../traversable';
export default function (attributesDefinition, baseClassAttributes) {
    var myAttributes = _.transform({}, attributesDefinition, createAttribute), allAttributes = _.defaults({}, myAttributes, baseClassAttributes);
    var ConstructorsMixin = constructorsMixin(allAttributes);
    return tslib_1.__assign({}, ConstructorsMixin, { _attributes: new ConstructorsMixin.AttributesCopy(allAttributes), _attributesArray: Object.keys(allAttributes).map(function (key) { return allAttributes[key]; }), properties: _.transform({}, myAttributes, function (x) { return x.createPropertyDescriptor(); }) }, localEventsMixin(myAttributes), { _endpoints: _.transform({}, allAttributes, function (attrDef) { return attrDef.options.endpoint; }) });
}
export function createAttribute(spec, name) {
    return AnyType.create(ChainableAttributeSpec.from(spec).options, name);
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