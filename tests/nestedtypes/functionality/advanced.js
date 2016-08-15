var Nested = require( '../nestedtypes' ),
    expect = require( 'chai' ).expect,
    sinon = require( 'sinon' );

var Model = Nested.Model, Collection = Nested.Collection;

describe( 'Advanced functionality', function(){
    describe( 'Collection.Subset', function(){
        var M = Model.extend({
            attributes : {
                name : String
            }
        });

        var A = Model.extend({
            attributes : {
                subset : M.Collection.Subset,
                aggregated : M.Collection
            }
        });

        it( 'inherits from collection type', function(){
            expect( Collection.Subset.prototype ).to.be.instanceOf( Collection );

            var M = Model.extend({});

            expect( M.Collection ).to.not.equal( Collection );
            expect( M.Collection.prototype ).to.be.instanceOf( Collection );
            expect( M.Collection.Subset.prototype ).to.be.instanceOf( M.Collection ); 
        } );

        it( "doesn't take ownership on its elements", function(){
            var a = new A();

            a.subset.set([ { name : '1'}, { name : '2'} ]);
            a.aggregated.set( a.subset.models );
            expect( a.aggregated.first()._owner ).to.equal( a );
        } );

        it( "doesn't merge records on set", function(){
            var a = new A();

            a.subset.set([ { id : 1, name : '1'}, { id : 2, name : '2'} ]);
            var f = a.subset.get( 1 );
            a.subset.set([ { id : 1, name : '1'}, { id : 2, name : '2'} ]);
            
            expect( a.subset.get( 1 ) ).to.not.equal( f );                        
        });
    });
});
