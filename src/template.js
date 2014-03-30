define({
    load: function ( a_path, require, onLoad, config ) {
        function trimSpaces( a_string ){
            return a_string.replace( /^\s*/, "").replace( /\s*$/, "" );
        }

        require([ 'text!' + a_path, 'underscore' ], function ( a_text, _ ) {
            // parse sections...
            var x = a_text.split( /<%\!--(.+?)--\!%>/);

            function template( a_context ){
                return template._mainSection( a_context );
            }

            template.__mainSection = _.template( x[ 0 ] );

            // for each section...
            for( var i = 1; i < x.length; i += 2 ){
                template[ trimSpaces( x[ i ] ) ] = _.template( x[ i + 1 ] );
            }

            onLoad( template );
        });
    }
});