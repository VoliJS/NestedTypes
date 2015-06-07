    var Nested = require( '../src/nestedtypes' ),
        expect = require( 'chai' ).expect,
        _ = require( 'underscore' ),
        sinon = require( 'sinon' );

    describe( 'Nested Models and Collections', function(){
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

            expect( change ).to.be.calledOnce;
            model.off( change );

            _.each( changeAttrs, function( spy ){
                expect( spy ).to.be.calledOnce;
                model.off( spy );
            });
        }

        var A = Nested.Model.extend({
            attributes : {
                a : 1,
                b : 2
            }
        });

        var B = Nested.Model.extend({
            attributes :{
                first : A,
                second : A.has.triggerWhenChanged( false ),
                c : A.Collection
            }
        });

        function createSpies(){
            var collection = sinon.spy(),
                model = sinon.spy();

            A.Collection.prototype.parse = function( data ){
                collection();
                return data;
            };

            A.prototype.parse = function( data ){
                model();
                return data;
            };

            return { model : model, collection : collection };
        }

        describe( 'Nested parse method', function(){
            describe( 'Nested model', function(){
                it( 'invoke "parse" on construction', function(){
                    var spies = createSpies();

                    var m = new B({
                        first : {id : 1, a : 2, b : 2}
                    }, { parse : true });

                    expect( spies.model ).to.be.calledOnce;
                });

                it( 'invoke "parse" on set', function(){
                    var spies = createSpies();

                    var m = new B();
                    m.set( 'first', {id : 1, a : 2, b : 2}, { parse : true });

                    expect( spies.model ).to.be.calledOnce;

                });

                it( 'invoke "parse" on set when value is nul' , function(){
                    var spies = createSpies();

                    var m = new B({ first : null });
                    m.set( 'first', {id : 1, a : 1, b : 2}, { parse : true } );
                    expect( spies.model ).to.be.calledOnce;

                });
            });

            describe( 'Nested collection', function(){

                it( 'invoke "parse" on construction', function(){
                    var spies = createSpies();

                    var m = new B({
                        c : [{id : 1, a : 2, b : 2}]
                    }, { parse : true });

                    expect( spies.collection ).to.be.calledOnce;
                    expect( spies.model ).to.be.calledOnce;
                });

                it( 'invoke "parse" on set', function(){
                    var spies = createSpies();

                    var m = new B();
                    m.set( 'c', [{id : 1, a : 1, b : 2}], { parse : true } );

                    expect( spies.collection ).to.be.calledOnce;
                    expect( spies.model ).to.be.calledOnce;
                });

                it( 'invoke "parse" on set when value is null', function(){
                    var spies = createSpies();

                    var m = new B({ c : null });
                    m.set( 'c', [{id : 1, a : 1, b : 2}], { parse : true } );

                    expect( spies.collection ).to.be.calledOnce;
                    expect( spies.model ).to.be.calledOnce;
                });
            })
        });

        describe( 'Nested.Model attribute type cast on assignment', function(){
            describe( 'when current attribute value is not null (deep update)', function(){

                it( 'delegate update to nested model\'s .set', function(){
                    var m = new B(),
                        id = m.first.cid;

                    m.first = {id : 1, a : 1, b : 2};

                    expect( id ).to.eql( m.first.cid );
                    expect( m.first.id ).to.eql( 1 );
                });

                it( 'triggers single "change" and single "change:attr" events if nested model is changed', function(){
                    var m = new B();
                    shouldFireChangeOnce( m, 'first', function(){
                        m.first = {id : 1, a : 1, b : 2};
                    });
                } );
            });

            describe( 'when current attribute value is empty (null)', function(){

                it( 'creates new model', function(){
                    var m = new B({ first : null });
                    m.first = { id : 1, a : 1, b : 2 };
                    expect( m.first.id ).to.eql( 1 );
                });

                it( 'triggers "change", "change:attr", and "replace:attr" events', function(){
                    var m = new B({ first : null } ),
                        replace = sinon.spy();

                    m.on( 'replace:first', replace );

                    shouldFireChangeOnce( m, 'first', function(){
                        m.first = {id : 1, a : 1, b : 2};
                    });

                    expect( replace ).to.be.calledOnce;
                });
            });
        });

        describe( 'Nested.Collection attribute type cast on assignment', function(){
            describe( 'when current attribute value is not null (deep update)', function(){
                it( 'delegate update to nested collection\'s .set', function(){
                    var m = new B(),
                        id = m.c._listenId;

                    m.c = [{id : 1, a : 1, b : 2}];

                    expect( id ).to.eql( m.c._listenId );
                    expect( m.c.first().id ).to.eql( 1 );
                });


                it( 'triggers single "change" and single "change:attr" events when nested collection is changed', function(){
                    var m = new B();
                    shouldFireChangeOnce( m, 'c', function(){
                        m.c = [{id : 1, a : 1, b : 2}];
                    });
                });
            });

            describe( 'when current attribute value is empty (null)', function(){
                it( 'creates new collection', function(){
                    var m = new B({ c : null });
                    m.c = [{id : 1, a : 1, b : 2}];
                    expect( m.c.first().id ).to.eql( 1 );
                });

                it( 'triggers "change", "change:attr", and "replace:attr" events', function(){
                    var m = new B({ c : null } ),
                        replace = sinon.spy();

                    m.on( 'replace:c', replace );

                    shouldFireChangeOnce( m, 'c', function(){
                        m.c = [{id : 1, a : 1, b : 2}];
                    });

                    expect( replace ).to.be.calledOnce;
                });
            });
        });

        describe( 'nested model and collection event bubbling', function(){
            it( 'bubble "change" event from nested model', function(){
                var m = new B();

                shouldFireChangeOnce( m, 'first', function(){
                    m.first.a = 2;
                });
            });

            it( 'generate "change" event on any nested collection modification', function(){
                var m = new B();

                shouldFireChangeOnce( m, 'c', function(){
                    m.c.add({ id: 1, a: 1, b : 2 });
                });

                shouldFireChangeOnce( m, 'c', function(){
                    m.c.first().a = 2;
                });

                shouldFireChangeOnce( m, 'c', function(){
                    m.c.remove( m.c.first() );
                });
            });

            it( 'may be disabled for selected nested attributes', function(){
                var m = new B(),
                    spyTop = sinon.spy(),
                    spyBottom = sinon.spy();

                m.on( 'change', spyTop );
                m.second.on( 'change', spyBottom );
                m.second.a = 5;
                expect( spyBottom ).to.be.calledOnce;
                expect( spyBottom ).to.be.notCalled;
            });
        })
    });