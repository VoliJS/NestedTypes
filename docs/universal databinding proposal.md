(!) UNIVERSAL DATABINDING (!)
Based in react links


// for boolean
collection.lhas( model )

{ encoders.map( encoder => (
    <Checklist key={ encoder.cid } checkedLink={ selected.lhas( encoder ) } />
))}

// for inputs
model.lget( 'attr' )

// for radio
model.lget( 'selected' ).leql( x )

// for clicks
model.fset( 'selected', x )
model.lget( 'selected' ).leql( 'y' ).fset( true )


model.fset( 'attr', x )
model.lget( 'attr' )
model.lget( 'attr' ).leql( x )