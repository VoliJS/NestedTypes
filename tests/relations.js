define( function( require, exports, module ){
    "use strict";
    var Nested = require( '../nestedtypes' ),
        expect = require( 'chai' ).expect;

    describe( 'One-to-many and many-to-many relations', function(){
        var Something = Nested.Model.extend({
            attributes : {
                name : ''
            }
        });

        var collection = new Something.Collection([
            { id: 1, name : 1 },
            { id: 2, name : 2 },
            { id: 3, name : 3 }
        ]);

        describe( 'Model.from reference', function(){
            var A = Nested.Model.extend({
                attributes : {
                    ref : Something.From( collection )
                }
            });

            it( 'is initialized with null', function(){
                var m = new A();
                expect( m.ref ).to.be.null;
            });

            it( 'parse model id', function(){
                var m = new A({ ref : 1 });
                expect( m.ref.name ).to.equal( "1" );
            });

            it( 'can be assigned with model id', function(){
                var m = new A();
                m.ref = 1;
                expect( m.ref.name ).to.equal( "1" );
            });

            it( 'can be assigned with model', function(){
                var m = new A();
                m.ref = collection.first();
                expect( m.ref.name ).to.equal( "1" );
            });

            it( 'is serialized to model id', function(){
                var m = new A();
                m.ref = collection.first();
                var json = m.toJSON();
                expect( json.ref ).to.equal( 1 );
            });

            it( 'can use lazy reference to collection', function(){
                var A = Nested.Model.extend({
                    attributes : {
                        ref : Something.From( function(){ return collection; } )
                    }
                });

                var m = new A();
                m.ref = 1;
                expect( m.ref.name ).to.equal( "1" );
            });
        });

        describe( 'Collection.subsetOf', function(){
            var A = Nested.Model.extend({
                attributes : {
                    refs : Something.Collection.SubsetOf( collection )
                }
            });

            it( 'is initialized with empty collection', function(){
                var m = new A();
                expect( m.refs.length ).to.equal( 0 );
            });

            it( 'parse array of model ids', function(){
                var m = new A({ refs : [ 1 ] });
                expect( m.refs.first().name ).to.equal( "1" );
            });

            it( 'can be assigned with array of model ids', function(){
                var m = new A();
                m.refs = [ 1 ];
                expect( m.refs.first().name ).to.equal( "1" );
            });

            it( 'can be assigned with models array', function(){
                var m = new A();
                m.refs = [ collection.first() ];
                expect( m.refs.first().name ).to.equal( "1" );
            });

            it( 'is serialized to array of model ids', function(){
                var m = new A();
                m.refs = [ collection.first() ];
                var json = m.toJSON();
                expect( json.refs[ 0 ] ).to.equal( 1 );
            });

            it( 'can use lazy reference to collection', function(){
                var A = Nested.Model.extend({
                    attributes : {
                        refs : Something.Collection.SubsetOf( function(){ return collection; } )
                    }
                });

                var m = new A();
                m.refs = [ 1 ];
                expect( m.refs.first().name ).to.equal( "1" );
            });
        });
    });
});