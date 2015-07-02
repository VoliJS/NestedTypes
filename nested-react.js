(function( root, factory ){
    if( typeof exports === 'object' ){
        module.exports = factory( require( 'nestedtypes' ), require( 'react' ), require( 'backbone' ) );
    }
    else if( typeof define === 'function' && define.amd ){
        define( [ 'nestedtypes', 'react', 'backbone' ], factory );
    }
    else{
        root.React = factory( root.Nested, root.React, root.Backbone );
    }
}( this, function( Nested, React, Backbone ){
    // Wrapper for forceUpdate to be used in backbone events handlers
    function forceUpdate(){
        this.forceUpdate();
    }

    var UpdateOnProps = {
        componentDidMount : function(){
            var props    = this.props,
                updateOn = this.updateOnProps;

            for( var prop in updateOn ){
                this.listenTo( props[ prop ], updateOn[ prop ], forceUpdate );
            }
        },

        componentWillUnmount : function(){
            var props    = this.props,
                updateOn = this.updateOnProps;

            for( var prop in updateOn ){
                this.stopListening( props[ prop ] );
            }
        }
    };

    var UpdateOnModel = {
        componentWillMount : function(){
            this.model = new this.Model();
        },

        componentDidMount : function(){
            this.listenTo( this.model, 'change', forceUpdate );
        },

        componentWillUnmount : function(){
            this.stopListening( this.model );
            this.model = null;
        }
    };

    function getModelAttributes( spec ){
        var attributes = null;

        for( var i = spec.mixins.length - 1; i >= 0; i-- ){
            var mixin = spec.mixins[ i ];
            if( mixin.attributes ){
                attributes || ( attributes = {} );
                Object.assign( attributes, mixin.attributes );
            }
        }

        if( spec.attributes ){
            if( attributes ){
                Object.assign( attributes, spec.attributes );
            }
            else{
                attributes = spec.attributes;
            }
        }

        return attributes;
    }

    var createClass = React.createClass;

    React.createClass = function( spec ){
        spec.mixins || ( spec.mixins = [] );

        var attributes = getModelAttributes( spec );
        if( attributes ){
            var BaseModel = spec.Model || Nested.Model;
            spec.Model = BaseModel.defaults( spec.model );
        }

        if( spec.Model ){
            spec.mixins.unshift( UpdateOnModel );
        }

        if( spec.updateOnProps ){
            spec.mixins.unshift( UpdateOnProps );
        }

        if( spec.Model || spec.updateOnProps ){
            spec.mixins.push( Backbone.Events );
        }

        return createClass.call( React, spec );
    };

    return React;
} ));
