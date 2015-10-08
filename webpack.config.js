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
         'backbone' : {
           commonjs : 'backbone',
           commonjs2 : 'backbone',
           amd : 'backbone',
           root : 'Backbone'
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
