Collection
    constructor()
    constructor( models )
    constructor( models, options )
            same as reset( models )
            but everything is guaranteed to be empty.
            used in nested collections creation.
    
    reset()
    reset( models )
    reset( models, options )        
        set collection to defined state, updating them in a bulk.
        optimize to be as fast as possible.
        
    set( models )
        set collection to defined state, generating the set
        of individual update operations.
            
        update existing models
        remove unneeded models
        add missing models
        
        1. iterate through models
        2. build new index
        3. build new array
        4. remove old models.
        

    add( models )
    remove( models )

individual operations:
    addModel( model )
    removeModel( model )
    setModel( model )
        