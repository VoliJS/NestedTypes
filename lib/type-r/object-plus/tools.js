export function defaults(dest, source) {
    for (var name in source) {
        if (source.hasOwnProperty(name) && !dest.hasOwnProperty(name)) {
            dest[name] = source[name];
        }
    }
    if (arguments.length > 2) {
        for (var i = 2; i < arguments.length; i++) {
            var other = arguments[i];
            other && defaults(dest, other);
        }
    }
    return dest;
}
var levelToNumber = {
    none: 0, error: 1, warn: 2, info: 3, log: 4, debug: 5
};
export var log = function (a_level, a_msg, a_props) {
    var levelAsNumber = levelToNumber[a_level], msg, props, level;
    if (levelAsNumber === void 0 && !a_props) {
        levelAsNumber = 4;
        msg = a_level;
        props = a_msg;
        level = 'log';
    }
    else {
        msg = a_msg, level = a_level, props = a_props;
    }
    if (levelAsNumber <= log.level) {
        if (levelAsNumber <= log.throw || !log.logger) {
            var error = new Error(msg);
            error.props = props;
            throw error;
        }
        else {
            log.logger(level, msg, props);
            if (levelAsNumber <= log.stop) {
                debugger;
            }
        }
    }
};
log.level = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production' ? 1 : 2;
log.throw = 0;
log.stop = 0;
var toString = typeof window === 'undefined' ?
    function toString(something) {
        if (something && typeof something === 'object') {
            var value = something.__inner_state__ || something, isTransactional = Boolean(something.__inner_state__), isArray = Array.isArray(value);
            var keys_1 = Object.keys(value).join(', '), body = isArray ? "[ length = " + value.length + " ]" : "{ " + keys_1 + " }";
            return something.constructor.name + ' ' + body;
        }
        return something;
    } : function toString(x) { return x; };
if (typeof console !== 'undefined') {
    log.logger = function _console(level, error, props) {
        var args = [error];
        for (var name_1 in props) {
            args.push("\n\t" + name_1 + ":", toString(props[name_1]));
        }
        console[level].apply(console, args);
    };
}
export function isValidJSON(value) {
    if (value === null) {
        return true;
    }
    switch (typeof value) {
        case 'number':
        case 'string':
        case 'boolean':
            return true;
        case 'object':
            var proto = Object.getPrototypeOf(value);
            if (proto === Object.prototype || proto === Array.prototype) {
                return every(value, isValidJSON);
            }
    }
    return false;
}
export function getBaseClass(Class) {
    return Object.getPrototypeOf(Class.prototype).constructor;
}
export function assignToClassProto(Class, definition) {
    var names = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        names[_i - 2] = arguments[_i];
    }
    for (var _a = 0, names_1 = names; _a < names_1.length; _a++) {
        var name_2 = names_1[_a];
        var value = definition[name_2];
        value === void 0 || (Class.prototype[name_2] = value);
    }
}
export function isEmpty(obj) {
    if (obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
    }
    return true;
}
function someArray(arr, fun) {
    var result;
    for (var i = 0; i < arr.length; i++) {
        if (result = fun(arr[i], i)) {
            return result;
        }
    }
}
function someObject(obj, fun) {
    var result;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (result = fun(obj[key], key)) {
                return result;
            }
        }
    }
}
export function some(obj, fun) {
    if (Object.getPrototypeOf(obj) === ArrayProto) {
        return someArray(obj, fun);
    }
    else {
        return someObject(obj, fun);
    }
}
export function every(obj, predicate) {
    return !some(obj, function (x) { return !predicate(x); });
}
export function getPropertyDescriptor(obj, prop) {
    var desc;
    for (var proto = obj; !desc && proto; proto = Object.getPrototypeOf(proto)) {
        desc = Object.getOwnPropertyDescriptor(proto, prop);
    }
    return desc;
}
export function omit(source) {
    var dest = {}, discard = {};
    for (var i = 1; i < arguments.length; i++) {
        discard[arguments[i]] = true;
    }
    for (var name in source) {
        if (!discard.hasOwnProperty(name) && source.hasOwnProperty(name)) {
            dest[name] = source[name];
        }
    }
    return dest;
}
export function transform(dest, source, fun) {
    for (var name in source) {
        if (source.hasOwnProperty(name)) {
            var value = fun(source[name], name);
            value === void 0 || (dest[name] = value);
        }
    }
    return dest;
}
export function fastAssign(dest, source) {
    for (var name in source) {
        dest[name] = source[name];
    }
    return dest;
}
export function fastDefaults(dest, source) {
    for (var name in source) {
        if (dest[name] === void 0) {
            dest[name] = source[name];
        }
    }
    return dest;
}
export function assign(dest, source) {
    for (var name in source) {
        if (source.hasOwnProperty(name)) {
            dest[name] = source[name];
        }
    }
    if (arguments.length > 2) {
        for (var i = 2; i < arguments.length; i++) {
            var other = arguments[i];
            other && assign(dest, other);
        }
    }
    return dest;
}
export function keys(o) {
    return o ? Object.keys(o) : [];
}
export function once(func) {
    var memo, first = true;
    return function () {
        if (first) {
            first = false;
            memo = func.apply(this, arguments);
            func = null;
        }
        return memo;
    };
}
var ArrayProto = Array.prototype, DateProto = Date.prototype, ObjectProto = Object.prototype;
export function notEqual(a, b) {
    if (a === b)
        return false;
    if (a && b && typeof a == 'object' && typeof b == 'object') {
        var protoA = Object.getPrototypeOf(a);
        if (protoA !== Object.getPrototypeOf(b))
            return true;
        switch (protoA) {
            case DateProto: return +a !== +b;
            case ArrayProto: return arraysNotEqual(a, b);
            case ObjectProto:
            case null:
                return objectsNotEqual(a, b);
        }
    }
    return true;
}
function objectsNotEqual(a, b) {
    var keysA = Object.keys(a);
    if (keysA.length !== Object.keys(b).length)
        return true;
    for (var i = 0; i < keysA.length; i++) {
        var key = keysA[i];
        if (!b.hasOwnProperty(key) || notEqual(a[key], b[key])) {
            return true;
        }
    }
    return false;
}
function arraysNotEqual(a, b) {
    if (a.length !== b.length)
        return true;
    for (var i = 0; i < a.length; i++) {
        if (notEqual(a[i], b[i]))
            return true;
    }
    return false;
}
var HashProto = Object.create(null);
HashProto.hasOwnProperty = ObjectProto.hasOwnProperty;
export function hashMap(obj) {
    var hash = Object.create(HashProto);
    return obj ? assign(hash, obj) : hash;
}
//# sourceMappingURL=tools.js.map