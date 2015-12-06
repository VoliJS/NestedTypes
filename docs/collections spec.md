Collection
    constructor()
    constructor( models )
    constructor( models, options )
            same as reset( models )
            but everything is guaranteed to be empty.
            used in nested collections creation.
    
    reset()
        =>
            clean up indexes
            
    reset( models )
        =>
            regenerate models and indexes
            
    reset( models, options )        
        valid options:
            parse = false
            silent = false
            sort = true            
        =>
            regenerate models and indexes
            no add/remove events
        
    set( models, options )
        options:
            merge = true
            parse = false
            silent = false
            sort = true
        =>
            regenerate data structures
            reuse existing models
            fire add/remove

    add( models )
        options:
            parse = false
            silent = false            
            at = undefined
            sort = true
            
    remove( models )
        options
            silent = false
