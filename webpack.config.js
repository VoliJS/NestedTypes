module.exports = {
     entry: "./src/main",

     output : {
       filename : './nestedtypes.js',
       library : "Nested",
       libraryTarget : 'umd'
     },

     devtool : 'source-map',

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
     ]
};
