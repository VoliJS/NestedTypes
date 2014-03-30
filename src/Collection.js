define( function( require, exports, module ){
    'use strict';
    var Chaplin = require( 'chaplin' );

    var Base = Chaplin.Collection.prototype;

    function wrapCall( func ){
        return function(){
            if( !this.__changing++ ){
                this.trigger( 'before:change' );
            }

            func.apply( this, arguments );

            if( !--this.__changing ){
                this.trigger( 'after:change' );
            }
        };
    }

    module.exports = Chaplin.Collection.extend({
        triggerWhenChanged: 'change add remove reset sort',

        deepClone: function(){
            var newOne = Chaplin.Collection.prototype.clone.call( this );

            newOne.reset( this.map( function( model ){
                return model.deepClone();
            }));

            return newOne;
        },

        __changing: 0,
        set: wrapCall( Base.set ),
        remove: wrapCall( Base.remove ),
        add: wrapCall( Base.add ),
        reset: wrapCall( Base.reset ),
        sort: wrapCall( Base.sort )
    });
});