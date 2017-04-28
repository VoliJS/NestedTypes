"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var referenceMask = /\^|([^.]+)/g;
var CompiledReference = (function () {
    function CompiledReference(reference, splitTail) {
        if (splitTail === void 0) { splitTail = false; }
        var path = reference
            .match(referenceMask)
            .map(function (key) {
            if (key === '^')
                return 'getOwner()';
            if (key[0] === '~')
                return "getStore().get(\"" + key.substr(1) + "\")";
            return key;
        });
        this.tail = splitTail && path.pop();
        this.local = !path.length;
        path.unshift('self');
        this.resolve = new Function('self', "return " + path.join('.') + ";");
    }
    return CompiledReference;
}());
exports.CompiledReference = CompiledReference;
function resolveReference(root, reference, action) {
    var path = reference.match(referenceMask), skip = path.length - 1;
    var self = root;
    for (var i = 0; i < skip; i++) {
        var key = path[i];
        switch (key) {
            case '~':
                self = self.getStore();
                break;
            case '^':
                self = self.getOwner();
                break;
            default: self = self.get(key);
        }
        if (!self)
            return;
    }
    return action(self, path[skip]);
}
exports.resolveReference = resolveReference;
//# sourceMappingURL=traversable.js.map