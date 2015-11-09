(!) UNIVERSAL DATABINDING (!)



// for boolean
collection.toggler( model )
    get : m in collection
    set( true )

{ encoders.map( encoder => (
    <Checklist checked={ selected.toggle_p( encoder ) } />
))}

// for inputs
model.setter( 'attr' )

// for radio
model.toggler( 'selected', x )
    get : a === x,
    set( true ) : a = x
    set( false ): a = null

// for clicks
model.setter( 'selected', x )
        get : a = x

model.setter.selected.toggle( y )


model.setter( 'attr', x )
model.setter( 'attr' )
model.toggler( 'attr', x )


function to( x ){
    var setter = this;
    return function(){ setter( x ); }
}

function toggle( x ){
    var setter = this;
    return function( y ){
        ,,,,
        return setter() === y;
    }
}

makeSetter( self, name ){
    var f = function( x ){
        return arguments.length ? self[ name ] = x : self[ name ];
    };

    f.to = to;
}

setter : function(){
    if( this._setters )
    var setters = {}, self = this;
    for( var name in this.attributes ){
        setters[ name ] = makeSetter( name );
    }

    return setters;
}

function( x ){

}
