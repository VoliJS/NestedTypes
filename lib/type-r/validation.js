var ValidationError = (function () {
    function ValidationError(obj) {
        this.length = obj._validateNested(this.nested = {});
        if (this.error = obj.validate(obj)) {
            this.length++;
        }
    }
    ValidationError.prototype.each = function (iteratee) {
        var _a = this, error = _a.error, nested = _a.nested;
        if (error)
            iteratee(error, null);
        for (var key in nested) {
            iteratee(nested[key], key);
        }
    };
    ValidationError.prototype.eachError = function (iteratee, object) {
        this.each(function (value, key) {
            if (value instanceof ValidationError) {
                value.eachError(iteratee, object.get(key));
            }
            else {
                iteratee(value, key, object);
            }
        });
    };
    return ValidationError;
}());
export { ValidationError };
//# sourceMappingURL=validation.js.map