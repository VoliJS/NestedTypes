import { CompiledReference } from '../traversable';
export function parseReference(collectionRef) {
    switch (typeof collectionRef) {
        case 'function':
            return function (root) { return collectionRef.call(root); };
        case 'object':
            return function () { return collectionRef; };
        case 'string':
            var resolve = new CompiledReference(collectionRef).resolve;
            return resolve;
    }
}
//# sourceMappingURL=commons.js.map