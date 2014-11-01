define( function( require, exports, module ){
    var Nested = require( 'nestedtypes' ),
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
            it( 'create new Date object on construction')
            it( 'parse ISO dates in all browsers on assignment' );
            it( 'parse integer time stamps on assignment' );
            it( 'parse MS time stamps on assignment' );
            it( 'is serialized to ISO date' );
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
                            set : function( value, options ){
                                expect( value ).to.be.a( 'number' );

                                if( !options || !options.doNothing ){
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
                    m.set( 'a', 5, { doNothing : true } );

                    expect( m.a ).to.be.equal( 0 );
                });
            });

            describe( 'toJSON hook', function(){
                it( 'override attribute\'s toJSON when root model is serialized' );
                it( 'can prevent attribute from serialization when root model is serialized' );
            });

            describe( 'parse hook', function(){
                it( 'can override attribute\'s parse' );
            });

            it( 'can disable advanced features' );
            it( 'can be expressed in full notation');
            it( 'can be chained' );
        });

    });
});
