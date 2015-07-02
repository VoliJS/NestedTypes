var Backbone = require( './backbone+' ),
    Model    = require( './model' );

/**
 * React View Wrapper.
 *
 * Usage:
 *  var View = new Nested.ReactView( MyReactClass, {
 *      prop1 : value1,
 *      prop2 : value2,
 *      ...
 *  });
 */
module.exports = Backbone.View.extend({
    initialize : function( /* reactClass, props */ ){
        // memorise arguments to pass to React
        this._args = arguments;
    },

    // cached react element...
    element : null,

    setElement : function(){
        // new element instance needs to be created on next render...
        this.element = null;
        return Backbone.View.prototype.setElement( this, arguments );
    },

    // cached instance of react component...
    component : null,

    render : function(){
        this.element || ( this.element = React.createElement.apply( React, this._args ) );
        this.component = React.render( this.element, this.el );
    }
});