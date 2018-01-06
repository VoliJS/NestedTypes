var referenceMask = /\^|(store\.[^.]+)|([^.]+)/g;
var CompiledReference = (function () {
    function CompiledReference(reference, splitTail) {
        if (splitTail === void 0) { splitTail = false; }
        var path = reference
            .match(referenceMask)
            .map(function (key) {
            if (key === '^' || key === 'owner')
                return 'getOwner()';
            if (key[0] === '~')
                return "getStore().get(\"" + key.substr(1) + "\")";
            if (key.indexOf('store.') === 0)
                return "getStore().get(\"" + key.substr(6) + "\")";
            return key;
        });
        this.tail = splitTail && path.pop();
        this.local = !path.length;
        this.resolve = new Function('self', "\n            var v = self." + path.shift() + ";\n                           \n            " + path.map(function (x) { return "\n                v = v && v." + x + ";\n            "; }).join('') + "\n\n            return v;\n        ");
    }
    return CompiledReference;
}());
export { CompiledReference };
export function resolveReference(root, reference, action) {
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
//# sourceMappingURL=traversable.js.map