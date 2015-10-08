    var Nested = require( 'nestedtypes' ),
        expect = require( 'chai' ).expect,
        sinon = require( 'sinon' );

    describe( 'Basic functionality', function(){
        function canHaveNativeProperties( Type ){
            var C = Type.extend({
                something : false,

                properties : {
                    readOnly : function(){ return this.something; },
                    rw : {
                        get : function(){ return this.something; },
                        set : function( value ){
                            return this.something = value;
                        }
                    }
                }
            });

            var c = new C();
            expect( c.readOnly ).to.be.false;
            c.rw = true;
            expect( c.rw ).to.be.true;
            expect( c.readOnly ).to.be.true;
        }

        describe( 'Nested.Model', function(){
            var M = Nested.Model.extend({
                urlRoot : '/root',

                defaults : {
                    a : 'a'
                }
            });

            it( 'may use "Model.attributes" instead of "Model.defaults"', function(){
                var M = Nested.Model.extend({
                    attributes : {
                        a : 'a'
                    }
                });

                var m = new M();
                expect( m.get( 'a' ) ).to.eql( 'a' );
            });

            it( 'create native properties for every default attribute', function(){
                var m = new M();
                expect( m.a ).to.eql( 'a' );
                m.a = 'b';
                expect( m.get( 'a' ) ).to.eql( 'b' );
                expect( m.a ).to.eql( 'b' );
            });

            it( 'can have explicitly defined native properties', function(){
                canHaveNativeProperties( Nested.Model );
            });

            it( 'may turn off native properties for model\'s attributes', function(){
                var M = Nested.Model.extend({
                    attributes : {
                        a : 'a'
                    },

                    properties : false
                });

                var m = new M();

                expect( m.a ).to.be.an( 'undefined' );

            });

            it( 'inherit default attributes from the base model', function(){
                var B = M.extend({
                    defaults : {
                        b : 'b'
                    }
                });

                m = new B();
                expect( m.a ).to.eql( 'a' );
                expect( m.b ).to.eql( 'b' );
            });

            it( 'deep copy defaults JSON literals on model creation', function(){
                var A = Nested.Model.extend({
                    defaults : {
                        a : { first : [ 1 ], second : [ 2 ] }
                    }
                });

                var m = new A(),
                    n = new A();

                m.a.first.push( 2 );
                expect( m.a.first ).to.eql( [ 1, 2 ] );
                expect( n.a.first ).to.eql( [ 1 ] );
            });

            it( 'can define a tree', function(){
                var M = Nested.Model.extend();

                M.define({
                    defaults : {
                        nested : M.value( null ),
                        elements : M.Collection
                    }
                })

                var m = new M();

                m.elements.add({});

                expect( m.elements.first().elements.length ).to.be.zero;

            });

            it( 'can handle function in Model.defaults', function(){
                var M = Nested.Model.extend({
                    defaults : function(){
                        return {
                            num : 1,
                            date : new Date()
                        };
                    }
                });

                var m = new M();

                expect( m.num ).to.equal( 1 );
                expect( m.date ).to.be.instanceOf( Date );

                m.num = "2";
                expect( m.num ).to.equal( 2 );
            });
        });

        describe( 'Nested.Collection', function(){
            var M = Nested.Model.extend({
                urlRoot : '/root',

                defaults : {
                    a : 'a'
                },

                collection : {
                    initialize : function(){
                        this.b = 'b';
                    }
                }
            });

            it( 'can have explicitly defined native properties', function(){
                canHaveNativeProperties( Nested.Collection );
            });

            it( 'is automatically defined for every model', function(){
                var c = new M.Collection();
                expect( c.url ).to.eql( M.prototype.urlRoot );
                expect( c.model ).to.eql( M );
            });

            it( 'can be defined in Model.collection', function(){
                var c = new M.Collection();
                expect( c.b ).to.eql( 'b' );
            });

            it( 'inherits from the base Model.collection', function(){
                var B = M.extend({
                    urlRoot : '/myroot',
                    collection : {
                        c : 'c'
                    }
                });

                var c = new B.Collection();
                expect( c.c ).to.eql( 'c' );
                expect( c.b ).to.eql( 'b' );
                expect( c.url ).to.eql( '/myroot' );
            });

        });

        describe( 'Class type', function(){
            var C = Nested.Class.extend({
                a : 'a',
                initialize : function(){
                    this.b = 'b';
                }
            });

            it( 'has initialize method', function(){
                var c = new C();
                expect( c.a ).to.eql( 'a' );
                expect( c.b ).to.eql( 'b' );
            });

            it( 'can be extended', function(){
                var D = C.extend({
                    d : 'd'
                });

                var d = new D();

                expect( d.a ).to.eql( 'a' );
                expect( d.b ).to.eql( 'b' );
                expect( d.d ).to.eql( 'd' );
            });

            it( 'can trigger/listen to backbone events', function(){
                var C = Nested.Class.extend({
                    initialize : function(){
                        this.listenTo( this, {
                            'hello' : function(){
                                this.hello = true;
                            },

                            'a b c' : function(){
                                this.abc = true;
                            }
                        });
                    }
                });

                var c = new C();
                c.trigger( 'hello' );
                expect( c.hello ).to.be.true;
                c.trigger( 'b' );
                expect( c.abc ).to.be.true;
            });

            it( 'can have explicitly defined native properties', function(){
                canHaveNativeProperties( Nested.Class );
            });
        });
    });
