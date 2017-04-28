"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var traversable_1 = require("../traversable");
function parseReference(collectionRef) {
    switch (typeof collectionRef) {
        case 'function':
            return function (root) { return collectionRef.call(root); };
        case 'object':
            return function () { return collectionRef; };
        case 'string':
            var resolve = new traversable_1.CompiledReference(collectionRef).resolve;
            return resolve;
    }
}
exports.parseReference = parseReference;
//# sourceMappingURL=commons.js.map