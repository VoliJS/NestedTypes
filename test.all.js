define( function( require, exports, module ){
    var Base = require( 'nestedtypes' );

    var Nested = Base.Model.extend({
        defaults:{
            time: Date,
            text: '',
            number: 1
        },

        url: '/',

        save: function(){}
    });

    var Main = Base.Model.extend({
        defaults:{
            first: Nested,
            second: Nested,
            count: 0,
            sum: 0
        }
    });

    describe( 'Extended defaults functionality', function(){
        var M, M1;

        it( 'create native properties for defaults', function( done ){
            M = Base.Model.extend({
                defaults: {
                    a: 1,
                    b: 'ds'
                },

                some: 4
            });

            var m = new M();

            m.a.should.eql( 1 );
            m.b.should.eql( 'ds' );
            m.some.should.eql( 4 );

            m.once( 'change:b', function(){
                m.b.should.eql( 5 );
                done();
            });

            m.b = 5;
        });


        it( 'inherit defaults from the base class', function(){
            M1 = M.extend({
                defaults: {
                    d: 1,
                    a: 'e'
                }
            });

            var m = new M1();

            m.a.should.eql( 'e' );
            m.d.should.eql( 1 );
            m.b.should.eql( 'ds' );
            m.some.should.eql( 4 );
        });
    });

    describe( 'constructors in defaults', function(){
        var user, User = Base.Model.extend({
            defaults:{
                created: Date,
                name: String,
                loginCount: Number
            }
        });

        before( function(){
            user = new User();
        });

        it( 'create default values for constructor attributes', function(){
            user.created.should.be.instanceof( Date );
            user.name.should.eql( '' );
            user.loginCount.should.eql( 0 );
        });

        it( 'cast attribute values to defined types on assignment', function(){
            user.loginCount = "5";
            user.loginCount.should.be.number;

            user.loginCount = "djkjkj";
            user.loginCount.should.be.NaN;

            // parse Date from string
            user.created = "2012-12-12 10:00";
            user.created.should.be.instanceof( Date );
            user.created.toISOString().should.be.eql( '2012-12-12T10:00:00.000Z' );

            // parse Date from timestamp
            user.created = 1234567890123;
            user.created.should.be.instanceof( Date );
            user.created.toISOString().should.be.eql( '2009-02-13T23:31:30.123Z' );

            user.name = 34;
            user.name.should.be.string;
        });

        describe( 'JSON', function(){
            var comment, Comment = Base.Model.extend({
                defaults: {
                    created: Date,
                    author: User,
                    text: String
                }
            });

            before( function(){
                comment = new Comment({
                    created: '2012-11-10T13:14:15.123Z',
                    text: 'bla-bla-bla',
                    author: {
                        created: '2012-11-10 13:14:15',
                        name: 'you'
                    }
                });
            });

            it( 'create nested models from JSON', function(){
                comment.created.should.eql( comment.author.created );
                comment.created.should.be.instanceof( Date );
                comment.author.created.should.be.instanceof( Date );
            });

            it( 'serialize nested models to JSON', function(){
                var json = comment.toJSON();

                json.created.should.be.string;
                json.author.created.should.be.string;
                json.created.should.eql( json.author.created );
            });
        });

    });

    describe( 'event bubbling', function(){
        function shouldFireChangeOnce( model, attr, todo ){
            var change = sinon.spy(),
                attrs = attr.split( ' ' );

            model.on( 'change', change );

            var changeAttrs = _.map( attrs, function( name ){
                var changeName = sinon.spy();
                model.on( 'change:' + name, changeName );
                return changeName;
            });

            todo( model );

            change.should.be.calledOnce;
            model.off( change );

            _.each( changeAttrs, function( spy ){
                spy.should.be.calledOnce;
                model.off( spy );
            });
        }

        describe( 'model with nested model', function(){

            it( 'bubble single attribute local change event', function(){
                shouldFireChangeOnce( new Main(), 'first', function( model ){
                    model.first.text = 'bubble';
                });
            });

            it( 'emit single change event with local event handlers', function(){
                shouldFireChangeOnce( new Main(), 'first', function( model ){
                    model.on( 'change:first', function(){
                        model.count += 1;
                    });

                    model.on( 'change:first', function(){
                        model.sum += 1;
                    });

                    model.first.text = 'bubble';
                });
            });

            it( 'emit single change event in case of bulk change', function(){
                shouldFireChangeOnce( new Main(), 'first second', function( model ){
                    model.set({
                        count: 1,

                        first: {
                            time: '2012-12-12 12:12',
                            text: 'hi'
                        },

                        second: {
                            time: '2012-12-12 12:12',
                            text: 'hi'
                        }
                    });
                });
            });
        });

        describe( 'model with nested collection', function(){
            var Coll = Base.Collection.extend({
                model: Nested
            });

            var Compound = Main.extend({
                defaults:{
                    items: Coll
                }
            });

            var compd = new Compound();

            it( 'trigger change when models are added to nested collection', function(){
                shouldFireChangeOnce( compd, 'items', function(){
                    compd.items.create({
                        time: "2012-12-12 12:12"
                    });
                });

                shouldFireChangeOnce( compd, 'items', function(){
                    compd.items.add([{
                        time: "2012-12-12 12:12"
                    },{
                        time: "2012-12-12 12:12"
                    }]);
                });
            });

            it( 'trigger change when model is changed in nested collection', function(){
                shouldFireChangeOnce( compd, 'items', function(){
                    compd.items.first().text = 'Hi there!';
                });
            });

            it( 'trigger change when models are removed from nested collection', function(){
                shouldFireChangeOnce( compd, 'items', function(){
                    compd.items.remove( compd.items.first() );
                });

                shouldFireChangeOnce( compd, 'items', function(){
                    compd.items.remove([ compd.items.first(), compd.items.last() ]);
                });
            });

            it( "trigger change on nested collection's reset", function(){
                shouldFireChangeOnce( compd, 'items', function(){
                    compd.items.reset([{
                            id: 1,
                            time: "2012-12-12 12:12"
                        },{
                            id: 2,
                            time: "2012-12-12 12:13"
                        },{
                            id: 3,
                            time: "2012-12-12 12:14"
                        }]);

                    compd.items.length.should.eql( 3 );
                });
            });

            it( 'trigger change when nested collection is sorted', function(){
                shouldFireChangeOnce( compd, 'items', function(){
                    compd.items.comparator = 'time';
                    compd.items.sort();
                });
            });

            it( "trigger single change on nested collection's bulk change operation", function(){
                shouldFireChangeOnce( compd, 'items', function(){
                    compd.items.set([{
                        id: 3,
                        time: "2012-12-12 12:12"
                    },{
                        id: 4,
                        time: "2012-12-12 12:13"
                    },{
                        id: 5,
                        time: "2012-12-12 12:14"
                    }]);

                    compd.items.length.should.eql( 3 );
                });
            });

            it( 'trigger single change in case of bulk update', function(){
                shouldFireChangeOnce( compd, 'items', function(){
                    compd.set({
                        items:[{
                            id: 4,
                            time: "2012-12-12 12:12"
                        },{
                            id: 5,
                            time: "2012-12-12 12:13"
                        },{
                            id: 6,
                            time: "2012-12-12 12:14"
                        }],

                        first: {
                            text: 'Hi'
                        },

                        second: {
                            text: 'Lo'
                        }
                    });
                });
            });
        });
    });

    describe( 'automatic event subscription', function(){
        it( 'manage subscriptions automatically', function(){
            var M = Base.Model.extend({
                defaults:{
                    left: Nested,
                    right: Nested
                },

                listening: {
                    left: {
                        'change:number' : function(){

                        }
                    },

                    right: {
                        'change:time change:text' : 'onRight'
                    }
                },

                onRight: function(){

                }
            });
        });
    });

    describe( 'custom properties', function(){
        it( 'generate read-only properties if function specified', function(){
            var M = Base.Model.extend({
                properties: {
                    a: function(){ return 5; }
                }
            });

            var m = new M();
            m.a.should.eql( 5 );
        });

        it( 'generate custom properties if standard spec provided', function(){

            var M = Base.Model.extend({
                state: 0,

                properties: {
                    a: {
                        get: function(){ return this.state; },
                        set: function( x ){ this.state = x; return x; }
                    }
                }
            });

            var m = new M();
            m.a = 5;
            m.a.should.eql( 5 );
            m.state.should.eql( 5 );
        });

        it( 'override properties for defaults', function(){
            var M = Base.Model.extend({
                defaults: {
                    a: 10
                },

                properties: {
                    a: function(){ return 5; }
                }
            });

            var m = new M();

            m.a.should.eql( 5 );

        });
    });

});