import * as _ from 'underscore';
import { Model } from 'type-r';
export var ModelMixin = {
    pick: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return _.pick(this, args);
    },
    values: function () {
        var _this = this;
        return this.keys().map(function (name) { return _this[name]; });
    },
    each: Model.prototype.forEach,
    escape: function (attr) {
        return _.escape(this[attr]);
    },
    matches: function (attrs) {
        return !!_.iteratee(attrs, this)(this);
    },
    omit: function () {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        return this.mapObject(function (value, key) {
            if (keys.indexOf(key) < 0) {
                return value;
            }
        });
    },
    invert: function () {
        var inverted = {};
        this.each(function (value, key) { return inverted[value] = key; });
        return inverted;
    },
    pairs: function () {
        return this.map(function (value, key) { return [key, value]; });
    },
    isEmpty: function () {
        return !this.values().length;
    },
    chain: function () {
        return _.chain(this.mapObject(function (x) { return x; }));
    }
};
export var CollectionMixin = {
    where: function (attrs, first) {
        return this[first ? 'find' : 'filter'](attrs);
    },
    findWhere: function (attrs) {
        return this.where(attrs, true);
    }
};
addUnderscoreMethods(CollectionMixin, 'models', {
    forEach: 3, each: 3, map: 3, collect: 3, reduce: 4,
    foldl: 4, inject: 4, reduceRight: 4, foldr: 4, find: 3, findIndex: 3, findLastIndex: 3, detect: 3, filter: 3,
    select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
    contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
    head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
    without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
    isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
    sortBy: 3, indexBy: 3
});
function addUnderscoreMethods(Mixin, attribute, methods) {
    _.each(methods, function (length, method) {
        if (_[method])
            Mixin[method] = addMethod(length, method, attribute);
    });
}
function addMethod(length, method, attribute) {
    switch (length) {
        case 1: return function () {
            return _[method](this[attribute]);
        };
        case 2: return function (value) {
            return _[method](this[attribute], value);
        };
        case 3: return function (iteratee, context) {
            var value = this[attribute], callback = cb(iteratee, this);
            return arguments.length > 1 ?
                _[method](value, callback, context)
                : _[method](value, callback);
        };
        case 4: return function (iteratee, defaultVal, context) {
            var value = this[attribute], callback = cb(iteratee, this);
            return arguments.length > 1 ?
                _[method](value, callback, defaultVal, context)
                : _[method](value, callback);
        };
        default: return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            args.unshift(this[attribute]);
            return _[method].apply(_, args);
        };
    }
}
function cb(iteratee, instance) {
    switch (typeof iteratee) {
        case 'function': return iteratee;
        case 'string': return function (model) { return model.get(iteratee); };
        case 'object':
            if (!(iteratee instanceof instance.model))
                return _.matches(iteratee);
    }
    return iteratee;
}
//# sourceMappingURL=underscore-mixin.js.map