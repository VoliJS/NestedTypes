module.exports = {
     entry: "./lib/index.js",

     output : {
       filename : './dist/index.js',
       library : "Nested",
       libraryTarget : 'umd'
     },

     devtool : 'source-map',

     resolve : {
        modules : [ 'node_modules', 'src' ],
        extensions : [ '.ts', '.js' ] 
     },

     externals : [
       {
         'jquery' : {
           commonjs : 'jquery',
           commonjs2 : 'jquery',
           amd : 'jquery',
           root : '$'
         },

         'underscore' : {
           commonjs : 'underscore',
           commonjs2 : 'underscore',
           amd : 'underscore',
           root : '_'
         }
       }
     ],

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'ts-loader'
            },
            {
                enforce : "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ],
    }
};
