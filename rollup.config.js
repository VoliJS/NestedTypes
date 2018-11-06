import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    input : 'lib/index.js',

    output : {
        file   : 'dist/index.js',
        format : 'umd',
        name   : 'Nested',
        exports: 'named',
        globals: {
            jquery: '$',
            underscore: '_',
            'type-r' : 'Nested'
        },
        sourcemap: true
    },
    plugins: [
        resolve(), //for support of `import X from "directory"` rather than verbose `import X from "directory/index"`
        sourcemaps(),
        uglify()
    ],

    external: [
        'jquery',
        'underscore',
        'type-r'
    ]
};