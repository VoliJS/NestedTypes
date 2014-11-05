var relations = require( 'nestedrelations' );

relations.initialize({
    users : User.Collection, // all properties will be lazy loaded
    roles : Role.Collection,
    some  : Model
});

var relations = {
    initialize : function( spec ){
        _.each( spec, function( name ){
            spec[ name ].options && spec[ name ].options({
                get : function( value ){
                    if( !this.resolved[ name ] ){
                        value.fetch && value.fetch();
                        this.resolved[ name ] = true;
                    }

                    return value;
                },

                set : function( value ){
                    value.length || ( this.resolved.name = false );
                    return value;
                }
            });
        });

        var Cache = Nested.Model.extend({
            attributes : spec,
            resolved : {},

            initialize : function(){
                this.resolved = {};
            }

            fetch : function(){
                _.each( this.resolved, function( dontUse, name ){
                    var attr = this.attributes[ name ];
                    attr.fetch && attr.fetch();
                });
            }
        });

        return Nested.Model.prototype._relations = this.cache = new Cache();
    },


}
