define( function( require, exports, module ){
    var Nested   = require( '../nestedtypes' ),
        Model = Nested.Model;

    /********************
     * Model definitions
     */

    describe( 'Collections of flat models', function(){
        this.timeout( 100000 );

        var SmallFlatModel = Model.extend({
            attributes : {
                a : 0
            }
        });

        var LargeFlatModel = Model.extend({
            attributes : {
                a0 : 0, a1 : 1, a2 : 2, a3 : 3, a4: 4, a5 : 5, a6: 6, a7: 7, a8: 8, a9: 9,
                b0 : 0, b1 : 1, b2 : 2, b3 : 3, b4: 4, b5 : 5, b6: 6, b7: 7, b8: 8, b9: 9
            }
        });

        var smallData = [],
            largeData = [];

        for( var i = 0; i < 50000; i++ ){
            smallData.push({ a : i });
            largeData.push({
                a0 : i, a1 : i, a2 : i, a3 : i, a4: i, a5 : i, a6: i, a7: i, a8: i, a9: i,
                b0 : i, b1 : i, b2 : i, b3 : i, b4: i, b5 : i, b6: i, b7: i, b8: i, b9: i
            });
        }

        smallData = JSON.stringify( smallData );
        largeData = JSON.stringify( largeData );

        describe( 'Create 50K collection', function(){
            it( '1 attribute model', function(){
                var smallCollection = new SmallFlatModel.Collection( JSON.parse( smallData ) );
            });

            it( '20 attribute model', function(){
                var largeCollection = new LargeFlatModel.Collection( JSON.parse( largeData ) );
            });
        });

        describe( 'Fetch 50K collection', function(){
            it( '1 attribute model', function(){
                var smallCollection = new SmallFlatModel.Collection();
                smallCollection.set( JSON.parse( smallData ) );
            });

            it( '20 attribute model', function(){
                var largeCollection = new LargeFlatModel.Collection();
                largeCollection.set( JSON.parse( largeData ) );
            });
        });

        var _smallCollection = new SmallFlatModel.Collection( JSON.parse( smallData ) );
        var _largeCollection = new LargeFlatModel.Collection( JSON.parse( largeData ) );

        describe( 'Update 50K collection', function(){
            it( '1 attribute model', function(){
                _smallCollection.set( JSON.parse( smallData ) );
            });

            it( '20 attribute model', function(){
                _largeCollection.set( JSON.parse( largeData ) );
            });
        });

        describe( 'Reset 50K collection', function(){
            it( '1 attribute model', function(){
                _smallCollection.reset( JSON.parse( smallData ) );
            });

            it( '20 attribute model', function(){
                _largeCollection.reset( JSON.parse( largeData ) );
            });
        });
    });

    describe( 'Recursive model structures', function(){
        this.timeout( 100000 );

        var LinkedList = Model.extend();
        LinkedList.define({
            attributes : {
                next : LinkedList.value( null ),
                value : 0
            }
        });

        var Tree = Model.extend();
        Tree.define({
            attributes : {
                a0 : Tree.value( null ),
                a1 : Tree.value( null ),
                a2 : Tree.value( null ),
                a3 : Tree.value( null ),
                a4 : Tree.value( null ),
                a5 : Tree.value( null ),
                a6 : Tree.value( null ),
                a7 : Tree.value( null ),
                a8 : Tree.value( null ),
                a9 : Tree.value( null ),
                value : 0
            }
        });

        function createTree( level ){
            if( level ){
                var l = level - 1;
                return {
                    a0 : createTree( l ),
                    a1 : createTree( l ),
                    a2 : createTree( l ),
                    a3 : createTree( l ),
                    a4 : createTree( l ),
                    a5 : createTree( l ),
                    a6 : createTree( l ),
                    a7 : createTree( l ),
                    a8 : createTree( l ),
                    a9 : createTree( l ),
                    value : l
                }
            }

            return null;
        }

        function createList( n ){
            var list = {};

            for( var i = 0, l = list; i < 1000; i++, l = l.next ){
                l.next = { next : null, value : i };
            }

            return list;
        }

        var treeData, listData;

        treeData = JSON.stringify( createTree( 6 ) );
        listData = JSON.stringify( createList( 1000 ) );

        describe( 'Create structure', function(){
            it( 'Linked list', function(){
                var list;

                for( var i = 0; i < 1000; i++ )
                    list = new LinkedList( JSON.parse( listData ) );
            });

            it( 'Wide tree', function(){
                var tree;
                tree = new Tree( JSON.parse( treeData ) );
            });
        });

        describe( 'Fetch structure', function(){
            it( 'Linked list', function(){
                for( var i = 0; i < 1000; i++ ){
                    var list = new LinkedList();
                    list.set( JSON.parse( listData ) );
                }
            });

            it( 'Wide tree', function(){
                var tree = new Tree();
                tree.set( JSON.parse( treeData ) );
            });
        });

        describe( 'Update structure', function(){
            var _list, _tree;

            before( function(){
                _list = new LinkedList( JSON.parse( listData ) );
                _tree = new Tree( JSON.parse( treeData ) );
            });

            it( 'Linked list', function(){
                for( var i = 0; i < 1000; i++ )
                    _list.set( JSON.parse( listData ) );
            });

            it( 'Wide tree', function(){
                _tree.set( JSON.parse( treeData ) );
            });
        });
    });

    describe( 'Recursive model/collection tree', function(){
        this.timeout( 100000 );

        var Comment = Model.extend();
        Comment.define({
            attributes : {
                time : Date,
                text : String,
                author_id : Number,
                replies : Comment.Collection,
            }
        });

        function createTree( level ){
            var l = level - 1;
            return {
                time : new Date(),
                author_id : level,
                text : 'hjkfshdkhjfksdhkj fhsdjkhfsdjk hjfksdhjk hfjsdkhjk hfjdskhjkhj fdssdffsdn,m nm, nm, nv,xvcvcx',
                replies : l ? [
                    createTree( l ),
                    createTree( l ),
                    createTree( l ),
                    createTree( l ),
                    createTree( l ),
                    createTree( l ),
                    createTree( l ),
                    createTree( l ),
                    createTree( l ),
                    createTree( l )
                ] : []
            }
        }

        function createList( width, depth ){
            var list = [];

            for( var i = 0; i < width; i++ ){
                list.push( createTree( depth ) );
            }

            return list;
        }

        var treeData = JSON.stringify( createTree( 6 ) ),
            shortList = JSON.stringify( createList( 100, 4 ) ),
            midList = JSON.stringify( createList( 1000, 3 ) ),
            longList = JSON.stringify( createList( 10000, 2 ) );

        var _comment, _short, _mid, _long;

        describe( 'Create and update', function(){
            it( 'Create 100K Tree', function(){
                _comment  = new Comment( JSON.parse( treeData ) );
            });

            it( 'Update 100K Tree', function(){
                _comment.set( JSON.parse( treeData ) );
                _comment = null;
            });

            it( 'Create 100 elements of 1000 items', function(){
                _short = new Comment.Collection( JSON.parse( shortList ) );
            });

            it( 'Update 100 elements of 1000 items', function(){
                _short.set( JSON.parse( shortList ) );
                _short = null;
            });

            it( 'Create 1000 elements of 100 items', function(){
                _mid = new Comment.Collection( JSON.parse( midList ) );
            });

            it( 'Update 1000 elements of 100 items', function(){
                _mid.set( JSON.parse( midList ) );
                _mid = null;
            });

            it( 'Create 10000 elements of 10 items', function(){
                _long = new Comment.Collection( JSON.parse( longList ) );
            });


            it( 'Update 10000 elements of 10 items', function(){
                _long.set( JSON.parse( longList ) );
                _long = null;
            });
        });

        describe( 'Fetch structure', function(){
            it( '100K Tree', function(){
                var comment  = new Comment();
                comment.set( JSON.parse( treeData ) );
            });

            it( '100 elements of 1000 items', function(){
                var comments = new Comment.Collection(  );
                comments.set( JSON.parse( shortList ) );
            });

            it( '1000 elements of 100 items', function(){
                var comments = new Comment.Collection(  );
                comments.set( JSON.parse( midList ) );
            });

            it( '10000 elements of 10 items', function(){
                var comments = new Comment.Collection(  );
                comments.set( JSON.parse( longList ) );
            });
        });
    });
});
