var Model = require( './model' );

module.exports = Model.extend({
    urlRoot : '',
    url : function(){},

    save : function(){},
    destroy : function(){},
    fetch : function(){},

    collection : {
        fetch : function(){}
    }
});