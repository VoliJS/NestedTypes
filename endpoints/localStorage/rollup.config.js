import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    input : 'lib/index.js',
    external : "type-r",
    globals : {
        "type-r":"Nested"
    },

    output : {
        file   : 'dist/index.js',
        format : 'umd',
        name   : 'localStorageIO'
    },
    plugins: [
        resolve(), //for support of `import X from "directory"` rather than verbose `import X from "directory/index"`
        sourcemaps(),
        uglify()
    ],
    sourcemap: true,
};