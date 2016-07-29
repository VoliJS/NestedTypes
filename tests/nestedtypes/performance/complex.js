define( function( require, exports, module ){
    var Nested   = require( '../../../index.js' ),
        Model = Nested.Model;

    /********************
     * Model definitions
     */
    if( Nested.tools ){
        Nested.tools.log.level = 1;
    }

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
            smallData.push({ id : i, a : i });
            largeData.push({ id : i,
                a0 : i, a1 : i, a2 : i, a3 : i, a4: i, a5 : i, a6: i, a7: i, a8: i, a9: i,
                b0 : i, b1 : i, b2 : i, b3 : i, b4: i, b5 : i, b6: i, b7: i, b8: i, b9: i
            });
        }

        smallData = JSON.stringify( smallData );
        largeData = JSON.stringify( largeData );

        var small, large;

        beforeEach( function(){
            small = JSON.parse( smallData );
            large = JSON.parse( largeData );
        });

        describe( 'Create 50K collection', function(){
            it( '1 attribute model', function(){
                var smallCollection = new SmallFlatModel.Collection( small );
            });

            it( '20 attribute model', function(){
                var largeCollection = new LargeFlatModel.Collection( large );
            });
        });

        describe( 'Fetch 50K collection', function(){
            it( '1 attribute model', function(){
                var smallCollection = new SmallFlatModel.Collection();
                smallCollection.set( small );
            });

            it( '20 attribute model', function(){
                var largeCollection = new LargeFlatModel.Collection();
                largeCollection.set( large );
            });
        });

        var _smallCollection = new SmallFlatModel.Collection( JSON.parse( smallData ) );
        var _largeCollection = new LargeFlatModel.Collection( JSON.parse( largeData ) );

        describe( 'Update 50K collection', function(){
            it( '1 attribute model', function(){
                _smallCollection.set( small );
            });

            it( '20 attribute model', function(){
                _largeCollection.set( large );
            });
        });

        describe( 'Reset 50K collection', function(){
            it( '1 attribute model', function(){
                _smallCollection.reset( small );
            });

            it( '20 attribute model', function(){
                _largeCollection.reset( large );
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

        treeJSON = JSON.stringify( createTree( 6 ) );
        listJSON = JSON.stringify( createList( 1000 ) );

        var _tree, _list;

        describe( '1000 elements linked list, 1000 times + parse time', function(){
            var list;

            it( 'Create from JSON', function(){
                for( var i = 0; i < 1000; i++ ){
                    list = new LinkedList( JSON.parse( listJSON ) );
                }
            });

            it( 'Fetch empty from JSON', function(){
                for( var i = 0; i < 1000; i++ ){
                    list = new LinkedList();
                    list.set( JSON.parse( listJSON ) );
                }
            });

            it( 'Update with JSON', function(){
                for( var i = 0; i < 1000; i++ ){
                    list.set( JSON.parse( listJSON ) );
                }            
            });
        });

        describe( 'Wide model tree with 10 childs, 100K elements', function(){
            var data, tree;
            beforeEach( function(){
                data = JSON.parse( treeJSON );
            });

            it( 'Create from JSON', function(){
                tree = new Tree( data );
            });

            it( 'Fetch empty from JSON', function(){
                tree = new Tree();
                tree.set( data );
            });

            it( 'Update with JSON', function(){
                tree.set( data );
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

        function createTree( level, id ){
            var l = level - 1;
            return {
                id : id || 0,
                time : new Date(),
                author_id : level,
                text : 'hjkfshdkhjfksdhkj fhsdjkhfsdjk hjfksdhjk hfjsdkhjk hfjdskhjkhj fdssdffsdn,m nm, nm, nv,xvcvcx',
                replies : l ? [
                    createTree( l, 0 ),
                    createTree( l, 1 ),
                    createTree( l, 2 ),
                    createTree( l, 3 ),
                    createTree( l, 4 ),
                    createTree( l, 5 ),
                    createTree( l, 6 ),
                    createTree( l, 7 ),
                    createTree( l, 8 ),
                    createTree( l, 9 )
                ] : []
            }
        }

        function createList( width, depth ){
            var list = [];

            for( var i = 0; i < width; i++ ){
                list.push( createTree( depth, i ) );
            }

            return list;
        }

        var treeData = JSON.stringify( createTree( 6 ) ),
            shortList = JSON.stringify( createList( 100, 4 ) ),
            midList = JSON.stringify( createList( 1000, 3 ) ),
            longList = JSON.stringify( createList( 10000, 2 ) );

        var _comment, _short, _mid, _long;

        describe( '100K Model/Collection Tree', function(){
            var data, collection;
            beforeEach( function(){
                data = JSON.parse( treeData );
            });

            it( 'Create from JSON', function(){
                collection = new Comment.Collection( data );
                collection = null;
            });

            it( 'Fetch empty from JSON', function(){
                collection = new Comment.Collection();
                collection.set( data );
            });

            it( 'Update with JSON', function(){
                collection.set( data );
                collection = null;
            });
        });

        describe( '100 elements Collection of 1000 items Model/Collection tree', function(){
            var data, collection;
            beforeEach( function(){
                data = JSON.parse( shortList );
            });

            it( 'Create from JSON', function(){
                collection = new Comment.Collection( data );
                collection = null;
            });

            it( 'Fetch empty from JSON', function(){
                collection = new Comment.Collection();
                collection.set( data );
            });

            it( 'Update with JSON', function(){
                collection.set( data );
                collection = null;
            });
        });

        describe( '1000 elements Collection of 100 items Model/Collection tree', function(){
            var data, collection;
            beforeEach( function(){
                data = JSON.parse( midList );
            });

            it( 'Create from JSON', function(){
                collection = new Comment.Collection( data );
                collection = null;
            });

            it( 'Fetch empty from JSON', function(){
                collection = new Comment.Collection();
                collection.set( data );
            });

            it( 'Update with JSON', function(){
                collection.set( data );
                collection = null;
            });
        });

        describe( '10 000 elements Collection of 10 items Model/Collection tree', function(){
            var data, collection;
            beforeEach( function(){
                data = JSON.parse( longList );
            });

            it( 'Create from JSON', function(){
                collection = new Comment.Collection( data );
                collection = null;
            });

            it( 'Fetch empty from JSON', function(){
                collection = new Comment.Collection();
                collection.set( data );
            });

            it( 'Update with JSON', function(){
                collection.set( data );
                collection = null;
            });
        });
    });

    describe( 'Users directory', function(){
        var User = Model.extend({
            idAttribute: 'user_id',
            defaults: {
                created_at : Date,
                updated_at : Date,
                username   : String,
                password   : String,
                fname      : String,
                lname      : String,
                email      : String,
                active     : Number,
                'default'    : Number,
                guid        : '',
                old_7password : String,
                created_by : null,
                domain_id: 0,
                user_type  : Number,
                user_types : Array,
                permissions: {},
                selectedEncoders : Nested.Collection.subsetOf( '~encoders' ),
                roles : Nested.Collection.subsetOf( '~roles' ),
                settings: Model.defaults({
                    TZ: '',
                    DefaultMetadataState: 'off',
                    LoudnessMeterState: 'off',
                    OrderChannels: 'name',
                    PlayLiveLastChannel: false,
                    SendExportNotification: true,
                    DisplayPlayerSpeed: false
                })
            }
        });

        var Dummy = Nested.Model.extend({
            attributes : {
                name : ''
            }
        });

        var Store = Nested.Store.defaults({
            encoders : Dummy.Collection,
            roles : Dummy.Collection
        });

        var store;
        if( Nested.store ){
            store = Nested.store = new Store();
        }
        else{
            store = Nested.Store.global = new Store();
        }

        var dummies = [];
        for( var i = 0; i < 100; i++ ){
            dummies.push( { id : i, name : 'name' + i });
        }

        store.encoders = dummies;
        store.roles = dummies;

        var _users = [];

        for( var i = 0; i < 10000; i++ ){
            _users.push({
                active : 1,
                created_at : "2015-11-18T16:57:10+00:00",
                created_by : null,
                default : 1,
                domain_id : 0,
                email : "observer-import-system@volicon.com",
                fname : "api_import_user",
                lname : "api_import_user",
                roles:["5"],
                updated_at:"2015-11-18T16:57:10+00:00",
                user_id: i,
                user_type:3,
                user_types:["3"],
                username : "api_import_user"
            });
        }

        var usersJSONtext = JSON.stringify( _users );
        _users = null;
        
        var usersJSON;

        beforeEach( function(){
            usersJSON = JSON.parse( usersJSONtext );
        });

        var collection;

        it( 'Creates users collection from JSON', function(){
            collection = new User.Collection( usersJSON );
        } );

        it( 'Fetches users collection from JSON', function(){
            collection = new User.Collection();
            collection.set( usersJSON );
        } );

        it( 'Updates users collection', function(){
            collection.set( usersJSON );
        });
    });
});
