define( function( require, exports, module ){
    var Nested   = require( 'nestedtypes' ),
        Backbone = require( 'backbone' );

    describe( 'Flat models', function(){
        describe( 'primitive types', function(){
            var NLarge, BLarge, NSmall, BSmall;

            function makeDefinitions(){
                NLarge = Nested.Model.extend({
                    defaults : {
                        a1 : 1, a2 : 2, a3 : 3, a4: 4, a5 : 5, a6: 6, a7: 7, a8: 8, a9: 9, a10 : 10,
                        b1 : 1, b2 : 2, b3 : 3, b4: 4, b5 : 5, b6: 6, b7: 7, b8: 8, b9: 9, b10 : 10
                    },

                    updateSet : function(){
                        this.set({
                            a1 : this.a1 + 1,
                            a2 : this.a2 + 1,
                            a3 : this.a3 + 1,
                            a4 : this.a4 + 1,
                            a5 : this.a5 + 1
                        });
                    },

                    updateTransaction : Nested.transaction(function(){
                        this.a1 = this.a1 + 1;
                        this.a2 = this.a2 + 1;
                        this.a3 = this.a3 + 1;
                        this.a4 = this.a4 + 1;
                        this.a5 = this.a5 + 1;
                    }),

                    updateAdHocTransaction : function(){
                        this.transaction( function(){
                            this.a1 = this.a1 + 1;
                            this.a2 = this.a2 + 1;
                            this.a3 = this.a3 + 1;
                            this.a4 = this.a4 + 1;
                            this.a5 = this.a5 + 1;
                        }, options );
                    }
                });

                BLarge = Backbone.Model.extend({
                    defaults : {
                        a1 : 1, a2 : 2, a3 : 3, a4: 4, a5 : 5, a6: 6, a7: 7, a8: 8, a9: 9, a10 : 10,
                        b1 : 1, b2 : 2, b3 : 3, b4: 4, b5 : 5, b6: 6, b7: 7, b8: 8, b9: 9, b10 : 10
                    },

                    updateSet : function(){
                        this.set({
                            a1 : this.get( 'a1' ) + 1,
                            a2 : this.get( 'a2' ) + 1,
                            a3 : this.get( 'a3' ) + 1,
                            a4 : this.get( 'a4' ) + 1,
                            a5 : this.get( 'a5' ) + 1
                        });
                    }
                });

                NSmall = Nested.Model.extend({
                    defaults : {
                        a1 : 1
                    }
                });

                BSmall = Backbone.Model.extend({
                    defaults : {
                        a1 : 1
                    }
                });
            }

            var n, b;

            describe( '1-attr model, 1M create', function(){
                makeDefinitions();

                it( 'Backbone', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        b = new BSmall();
                    }
                });

                it( 'Nested', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        n = new NSmall();
                    }
                });
            });

            describe( '20-attrs model, 1M create', function(){
                makeDefinitions();

                it( 'Backbone', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        b = new BLarge();
                    }
                });

                it( 'Nested', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        n = new NLarge();
                    }
                });
            });

            describe( '1-attr model, 1M .set( "a1", number )', function(){
                makeDefinitions();

                var b = new BSmall();

                it( 'Backbone', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        b.set( 'a1', i );
                    }
                });

                var n = new NSmall();

                it( 'Nested', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        n.set( 'a1', i );
                    }
                });

                var n = new NSmall();

                it( 'Nested native property', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        n.a1 = i;
                    }
                });
            });

            describe( '20-attrs model, 1M .set( "a1", number )', function(){
                makeDefinitions();

                var b = new BLarge();

                it( 'Backbone', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        b.set( 'a1', i );
                    }
                });

                var n = new NLarge();

                it( 'Nested', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        n.set( 'a1', i );
                    }
                });

                var n = new NLarge();

                it( 'Nested native property', function(){
                    for( var i = 0; i < 1000000; i++ ){
                        n.a1 = i;
                    }
                });
            });

            describe( '20-attrs model, 10M .get( "a1" )', function(){
                makeDefinitions();

                var b = new BLarge({ a1: 1 }), x;

                it( 'Backbone', function(){
                    for( var i = 0; i < 10000000; i++ ){
                        x = b.get( 'a1' );
                    }
                });

                var n = new NLarge({ a1: 1 });

                it( 'Nested', function(){
                    for( var i = 0; i < 10000000; i++ ){
                        x = n.get( 'a1' );
                    }
                });

                var n = new NLarge({ a1: 1 });

                it( 'Nested native property', function(){
                    for( var i = 0; i < 10000000; i++ ){
                        x = n.a1;
                    }
                });
            });

            describe( 'both models, 1M read and write', function(){
                makeDefinitions();

                it( 'Backbone', function(){
                    var l = new BLarge(), s = new BSmall();

                    for( var i = 0; i < 1000000; i++ ){
                        l.set( 'a1', l.get( 'a1' ) + 1 );
                        s.set( 'a1', l.get( 'a1' ) + 1 );
                    }
                });

                it( 'Nested', function(){
                    var l = new NLarge(), s = new NSmall();

                    for( var i = 0; i < 1000000; i++ ){
                        l.set( 'a1', l.get( 'a1' ) + 1 );
                        s.set( 'a1', l.get( 'a1' ) + 1 );
                    }
                });

                it( 'Nested native', function(){
                    var l = new NLarge(), s = new NSmall();

                    for( var i = 0; i < 1000000; i++ ){
                        l.a1 = l.a1 + 1;
                        s.a1 = l.a1 + 1;
                    }
                });
            });

            describe( '1M 5-attr transactional updates', function(){
                makeDefinitions();

                it( 'Backbone', function(){
                    var l = new BLarge();

                    for( var i = 0; i < 1000000; i++ ){
                        l.updateSet();
                    }
                });

                it( 'Nested', function(){
                    var l = new NLarge();

                    for( var i = 0; i < 1000000; i++ ){
                        l.updateSet();
                    }
                });

                it( 'Nested transaction', function(){
                    var l = new NLarge();

                    for( var i = 0; i < 1000000; i++ ){
                        l.updateTransaction();
                    }
                });

                it( 'Nested AdHoc transaction', function(){
                    var l = new NLarge();

                    for( var i = 0; i < 1000000; i++ ){
                        l.updateAdHocTransaction();
                    }
                });
            });
        });
    });
});