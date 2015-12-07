# Validation
 
## General Principles

model.validationError = null | { _token, _count, _all, attr1, ... }
// evaluated on first access and cached
// uses change token to validate the cache 

model.isValid() => true | false
model.isValid( attr ) => true | false

model.getLink( 'attr' ) => { value, set, [ error ] } 

model.validate = function(){
    // return error;
}

maxPlayers : Integer.has
    .check( x => x >= 1 && x <= 5,
        'Max players must be an integer from 1 to 5' 
    )