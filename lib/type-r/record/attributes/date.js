import * as tslib_1 from "tslib";
import { AnyType } from './any';
import { ChainableAttributeSpec } from './attrDef';
var DateProto = Date.prototype;
var DateType = (function (_super) {
    tslib_1.__extends(DateType, _super);
    function DateType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DateType.prototype.create = function () {
        return new Date();
    };
    DateType.prototype.convert = function (next, a, record) {
        if (next == null || next instanceof Date)
            return next;
        var date = new Date(next), timestamp = date.getTime();
        if (timestamp !== timestamp) {
            this._log('warn', 'assigned with Invalid Date', next, record);
        }
        return date;
    };
    DateType.prototype.validate = function (model, value, name) {
        if (value != null) {
            var timestamp = value.getTime();
            if (timestamp !== timestamp)
                return name + ' is Invalid Date';
        }
    };
    DateType.prototype.toJSON = function (value) { return value && value.toISOString(); };
    DateType.prototype.isChanged = function (a, b) { return (a && a.getTime()) !== (b && b.getTime()); };
    DateType.prototype.doInit = function (value, record, options) {
        return this.transform(value === void 0 ? this.defaultValue() : value, void 0, record, options);
    };
    DateType.prototype.doUpdate = function (value, record, options, nested) {
        var name = this.name, attributes = record.attributes, prev = attributes[name];
        return this.isChanged(prev, attributes[name] = this.transform(value, prev, record, options));
    };
    DateType.prototype.clone = function (value) { return value && new Date(value.getTime()); };
    DateType.prototype.dispose = function () { };
    return DateType;
}(AnyType));
export { DateType };
Date._attribute = DateType;
var msDatePattern = /\/Date\(([0-9]+)\)\//;
var MSDateType = (function (_super) {
    tslib_1.__extends(MSDateType, _super);
    function MSDateType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MSDateType.prototype.convert = function (next) {
        if (typeof next === 'string') {
            var msDate = msDatePattern.exec(next);
            if (msDate) {
                return new Date(Number(msDate[1]));
            }
        }
        return DateType.prototype.convert.apply(this, arguments);
    };
    MSDateType.prototype.toJSON = function (value) { return value && "/Date(" + value.getTime() + ")/"; };
    return MSDateType;
}(DateType));
export { MSDateType };
var TimestampType = (function (_super) {
    tslib_1.__extends(TimestampType, _super);
    function TimestampType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TimestampType.prototype.toJSON = function (value) { return value && value.getTime(); };
    return TimestampType;
}(DateType));
export { TimestampType };
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
function supportsDate(date) {
    return !isNaN((new Date(date)).getTime());
}
if (!supportsDate('2011-11-29T15:52:30.5') ||
    !supportsDate('2011-11-29T15:52:30.52') ||
    !supportsDate('2011-11-29T15:52:18.867') ||
    !supportsDate('2011-11-29T15:52:18.867Z') ||
    !supportsDate('2011-11-29T15:52:18.867-03:30')) {
    DateType.prototype.convert = function (value) {
        return value == null || value instanceof Date ? value : new Date(safeParseDate(value));
    };
}
var numericKeys = [1, 4, 5, 6, 7, 10, 11], isoDatePattern = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;
function safeParseDate(date) {
    var timestamp, struct, minutesOffset = 0;
    if ((struct = isoDatePattern.exec(date))) {
        for (var i = 0, k; (k = numericKeys[i]); ++i) {
            struct[k] = +struct[k] || 0;
        }
        struct[2] = (+struct[2] || 1) - 1;
        struct[3] = +struct[3] || 1;
        if (struct[8] !== 'Z' && struct[9] !== undefined) {
            minutesOffset = struct[10] * 60 + struct[11];
            if (struct[9] === '+') {
                minutesOffset = 0 - minutesOffset;
            }
        }
        timestamp =
            Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
    }
    else {
        timestamp = Date.parse(date);
    }
    return timestamp;
}
//# sourceMappingURL=date.js.map