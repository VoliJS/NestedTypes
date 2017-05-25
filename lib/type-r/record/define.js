import { AnyType } from './attributes';
import { tools, eventsApi } from '../object-plus';
import { toAttributeDescriptor } from './typespec';
import { CompiledReference } from '../traversable';
var defaults = tools.defaults, isValidJSON = tools.isValidJSON, transform = tools.transform, log = tools.log, EventMap = eventsApi.EventMap;
export function compile(rawSpecs, baseAttributes) {
    var myAttributes = transform({}, rawSpecs, createAttribute), allAttributes = defaults({}, myAttributes, baseAttributes), Attributes = createCloneCtor(allAttributes), mixin = {
        Attributes: Attributes,
        _attributes: new Attributes(allAttributes),
        properties: transform({}, myAttributes, function (x) { return x.createPropertyDescriptor(); }),
        defaults: createDefaults(allAttributes),
        _toJSON: createToJSON(allAttributes),
        _localEvents: createEventMap(myAttributes),
        _keys: Object.keys(allAttributes)
    };
    var _parse = createParse(myAttributes, allAttributes);
    if (_parse) {
        mixin._parse = _parse;
    }
    if (!log.level) {
        mixin.forEachAttr = createForEach(allAttributes);
    }
    return mixin;
}
function createAttribute(spec, name) {
    return AnyType.create(toAttributeDescriptor(spec), name);
}
function createEventMap(attrSpecs) {
    var events;
    for (var key in attrSpecs) {
        var attribute = attrSpecs[key], _onChange = attribute.options._onChange;
        if (_onChange) {
            events || (events = new EventMap());
            events.addEvent('change:' + key, typeof _onChange === 'string' ?
                createWatcherFromRef(_onChange, key) :
                wrapWatcher(_onChange, key));
        }
    }
    return events;
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
export function createForEach(attrSpecs) {
    var statements = ['var v, _a=this._attributes;'];
    for (var name_1 in attrSpecs) {
        statements.push("( v = a." + name_1 + " ) === void 0 || f( v, \"" + name_1 + "\", _a." + name_1 + " );");
    }
    return new Function('a', 'f', statements.join(''));
}
export function createCloneCtor(attrSpecs) {
    var statements = [];
    for (var name_2 in attrSpecs) {
        statements.push("this." + name_2 + " = x." + name_2 + ";");
    }
    var CloneCtor = new Function("x", statements.join(''));
    CloneCtor.prototype = Object.prototype;
    return CloneCtor;
}
function createDefaults(attrSpecs) {
    var assign_f = ['var v;'], create_f = [];
    function appendExpr(name, expr) {
        assign_f.push("this." + name + " = ( v = a." + name + " ) === void 0 ? " + expr + " : v;");
        create_f.push("this." + name + " = " + expr + ";");
    }
    for (var name_3 in attrSpecs) {
        var attrSpec = attrSpecs[name_3], value = attrSpec.value, type = attrSpec.type;
        if (value === void 0 && type) {
            appendExpr(name_3, "i." + name_3 + ".create()");
        }
        else {
            if (isValidJSON(value)) {
                appendExpr(name_3, JSON.stringify(value));
            }
            else if (value === void 0) {
                appendExpr(name_3, 'void 0');
            }
            else {
                appendExpr(name_3, "i." + name_3 + ".value");
            }
        }
    }
    var CreateDefaults = new Function('i', create_f.join('')), AssignDefaults = new Function('a', 'i', assign_f.join(''));
    CreateDefaults.prototype = AssignDefaults.prototype = Object.prototype;
    return function (attrs) {
        return attrs ? new AssignDefaults(attrs, this._attributes) : new CreateDefaults(this._attributes);
    };
}
function createParse(allAttrSpecs, attrSpecs) {
    var statements = ['var a=this._attributes;'], create = false;
    for (var name_4 in allAttrSpecs) {
        var local = attrSpecs[name_4];
        if (local && local.parse)
            create = true;
        if (allAttrSpecs[name_4].parse) {
            var s = "r." + name_4 + " === void 0 ||( r." + name_4 + " = a." + name_4 + ".parse.call( this, r." + name_4 + ", \"" + name_4 + "\") );";
            statements.push(s);
        }
    }
    if (create) {
        statements.push('return r;');
        return new Function('r', statements.join(''));
    }
}
function createToJSON(attrSpecs) {
    var statements = ["var json = {},v=this.attributes,a=this._attributes;"];
    for (var key in attrSpecs) {
        var toJSON = attrSpecs[key].toJSON;
        if (toJSON) {
            statements.push("json." + key + " = a." + key + ".toJSON.call( this, v." + key + ", '" + key + "' );");
        }
    }
    statements.push("return json;");
    return new Function(statements.join(''));
}
//# sourceMappingURL=define.js.map