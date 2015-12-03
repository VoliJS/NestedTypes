import { Model } from 'nestedtypes'

function emptyTest( n, context ){
    for( var i = 0; i < n; i++ ){
        // do nothing
    }
}

function measure( fun, context, iterations ){
    const start = window.performance.now();
    fun( iterations, context );
    return window.performance.now() - start;
}

export const Test = Model.extend( {
    idAttribute : 'name',

    defaults : {
        executedAt : Date.value( null ),
        name      : String,
        time      : Number.value( null ),
        count     : Integer,
        iterations : Integer,
        faster    : Number.value( null ),
        exception : Error.value( null ),
        init      : Function.has.toJSON( false ),
        test      : Function.has.toJSON( false ).value( emptyTest )
    },

    properties : {
        ops(){
            return this.time ? Integer( this.count * 1000 / this.time ) : 0;
        }
    },

    _measure( iterations, cumulative = false ){
        if( !cumulative ){
            this.time = this.count = 0;
        }

        const context = this.init( iterations ) || {};
        this.time += measure( this.test, iterations, context );
        this.count += iterations;
    },

    _estimate(){
        this._measure( 100 );

        for( let n = 200; this.time < 200; n *= 2 ){
            this._measure( n, true );
        }

        return this.ops * 3;
    },

    run( a_iterations ){
        this.transaction( () =>{
            this.exception = null;
            this.executedAt = new Date();

            try{
                var iterations = this.iterations || a_iterations || _estimate();
                this._measure( iterations );
            }
            catch( e ){
                this.exception = e;
            }
        });
    },

    collection : {
        whoIsFaster( thanMe ){
            const ops = thanMe && thanMe.ops;

            this.transaction( () =>{
                this.tests.each( test => test.faster = ops && test.ops ? test.ops / ops : null );
            } );
        },

        properties : {
            time(){
                return this.reduce( ( ( sum, test ) => sum + test.time ), 0 );
            },

            count(){
                return this.reduce( ( ( sum, test ) => sum + test.count ), 0 );
            },

            ops(){
                return this.time ? Integer( this.count * 1000 / this.time ) : 0;
            }
        }
    }
});

export const Group = Model.extend( {
    idAttribute : 'name',

    defaults : {
        executedAt : Date.value( null ),
        name     : String,
        tests    : Test.Collection.has.proxy( 'time count ops' ),
        selected : Test.from( 'tests' ),
        iterations : Integer
    },

    initialize(){
        this.listenTo( this, 'change:selected change:tests', () =>{
            this.tests.whoIsFaster( this.selected );
        } );
    },

    run(){
        this.executedAt = new Date();
        this.tests.each( test => test.run( this.iterations ) );
    }
} );

var groups = new Group.Collection();


function oneAttrModel(){
    return Model.defaults({ a : 0 });
}

function createModel( count, Model ){
    var m;

    for( var i = 0; i < count; i++ ){
        m = new Model();
    }
}

groups.create({
    name : 'Model creation (50K)',
    tests : [
        {
            name : 'Backbone 1-attr',
            init : oneAttrBBModel,
            test : createModel
        },
        {
            name : 'Nested 1-attr',
            init : oneAttrNTModel,
            test : createModel
        },
        {
            name : 'Backbone 20-attr',
            init : twentyAttrBBModel,
            test : createModel
        },
        {
            name : 'Nested 20-attr',
            init : twentyAttrNTModel,
            test : createModel
        }
    ]
});