require( './object+' );

function format( value ){
    return typeof value === 'string' ? '"' + value + '"' : value;
}

Object.assign( Object.extend.error, {
    argumentIsNotAnObject : function( context, value ){
        //throw new TypeError( 'Attribute hash is not an object in ' + context.__class + '.set(', value, ')' );
        console.error( '[Type Error] Attribute hash is not an object in ' +
                       context.__class + '.set(', format( value ), '); this =', context );
    },

    unknownAttribute : function( context, name, value ){
        if( context.suppressTypeErrors ) return;

        console.warn( '[Type Error] Attribute has no default value in ' +
                        context.__class + '.set( "' + name + '",', format( value ), '); this =', context );
    },

    hardRefNotAssignable : function( context, name, value ){
        if( context.suppressTypeErrors ) return;

        console.warn( '[Type Error] Hard reference cannot be assigned in ' +
                        context.__class + '.set( "' + name + '",', format( value ), '); this =', context );
    },

    wrongCollectionSetArg : function( context, value ){
        //throw new TypeError( 'Wrong argument type in ' + context.__class + '.set(' + value + ')' );
        console.error( '[Type Error] Wrong argument type in ' +
                       context.__class + '.set(', format( value ), '); this =', context );
    },

    serializeSharedObject : function( context, name, value ){
      console.warn( '[Ownership Error] Shared model/collection is being serialized to JSON, in ' +
                     context.__class + '.' + name + '==', value, '; this =', context );
    }
});

module.exports = Object.extend.error;
