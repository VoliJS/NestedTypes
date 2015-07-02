(function( root, factory ){
    if( typeof exports === 'object' ){
        module.exports = factory( require( 'nestedtypes' ), require( 'react' ) );
    }
    else if( typeof define === 'function' && define.amd ){
        define( [ 'nestedtypes', 'react' ], factory );
    }
    else{
        root.React = factory( root.Nested, root.React );
    }
}( this, function( Nested, React ){
    // Wrapper for forceUpdate to be used in backbone events handlers
    function forceUpdate(){
        this.forceUpdate();
    }

    var UpdateOnProps = {
        componentDidMount : function(){
            var props    = this.props,
                updateOn = this.updateOnProps;

            for( var prop in updateOn ){
                var emitter = props[ prop ];
                emitter && this.listenTo( emitter, updateOn[ prop ], forceUpdate );
            }
        },

        componentWillUnmount : function(){
            var props    = this.props,
                updateOn = this.updateOnProps;

            for( var prop in updateOn ){
                var emitter = props[ prop ];
                emitter && this.stopListening( emitter );
            }
        }
    };

    var UpdateOnModel = {
        updateOnModel : 'change',

        componentWillMount : function(){
            this.model = new this.Model();
        },

        componentDidMount : function(){
            var events = this.updateOnModel;
            events && this.listenTo( this.model, events, forceUpdate );
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
            spec.mixins.push( Nested.Events );
        }

        return createClass.call( React, spec );
    };


    /**
     * React Backbone View Wrapper. Same as React.createElement
     * but returns Backbone.View
     *
     * Usage:
     *  var View = React.createView( MyReactClass, {
     *      prop1 : value1,
     *      prop2 : value2,
     *      ...
     *  });
     */
    React.createView = function(){
        return new ReactView( arguments );
    };

    var ReactView = Nested.View.extend({
        initialize : function( args ){
            // memorise arguments to pass to React
            this._args = args;
        },

        // cached react element...
        element : null,

        setElement : function(){
            // new element instance needs to be created on next render...
            this.element = null;
            return Nested.View.prototype.setElement( this, arguments );
        },

        // cached instance of react component...
        component : null,

        render : function(){
            this.element || ( this.element = React.createElement.apply( React, this._args ) );
            this.component = React.render( this.element, this.el );
        }
    });

    return React;
} ));
