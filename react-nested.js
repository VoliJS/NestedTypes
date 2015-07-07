/**
 * React-Backbone.Glue 0.1.0 <https://github.com/Volicon/react-backbone.glue>
 * (c) 2015 Vlad Balin & Volicon
 * Released under MIT @license
 */
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
}( this, function reactBackboneGlue( Backbone, React ){
    // Object.assign polyfill

    Object.assign || ( Object.assign = function( target, firstSource ){
        if( target == null ){
            throw new TypeError( 'Cannot convert first argument to object' );
        }

        var to = Object( target );
        for( var i = 1; i < arguments.length; i++ ){
            var nextSource = arguments[ i ];
            if( nextSource == null ){
                continue;
            }

            var keysArray = Object.keys( Object( nextSource ) );
            for( var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++ ){
                var nextKey = keysArray[ nextIndex ];
                var desc = Object.getOwnPropertyDescriptor( nextSource, nextKey );
                if( desc !== void 0 && desc.enumerable ){
                    to[ nextKey ] = nextSource[ nextKey ];
                }
            }
        }
        return to;
    });

    // Wrapper for forceUpdate to be used in backbone events handlers
    function forceUpdate(){
        this.forceUpdate();
    }

    var ListenToProps = {
        componentDidMount : function(){
            var props    = this.props,
                updateOn = this.listenToProps;

            for( var prop in updateOn ){
                var emitter = props[ prop ];
                emitter && this.listenTo( emitter, updateOn[ prop ], forceUpdate );
            }
        },

        componentWillUnmount : function(){
            var props    = this.props,
                updateOn = this.listenToProps;

            for( var prop in updateOn ){
                var emitter = props[ prop ];
                emitter && this.stopListening( emitter );
            }
        }
    };

    var ModelState = {
        listenToState : 'change',

        getInitialState : function(){
            return new this.Model();
        },

        componentDidMount : function(){
            var events = this.listenToState;
            events && this.listenTo( this.state, events, forceUpdate );
        },

        componentWillUnmount : function(){
            this.stopListening( this.state );
            this.state = null;
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
            var BaseModel = spec.Model || Backbone.Model;
            spec.Model = BaseModel.extend({ defaults : attributes });
        }

        if( spec.Model ){
            spec.mixins.unshift( ModelState );
        }

        if( spec.listenToProps ){
            spec.mixins.unshift( ListenToProps );
        }

        if( spec.Model || spec.listenToProps ){
            spec.mixins.push( Backbone.Events );
        }

        var component = createClass.call( React, spec );
        component.createView = createView;
        return component;
    };

    var slice = Array.prototype.slice;

    function createView(){
        var args = slice.call( arguments );
        args.unshift( this );
        return new ReactView( args );
    }

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

    var ReactView = Backbone.View.extend({
        initialize : function( args ){
            // memorise arguments to pass to React
            this._args = args;
        },

        // cached react element...
        element : null,

        setElement : function(){
            // new element instance needs to be created on next render...
            if( this.element ){
                this.element = null;

                if( this.component && this.component.trigger ){
                    this.stopListening( this.component );
                }

                this.component = null;
            }

            return Backbone.View.prototype.setElement.apply( this, arguments );
        },

        // cached instance of react component...
        component : null,

        render : function(){
            if( !this.element ){
                this.element = React.createElement.apply( React, this._args );
            }

            var firstCall = !this.component;
            this.component = React.render( this.element, this.el );

            if( firstCall ){
                this.component.trigger && this.listenTo( this.component, 'all', function(){
                    this.trigger.apply( this, arguments );
                });
            }
        }
    });

    React.subview = React.createClass({
        displayName : 'BackboneView',

        propTypes : {
            View : React.PropTypes.func.isRequired,
            options : React.PropTypes.object
        },

        render : function(){
            return React.DOM.div({
                ref : 'subview',
                className : this.props.className
            });
        },

        componentDidMount : function(){
            var el = this.refs.subview.getDOMNode(),
                p = this.props;

            var view = this.view = p.options ? new p.View( p.options ) : new p.View();
            view.setElement( el );
            view.render();
        },

        componentDidUpdate : function(){
            this.view.render();
        },

        componentWillUnmount : function(){
            var view = this.view;
            if( view.dispose ) view.dispose();
        }
    });

    return React;
} ));