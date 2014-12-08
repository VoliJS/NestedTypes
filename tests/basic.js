define( function( require, exports, module ){
    var Nested = require( '../nestedtypes' ),
        expect = require( 'chai' ).expect;

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
            c.readOnly.should.be.false;
            c.rw = true;
            c.rw.should.be.true;
            c.readOnly.should.be.true;
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
                m.get( 'a' ).should.eql( 'a' );
            });

            it( 'create native properties for every default attribute', function(){
                var m = new M();
                m.a.should.eql( 'a' );
                m.a = 'b';
                m.get( 'a' ).should.eql( 'b' );
                m.a.should.eql( 'b' );
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
                m.a.should.eql( 'a' );
                m.b.should.eql( 'b' );
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
                m.a.first.should.eql( [ 1, 2 ] );
                n.a.first.should.eql( [ 1 ] );
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
                c.url.should.eql( M.prototype.urlRoot );
                c.model.should.eql( M );
            });

            it( 'can be defined in Model.collection', function(){
                var c = new M.Collection();
                c.b.should.eql( 'b' );
            });

            it( 'inherits from the base Model.collection', function(){
                var B = M.extend({
                    urlRoot : '/myroot',
                    collection : {
                        c : 'c'
                    }
                });

                var c = new B.Collection();
                c.c.should.eql( 'c' );
                c.b.should.eql( 'b' );
                c.url.should.eql( '/myroot' );
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
                c.a.should.eql( 'a' );
                c.b.should.eql( 'b' );
            });

            it( 'can be extended', function(){
                var D = C.extend({
                    d : 'd'
                });

                var d = new D();

                d.a.should.eql( 'a' );
                d.b.should.eql( 'b' );
                d.d.should.eql( 'd' );
            });

            it( 'can trigger/listen to backbone events', function(){
                var C = Nested.Class.extend({
                    initialize : function(){
                        this.listenTo( this, 'hello', function(){
                            this.hello = true;
                        })
                    }
                });

                var c = new C();
                c.trigger( 'hello' );
                c.hello.should.be.true;
            });

            it( 'can have explicitly defined native properties', function(){
                canHaveNativeProperties( Nested.Class );
            });
        });

        describe( 'Run-time errors', function(){
            it( 'Property "name" conflicts with base class members' );
            it( 'Attribute hash is not an object' );
            it( 'Attribute "name" has no default value' );
            it( '"defaults" must be an object, functions are not supported' );
        });
    });
});
