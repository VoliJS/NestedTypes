require( 'object+' );
var _ = require( 'underscore' );

var Value = exports.ValueLink = Object.extend({
    value : void 0,

    requestChanges : function( val ){ throw new ReferenceError(); },

    set : function( val ){
        var link = this;
        return function(){ link.requestChanges( val ); }
    }
});

exports.Attr = Value.extend({
    constructor : function( model, attr ){
        this.value = model[ attr ];
        this.requestChanges = function( val ){
            model[ attr ] = val;
        }
    }
});

var Bool = exports.Bool = Value.extend({
    toggle : function(){
        var link = this;
        return function(){ link.requestChanges( !link.value ) };
    }
});

exports.AttrEql = Bool.extend({
    constructor : function( model, attr, asTrue ){
        this.value = model[ attr ] === asTrue;
        this.requestChanges = function( val ){
            model[ attr ] = val ? asTrue : null;
        }
    }
});

exports.CollectionHas = Bool.extend({
    constructor : function( collection, model ){
        this.value = Boolean( collection.get( model ) );
        this.requestChanges = function( val ){ collection.toggle( model, val ); }
    }
});

exports.ArrayAttrHas = Bool.extend({
    constructor : function( model, attr, element ){
        var current = this.value = Boolean( _.contains( model[ attr ], element ) );

        this.requestChanges = function( val ){
            if( current !== Boolean( val ) ){
                var prev = model[ attr ];
                model[ attr ] = val ? prev.concat( element ) :_.without( prev, element );
            }
        };
    }
});