import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
    input : 'lib/index.js',

    output : {
        file   : 'dist/index.js',
        format : 'umd',
        name   : 'Nested',
        exports: 'named',
        globals: {
            jquery: '$',
            underscore: '_'
        }
    },
    plugins: [
        resolve(), //for support of `import X from "directory"` rather than verbose `import X from "directory/index"`
        uglify()
    ],
    sourcemap: true,

    external: [
        'jquery',
        'underscore'
    ]
};