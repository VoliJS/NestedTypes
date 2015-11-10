require( './object+' );
var _ = require( 'underscore' );

var Value = exports.ValueLink = Object.extend({
    value : void 0,
    requestChanges : function( val ){ throw new ReferenceError(); },

    set : function( val ){ this.requestChanges( val ); },
    fset : function( val ){
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
    },

    // for array links
    lhas : function( value ){
        return new ArrayHas( this, value );
    },

    leql : function( value ){
        return new ValueEql( this, value );
    }
});

var BoolLink = exports.BoolLink = Value.extend({
    toggle : function(){ this.requestChanges( !this.value ); },

    ftoggle : function(){
        var link = this;
        return function(){ link.requestChanges( !link.value ) };
    }
});

var ValueEql = exports.ValueEql = BoolLink.extend({
    constructor : function( link, asTrue ){
        this.value = link.value === asTrue;
        this.requestChanges = function( val ){
            link.requestChanges( val ? asTrue : null );
        }
    }
});

var ArrayHas = exports.ArrayHas = BoolLink.extend({
    constructor : function( link, element ){
        var value = Boolean( _.contains( link.value, element ) );
        this.value = value;

        this.requestChanges = function( next ){
            if( value !== Boolean( next ) ){
                var prev = link.value;
                link.requestChanges( next ? prev.concat( element ) :_.without( prev, element ) );
            }
        };
    }
});

exports.AttrEql = BoolLink.extend({
    constructor : function( model, attr, asTrue ){
        this.value = model[ attr ] === asTrue;
        this.requestChanges = function( val ){
            model[ attr ] = val ? asTrue : null;
        }
    }
});

exports.CollectionHas = BoolLink.extend({
    constructor : function( collection, model ){
        this.value = Boolean( collection.get( model ) );
        this.requestChanges = function( val ){ collection.toggle( model, val ); }
    }
});

exports.ArrayAttrHas = BoolLink.extend({
    constructor : function( model, attr, element ){
        var value = Boolean( _.contains( model[ attr ], element ) );
        this.value = value;

        this.requestChanges = function( next ){
            if( value !== Boolean( next ) ){
                var prev = model[ attr ];
                model[ attr ] = next ? prev.concat( element ) :_.without( prev, element );
            }
        };
    }
});