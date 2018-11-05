import * as tslib_1 from "tslib";
import { eventsApi, tools as _ } from '../object-plus';
import { CompiledReference } from '../traversable';
import { ChainableAttributeSpec } from './attrDef';
import { AnyType } from './metatypes';
import { constructorsMixin } from './updates';
export function createAttribute(spec, name) {
    return AnyType.create(ChainableAttributeSpec.from(spec).options, name);
}
export function createAttributesMixin(attributesDefinition, baseClassAttributes) {
    var myAttributes = _.transform({}, attributesDefinition, createAttribute), allAttributes = _.defaults({}, myAttributes, baseClassAttributes);
    var ConstructorsMixin = constructorsMixin(allAttributes);
    return tslib_1.__assign({}, ConstructorsMixin, { _attributes: new ConstructorsMixin.AttributesCopy(allAttributes), _attributesArray: Object.keys(allAttributes).map(function (key) { return allAttributes[key]; }), properties: _.transform({}, myAttributes, function (x) { return x.createPropertyDescriptor(); }) }, localEventsMixin(myAttributes), { _endpoints: _.transform({}, allAttributes, function (attrDef) { return attrDef.options.endpoint; }) });
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
//# sourceMappingURL=mixin.js.map