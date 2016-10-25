var Nested = require( '../nestedtypes' ),
    expect = require( 'chai' ).expect,
    sinon = require( 'sinon' );

var Model = Nested.Model, Collection = Nested.Collection;

describe( 'Advanced functionality', function(){
    var M = Model.extend({
        attributes : {
            name : String
        }
    });

    describe( 'Model.shared attribute', function(){
        var A = Model.extend({
            attributes : {
                shared : M.shared,
                owned : M
            }
        });

        it( 'initialized with null', function(){
            var a = new A();
            expect( a.shared ).to.equal( null );
        } );

        it( "Record don't attempt to take ownership on shared attributes", function(){
            var a = new A();
            var m = new M();
            a.shared = m;
            expect( m._owner ).to.equal( void 0 );
        } );

        it( "can be assigned with owned model", function(){
            var a = new A(), b = new A();
            
            a.shared = b.owned;
            expect( a.shared._owner ).to.equal( b );            
        });

        it( "Internal changes are tracked and cause owner 'change' event.", function(){
            var a = new A(), b = new A();            
            a.shared = b.owned;

            var callback = sinon.spy();
            a.on( 'change', callback );
            b.owned.name = "Haha!";
            expect( a.shared.name ).to.equal( 'Haha!' );
            expect( callback ).to.be.calledOnce;
        } );

        it( "Can be updated in place", function(){
            var a = new A(), b = new A();            
            a.shared = b.owned;

            a.set({ shared : { name : "noway" } } );
            expect( a.shared.name ).to.equal( 'noway' );
            expect( a.shared ).to.equal( b.owned );
        } );

        it( "is converted to the ownerless model on assignment", function(){
            var a = new A();
            a.shared = { name : 'Hey' };
            expect( a.shared.name ).to.equal( 'Hey' );
            expect( a.shared._owner ).to.equal( void 0 );
        } );
        
        it( "is not serialized", function(){
            var a = new A();
            a.shared = { name : 'Hey' };
            expect( a.toJSON() ).to.eql({ owned : { name : "" }});
        });
    });

    describe( 'Collection.shared attribute', function(){
        var A = Model.extend({
            attributes : {
                sharedC : M.Collection.shared,
                ownedC : M.Collection
            }
        });

        it( 'initialized with null', function(){
            var a = new A();
            expect( a.sharedC ).to.equal( null );
        } );

        it( "Record don't attempt to take ownership on shared attributes", function(){
            var a = new A();
            var m = new M.Collection();
            a.coll = m;
            expect( m._owner ).to.equal( void 0 );
        } );

        it( "can be assigned with owned model", function(){
            var a = new A(), b = new A();
            
            a.sharedC = b.ownedC;
            expect( a.sharedC._owner ).to.equal( b );            
        });

        it( "Internal changes are tracked and cause owner 'change' event.", function(){
            var a = new A(), b = new A();            
            a.sharedC = b.ownedC;

            var callback = sinon.spy();
            a.on( 'change', callback );
            b.ownedC.add({ name : "Haha!" });
            expect( a.sharedC.first().name ).to.equal( 'Haha!' );
            b.ownedC.first().name = "1";
            expect( callback ).to.be.calledTwice;
        } );

        it( "Can be updated in place", function(){
            var a = new A(), b = new A();            
            a.sharedC = b.ownedC;

            a.set({ sharedC : [ { name : "noway" } ] } );
            expect( a.sharedC.first().name ).to.equal( 'noway' );
            expect( a.sharedC ).to.equal( b.ownedC );
        } );

        it( "is converted to the ownerless Subset collection on assignment", function(){
            var a = new A();
            a.sharedC = [{ name : 'Hey' }];
            expect( a.sharedC.first().name ).to.equal( 'Hey' );
            expect( a.sharedC._owner ).to.equal( void 0 );

            var callback = sinon.spy();
            a.on( 'change', callback );
            a.sharedC.first().name = "Haha!";
            expect( callback ).to.be.calledOnce;
        } );
        
        it( "is not serialized", function(){
            var a = new A();
            a.sharedC = [{ name : 'Hey' }];
            expect( a.toJSON() ).to.eql({ ownedC : []});
        });
    });

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
            expect( Collection.Subset.prototype ).to.equal( Collection.prototype );

            var M = Model.extend({});

            expect( M.Collection ).to.not.equal( Collection );
            expect( M.Collection.prototype ).to.be.instanceOf( Collection );
            expect( M.Collection.Subset.prototype ).to.equal( M.Collection.prototype ); 
        } );

        it( "doesn't take ownership on its elements", function(){
            var a = new A();

            a.subset.set([ { name : '1'}, { name : '2'} ]);
            a.aggregated.set( a.subset.models );
            expect( a.aggregated.first()._owner ).to.equal( a.aggregated );
        } );

        it( "doesn't merge records on set", function(){
            var a = new A();

            a.subset.set([ { id : 1, name : '1'}, { id : 2, name : '2'} ]);
            var f = a.subset.get( 1 );
            a.subset.set([ { id : 1, name : '3'}, { id : 2, name : '4'} ]);
            
            expect( a.subset.get( 1 ).name ).to.equal( '1' );                        
        });

        it( 'is not serializable', function(){
            var a = new A();
            a.aggregated = [ { name : '1' }];
            expect( a.toJSON() ).to.eql({ aggregated : [ { name : '1' }] });
        });
    });

    describe( 'Attribute .has options', function(){
        describe( '.has.changeEvents( false )', function(){
            var M = Model.extend({
                attributes : {
                    a : Model.defaults({
                        x : 1
                    }).has.changeEvents( false ),

                    b : Model.shared.changeEvents( false )
                },

                initialize(){
                    this.b = this.a;
                }
            });

            it( 'disables change events for an attribute', function(){
                var m = new M();
                var token = m._changeToken;
                m.a.x = 2;
                expect( token ).to.equal( m._changeToken ); 
            } );

            it( 'disables change events in case of nested transaction', function(){
                var m = new M();
                var token = m._changeToken;
                m.set({ a : { x : 2 } });
                expect( token ).to.equal( m._changeToken ); 
            } );
        });

    });
});
