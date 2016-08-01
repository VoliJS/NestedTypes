module.exports = {
     entry: "./src/index",

     output : {
       filename : './nestedtypes.js',
       library : "Nested",
       libraryTarget : 'umd'
     },

     devtool : 'source-map',

     resolve : {
        modulesDirectories : [ 'node_modules', 'src' ],
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
        loaders: [
            {
                test: /\.[tj]sx?$/,
                /*exclude: /(node_modules|bower_components)/,*/
                loader: 'ts'
            }
        ],

        preLoaders : [
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    }
};
