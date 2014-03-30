define({
    load: function ( a_path, require, onLoad, config) {
        var _ = {};

        // By default, Underscore uses ERB-style template delimiters, change the
        // following template settings to use alternative delimiters.
        _.templateSettings = {
            evaluate    : /<%([\s\S]+?)%>/g,
            interpolate : /<%=([\s\S]+?)%>/g,
            escape      : /<%-([\s\S]+?)%>/g
        };

        // When customizing `templateSettings`, if you don't want to define an
        // interpolation, evaluation or escaping regex, we need one that is
        // guaranteed not to match.
        var noMatch = /(.)^/;

        // Certain characters need to be escaped so that they can be put into a
        // string literal.
        var escapes = {
            "'":      "'",
            '\\':     '\\',
            '\r':     'r',
            '\n':     'n',
            '\t':     't',
            '\u2028': 'u2028',
            '\u2029': 'u2029'
        };

        var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

        // JavaScript micro-templating, similar to John Resig's implementation.
        // Underscore templating handles arbitrary delimiters, preserves whitespace,
        // and correctly escapes quotes within interpolated code.
        _.template = function(text, data ) {
            var render;
            settings = _.templateSettings;

            // Combine delimiters into one regular expression via alternation.
            var matcher = new RegExp([
                (settings.escape || noMatch).source,
                (settings.interpolate || noMatch).source,
                (settings.evaluate || noMatch).source
            ].join('|') + '|$', 'g');

            // Compile the template source, escaping string literals appropriately.
            var index = 0;
            var source = "__p+='";
            text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                source += text.slice(index, offset)
                    .replace(escaper, function(match) { return '\\' + escapes[match]; });

                if (escape) {
                    source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
                }
                if (interpolate) {
                    source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
                }
                if (evaluate) {
                    source += "';\n" + evaluate + "\n__p+='";
                }
                index = offset + match.length;
                return match;
            });
            source += "';\n";

            // If a variable is not specified, place data values in local scope.
            if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

            source = "var __t,__p='',__j=Array.prototype.join," +
                "print=function(){__p+=__j.call(arguments,'');};\n" +
                source + "return __p;\n";

            try {
                render = new Function(settings.variable || 'obj', '_', source);
            } catch (e) {
                e.source = source;
                throw e;
            }

            if (data) return render(data, _);

            // Provide the compiled function source as a convenience for precompilation.
            render.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

            return render;
        };

        function trim_spaces( a_string ){
            return a_string.replace( /^\s*/, "").replace( /\s*$/, "" );
        }

        require([ 'text!' + a_path ], function ( text ) {
            // parse sections...
            var x = text.split( /<%\!--(.+?)--\!%>/);

            function template( a_context ){
                return template._mainSection( a_context );
            }

            template._mainSection = _.template( x[ 0 ] );

            // for each section...
            for( var i = 1; i < x.length; i += 2 ){
                template[ trim_spaces( x[ i ] ) ] = _.template( x[ i + 1 ] );
            }

            onLoad( template );
        });
    }
});