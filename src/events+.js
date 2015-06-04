/* Backbone.Events extensions: bug fixes and optimizations
 * (c) Vlad Balin & Volicon, 2015
 * ------------------------------------------------------------- */

var Backbone = require( 'backbone' ),
    Events = Backbone.Events;

// Workaround for backbone 1.2.0 listenTo event maps bug
var bbListenTo = Events.listenTo;

Events.listenTo = function( obj, events ){
    if( typeof events === 'object' ){
        for( var event in events ) bbListenTo.call( this, obj, event, events[ event ] );
        return this;
    }

    return bbListenTo.apply( this, arguments );
};

[ 'Model', 'View', 'Collection' ].forEach( function( type ){
    Backbone[ type ].prototype.listenTo = Events.listenTo;
});

// So hard to believe :) You won't. Optimized JIT-friendly event trigger functions to be used from model.set
// Two specialized functions for event triggering...
Events.trigger2 = function( self, name, a, b ){
    var _events = self._events;
    if( _events ){
        _fireEvent2( _events[ name ], a, b );
        _fireEvent3( _events.all, name, a, b );
    }
};

Events.trigger3 = function( self, name, a, b, c ){
    var _events = self._events;
    if( _events ){
        _fireEvent3( _events[ name ], a, b, c );
        _fireEvent4( _events.all, name, a, b, c );
    }
};

// ...and specialized functions with triggering loops. Crappy JS JIT loves these small functions and code duplication.
function _fireEvent2( events, a, b ){
    if( events )
        for( var i = 0, l = events.length, ev; i < l; i ++ )
            (ev = events[i]).callback.call(ev.ctx, a, b);
}

function _fireEvent3( events, a, b, c ){
    if( events )
        for( var i = 0, l = events.length, ev; i < l; i ++ )
            (ev = events[i]).callback.call(ev.ctx, a, b, c);
}

function _fireEvent4( events, a, b, c, d ){
    if( events )
        for( var i = 0, l = events.length, ev; i < l; i ++ )
            (ev = events[i]).callback.call(ev.ctx, a, b, c, d);
}

module.exports = Events;