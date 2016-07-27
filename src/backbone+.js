/* Backbone core extensions: bug fixes and optimizations
    - Use Object+ for all backbone objects
    - Fix for Events.listenTo to support message maps
    - optimized trigger functions

 * (c) Vlad Balin & Volicon, 2015
 * ------------------------------------------------------------- */

var Class = require( './object+' ),
    Backbone = require( './backbone' ),
    Events = require( './events-mixin' );

Backbone.Events = Events;
Object.assign( Backbone, Events );
module.exports = Backbone;

// Update Backbone objects to use event patches and Object+
[ 'Model', 'Collection', 'View', 'Router', 'History' ].forEach( function( name ){
    var Type = Backbone[ name ];
    Object.assign( Type.prototype, Events );
    Object.extend.attach( Type );
});

// Make Object.extend classes capable of sending and receiving Backbone Events...
Object.assign( Class.prototype, Events );