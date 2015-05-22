define( function( require, exports, module ){
    var Nested = require( 'nestedtypes' ),
        Backbone = require( 'backbone' ),
        expect = require( 'chai' ).expect;

    describe( 'Type specs', function(){
        describe( 'Constructor type spec', function(){
            var Ctor = Nested.Class.extend({
                a : 1,

                initialize : function( a ){
                    a === undefined || ( this.a = a );
                },

                toJSON : function(){
                    return this.a;
                }
            });

            var A = Nested.Model.extend({
                defaults : {
                    a : Ctor
                }
            });

            describe( 'Model creation', function(){
                it( 'automatically creates new object', function(){
                    var m = new A();
                    expect( m.a ).to.be.instanceOf( Ctor );
                    expect( m.a.a ).to.eql( 1 );
                });

                it( 'pass value to the constructor on creation ', function(){
                    var m = new A({ a : 3 });
                    expect( m.a ).to.be.instanceOf( Ctor );
                    expect( m.a.a ).to.eql( 3 );
                });

                it( 'may have default value', function(){
                    var A = Nested.Model.extend({
                        defaults : {
                            a : Ctor.value( 3 )
                        }
                    });

                    var m = new A();
                    expect( m.a ).to.be.instanceOf( Ctor );
                    expect( m.a.a ).to.eql( 3 );
                });

                it( 'may have default value of null', function(){
                    var A = Nested.Model.extend({
                        defaults : {
                            a : Ctor.value( null )
                        }
                    });

                    var m = new A();
                    expect( m.a ).to.be.null;
                });
            });

            describe( 'Attribute assignment', function(){
                it( 'replace value if assigned with defined type', function(){
                    var m = new A();

                    m.a = new Ctor( 5 );

                    expect( m.a ).to.be.instanceOf( Ctor );
                    expect( m.a.a ).to.eql( 5 );
                });

                it( 'convert value to defined type on assignment', function(){
                    var m = new A();

                    m.a = 5;

                    expect( m.a ).to.be.instanceOf( Ctor );
                    expect( m.a.a ).to.eql( 5 );
                });

                it( 'may set attribute with null', function(){
                    var m = new A();

                    m.a = null;

                    expect( m.a ).to.be.null;
                });
            });

            describe( 'Serialization and parsing', function(){
                it( 'serialize attribute to JSON', function(){
                    var m = new A(),
                        json = m.toJSON();

                    expect( json.a ).to.eql( 1 );
                });

                it( 'set attribute on model set', function(){
                    var m = new A();

                    m.set({ a : 5 });

                    expect( m.a ).to.be.instanceOf( Ctor );
                    expect( m.a.a ).to.eql( 5 );
                });
            });
        });

        describe( 'Array type', function(){
            var M = Nested.Model.extend({
                defaults : {
                    arr : Array
                }
            });

            it( 'creates an empty array by default', function(){
                var m = new M();
                expect( m.arr ).to.be.instanceOf( Array );
                expect( m.arr.length ).to.be.equal( 0 );
            });

            it( 'wrap non-array value in array on assignment', function(){
                var m = new M();
                m.arr = 1;

                expect( m.arr ).to.be.instanceOf( Array );
                expect( m.arr[ 0 ] ).to.be.equal( 1 );
            });
        });

        describe( 'Primitive types (Number, Integer, Boolean, String)', function(){
            var A = Nested.Model.extend({
                defaults : {
                    num : Number,
                    str : String,
                    bool : Boolean,
                    int : Integer
                }
            });

            it( 'initialized with primitive types', function(){
                var m = new A();

                expect( m.num ).to.be.a( 'number' ).and.equal( 0 );
                expect( m.int ).to.be.a( 'number' ).and.equal( 0 );
                expect( m.str ).to.be.a( 'string' ).and.equal( "" );
                expect( m.bool ).to.be.a( 'boolean' ).and.equal( false );
            });

            it( 'converted to defined types on assignments', function(){
                var m = new A();

                m.num = "25.5";
                expect( m.num ).to.be.a( 'number' ).and.equal( 25.5 );

                m.str = 32;
                expect( m.str ).to.be.a( 'string' ).and.equal( "32" );

                m.bool = "5";
                expect( m.bool ).to.be.a( 'boolean' ).and.equal( true );

                m.int = 25.7;
                expect( m.int ).to.be.a( 'number' ).and.equal( 26 );

                m.int = "25.7";
                expect( m.int ).to.be.a( 'number' ).and.equal( 26 );
            });

            it( 'can be set with null', function(){
                var m = new A();

                m.num = null;
                expect( m.num ).to.be.null;

                m.str = null;
                expect( m.str ).to.be.null;

                m.bool = null;
                expect( m.bool ).to.be.null;

                m.int = null;
                expect( m.int ).to.be.null;
            });

            it( 'inferred from default values (except Integer)', function(){
                var A = Nested.Model.extend({
                    defaults : {
                        num : 1,
                        str : 'str',
                        bool : true
                    }
                });

                var m = new A();
                expect( m.num ).to.be.a( 'number' ).and.equal( 1 );
                expect( m.str ).to.be.a( 'string' ).and.equal( "str" );
                expect( m.bool ).to.be.a( 'boolean' ).and.equal( true );
            });
        });

        describe( 'Date type', function(){
            var user, User = Nested.Model.extend({
                attributes:{
                    created: Date,
                    name: String,
                    loginCount: Integer
                }
            });

            before( function(){
                user = new User();
            });

            it( 'create new Date object on construction', function(){
                expect( user.created ).to.be.instanceOf( Date );
            });

            it( 'parse ISO dates in all browsers on assignment', function(){
                // parse Date from string
                user.created = "2012-12-12T10:00";
                user.created.should.be.instanceof( Date );
                user.created.toISOString().should.be.eql( '2012-12-12T10:00:00.000Z' );
            });

            it( 'parse integer time stamps on assignment', function(){
                // parse Date from timestamp
                user.created = 1234567890123;
                user.created.should.be.instanceof( Date );
                user.created.toISOString().should.be.eql( '2009-02-13T23:31:30.123Z' );
            });

            it( 'parse MS time stamps on assignment', function(){
                user.created = "/Date(1234567890123)/";
                user.created.should.be.instanceof( Date );
                user.created.toISOString().should.be.eql( '2009-02-13T23:31:30.123Z' );
            });

            it( 'is serialized to ISO date', function(){
                var json = user.toJSON();
                json.created.should.be.eql( '2009-02-13T23:31:30.123Z' );
            } );
        });

        describe( 'Attribute options', function(){
            describe( 'get hook', function(){
                var A = Nested.Model.extend({
                    defaults : {
                        a : Number.options({
                            get : function( value ){
                                return value * 2;
                            }
                        })
                    }
                });

                var m = new A();
                m.a = 1;

                it( 'may modify returned attribute\'s value', function(){
                    expect( m.a ).to.be.equal( 2 );
                });

                it( 'is called from model.get', function(){
                    expect( m.get( 'a' ) ).to.be.equal( 2 );
                });
            });

            describe( 'set hook', function(){
                var A = Nested.Model.extend({
                    defaults : {
                        a : Number.options({
                            value : 33,
                            set : function( value, options ){
                                expect( value ).to.be.a( 'number' );

                                if( value !== 0 ){
                                    return value * 2;
                                }
                            }
                        })
                    }
                });

                it( 'may modify value assigned to attribute\'s', function(){
                    var m = new A();
                    m.a = 1;

                    expect( m.a ).to.be.equal( 2 );
                });

                it( 'is called from model.set', function(){
                    var m = new A();
                    m.set( 'a', 1 );

                    expect( m.a ).to.be.equal( 2 );

                    m.set( { a : 3 } );

                    expect( m.a ).to.be.equal( 6 );
                });

                it( 'is called after type cast', function(){
                    var m = new A();
                    m.a = "1";

                    expect( m.a ).to.be.equal( 2 );
                });

                it( 'may prevent attribute\'s assignment', function(){
                    var m = new A();
                    m.set( 'a', 0 );

                    expect( m.a ).to.be.equal( 66 );
                });
            });

            describe( 'toJSON hook', function(){
                it( 'override attribute\'s toJSON', function(){
                    var A = Nested.Model.extend({
                        defaults : {
                            a : Date.options({
                                toJSON : function( date ){
                                    return date.getTime();
                                }
                            })
                        }
                    });

                    var m = new A(),
                        json = m.toJSON();

                    expect( json.a ).to.be.a( 'number' );
                });

                it( 'can prevent attribute from serialization', function(){
                    var A = Nested.Model.extend({
                        defaults : {
                            a : Date.options({ toJSON : false }),
                            b : true
                        }
                    });

                    var m = new A(),
                        json = m.toJSON();

                    expect( json.a ).to.not.exist;
                    expect( json.b ).to.be.true;
                });
            });

            describe( 'parse hook', function(){
                it( 'can override attribute\'s parse', function(){
                    var A = Nested.Model.extend({
                        defaults : {
                            a : Nested.options({
                                parse : function( x ){ return "Hello " + x; }
                            })
                        }
                    });

                    var m = new A();
                    m.set( m.parse({ a : 'Vlad' }) );
                    expect( m.a ).to.equal( 'Hello Vlad' );
                });
            });

            it( 'can define untyped attribute', function(){
                var A = Nested.Model.extend({
                    defaults : {
                        a : Nested.value( 1 )
                    }
                });

                var m = new A();
                expect( m.a ).to.equal( 1 );
                m.a = "1";
                expect( m.a ).to.equal( "1" );
            });
        });

    });
});
