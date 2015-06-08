(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require('underscore'), require('backbone'));
    }
    else if(typeof define === 'function' && define.amd) {
        define(['underscore', 'backbone'], factory);
    }
    else {
        root.Nested = factory(root._, root.Backbone);
    }
}(this, function( _, Backbone ) {
    var require = function(name) {
        return { underscore: _, backbone : Backbone }[name];
    };
