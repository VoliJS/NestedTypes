    var Nested = require( '../nestedtypes' ),
        sinon = require( 'sinon' ),
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

        describe( 'Attributes merging', function(){
            var A = Nested.Model.extend({
                defaults : {
                    a : 1,
                    b : 2
                },

                f : function(){ return this.a + this.b; },

                properties : {
                    c : function(){ return this.a + this.b; }
                }
            });

            it( 'merges properties, which does not present in model', function(){
                var B = Nested.Model.extend({
                    defaults : {
                        a : 6,
                        _x : A.has.proxy()
                    }
                });

                var b = new B();

                expect( b.a ).to.eql( 6 );
                expect( b.b ).to.eql( 2 );
                expect( b.f() ).to.eql( 3 );
                expect( b.c ).to.eql( 3 );
            });
        });

        describe( 'Model.from reference', function(){
            var A = Nested.Model.extend({
                attributes : {
                    ref : Something.from( collection )
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

                m.set({ ref: 2 });
                expect( m.ref.name ).to.equal( "2" );
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
                        ref : Something.from( function(){ return collection; } )
                    }
                });

                var m = new A();
                m.ref = 1;
                expect( m.ref.name ).to.equal( "1" );
            });

            it( 'must return null when not resolved', function(){
                var A = Nested.Model.extend({
                    attributes : {
                        ref : Something.from( function(){ return this.__collection; } )
                    }
                });

                var m = new A();
                m.ref = 1;
                expect( m.ref ).to.be.null;

                m.__collection = collection;
                expect( m.ref.name ).to.equal( "1" );
            });
        });

        describe( 'Collection.subsetOf', function(){
            var A = Nested.Model.extend({
                attributes : {
                    refs : Something.Collection.subsetOf( collection )
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
                        refs : Something.Collection.subsetOf( function(){ return collection; } )
                    }
                });

                var m = new A();
                m.refs = [ 1 ];
                expect( m.refs.first().name ).to.equal( "1" );
            });
        });
    });

    describe( 'Nested relations', function(){
        var User = Nested.Model.extend({
            defaults : {
                name : '',
                roles : Nested.Collection.subsetOf( 'store.roles' )
            },

            collection : {
                fetch : function(){
                    this.reset([ {
                        id : 1,
                        name : 'admin',
                        roles : [ 1 ]
                    },{
                        id : 2,
                        name : 'user',
                        roles : [ 2 ]
                    }], { parse : true });

                    this.trigger( 'sync', this );
                }
            }
        });

        var Role = Nested.Model.extend({
            defaults : {
                name : '',
                users : Nested.Collection.subsetOf( 'store.users' )
            },

            collection : {
                fetch : function(){
                    this.reset([ {
                        id : 1,
                        name : 'Administrators',
                        users : [ 1 ]
                    },{
                        id : 2,
                        name : 'Users',
                        users : [ 2 ]
                    }], { parse : true });

                    this.trigger( 'sync', this );
                }
            }
        });

        it( 'can be initialized with a list of attributes', function(){
            var Store = Nested.LazyStore.defaults({
                users : User.Collection,
                roles : Role.Collection
            });

            Nested.store = new Store();
        });

        it( 'fetch everything when called without arguments', function(){
            Nested.store.fetch();
            expect( Nested.store._resolved.users ).to.be.true;
            expect( Nested.store._resolved.roles ).to.be.true;
        });

        it( 'can be prefetched', function(){
            Nested.store.users.fetch();
            expect( Nested.store._resolved.users ).to.be.true;
            expect( Nested.store.users.length ).to.equal( 2 );
        });

        it( 'fetched of the first attributes access', function(){
            var role = Nested.store.users.first().roles.first();
            expect( role.name ).to.equal( 'Administrators' );
            expect( Nested.store._resolved.roles ).to.be.true;
        });

        it( 'individual elements can be cleaned up ', function(){
            Nested.store.clear( 'users' );
            expect( Nested.store._resolved.users ).to.be.not.ok;
        });

        it( 'all cache can be cleaned up ', function(){
            Nested.store.clear();
            expect( Nested.store._resolved.users ).to.be.not.ok;
            expect( Nested.store._resolved.roles ).to.be.not.ok;
        });
    });
