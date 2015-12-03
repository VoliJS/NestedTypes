var Nested = require( '../nestedtypes' ),
    expect = require( 'chai' ).expect,
    sinon  = require( 'sinon' );

var Model = Nested.Model.extend({
    defaults : {
        data : ''
    },

    parse : function( d ){
        return { data : d };
    }
});

describe( 'Collections', function(){
    describe( 'Collection#constructor', function(){
        it( 'invoked wo/arguments', function(){
            var c = new Model.Collection();
            expect( c.length ).to.eql( 0 );
        });

        it( 'takes single model', function(){
            var m = new Model();
                c = new Model.Collection( m );

            expect( c.length ).to.eql( 1 );
            expect( c.first() ).to.eql( m );
        });

        it( 'takes attributes', function(){
            var c = new Model.Collection({ data : 'hi' });

            expect( c.length ).to.eql( 1 );
            expect( c.first().data ).to.eql( 'hi' );
        });

        it( 'takes an empty array', function(){
            var c = new Model.Collection( [] );
            expect( c.length ).to.eql( 0 );
        });

        it( 'takes an array of models', function(){
            var m = new Model();
            c = new Model.Collection([ m, new Model() ]);

            expect( c.length ).to.eql( 2 );
            expect( c.first() ).to.eql( m );
        });

        it( 'takes an array of attributes', function(){
            var c = new Model.Collection([{ data : '1' }, { data : '2' }]);

            expect( c.length ).to.eql( 2 );
            expect( c.first().data ).to.eql( '1' );
            expect( c.last().data ).to.eql( '2' );
        });

        it( 'parses raw data', function(){
            var c = new Model.Collection([ '1' , '2' ], { parse : true });

            expect( c.length ).to.eql( 2 );
            expect( c.first().data ).to.eql( '1' );
            expect( c.last().data ).to.eql( '2' );
        } );
    } );

    describe( 'Collection#set & Collection#reset', function(){
        it( 'sets empty collection' );
        it( 'updates collection with same data with no changes' );
        it( 'reset existing collection' );
        it( 'handles data intersection' );
        it( 'handle sorted collection' );
    } );

    describe( 'Collection#add & Collection#remove', function(){
        it( 'sets empty collection' );
        it( 'remove single element from collection' );
        it( 'add many items to collection' );
        it( 'remove many items from collection' );
        it( 'add one item to collection' );
        it( 'add one item to sorted collection' );
        it( 'add many items to sorted collection' );
        it( 'insert one item in given position' );
        it( 'insert many items in given position' )
    } );
} );