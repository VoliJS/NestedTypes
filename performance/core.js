function measure( fun, context ){
    const start = window.performance.now();
    fun( context );
    return window.performance.now() - start;
}

export const Test = Model.extend( {
    idAttribute : 'name',

    defaults : {
        name      : String,
        time      : Integer.value( null ),
        faster    : Number.value( null ),
        exception : Error.value( null ),
        init      : Function.value( () => {} ),
        test      : Function
    },

    run(){
        this.transaction( () =>{
            this.exception = null;
            this.time = null;

            try{
                const context = this.init() || {};
                this.time = measure( this.test, context );
            }
            catch( e ){
                this.exception = e;
            }
        });
    },

    collection : {
        whoIsFaster( thanMe ){
            const time = thanMe && thanMe.time;

            this.transaction( () =>{
                this.tests.each( test => test.faster = time && test.time ? time / test.time : null );
            } );
        }
    }
});

export const Group = Model.extend( {
    idAttribute : 'name',

    defaults : {
        name     : String,
        tests    : Test.Collection,
        selected : Test.from( 'tests' )
    },

    initialize(){
        this.listenTo( this, 'change:selected change:tests', () =>{
            this.tests.whoIsFaster( this.selected );
        } );
    },

    run(){
        this.tests.each( test => test.run() );
    }
} );

var groups = new Group.Collection();


function oneAttrModel(){
    return Model.defaults({ a : 0 });
}

function createModel( Model ){
    var m;

    for( var i = 0; i < 50000; i++ ){
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