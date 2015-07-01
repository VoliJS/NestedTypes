(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require('nestedtypes'), require('react'), require('backbone') );
    }
    else if(typeof define === 'function' && define.amd) {
        define(['nestedtypes', 'react', 'backbone' ], factory);
    }
    else {
        root.React = factory(root.Nested, root.React, root.Backbone );
    }
}(this, function( Nested, React, Backbone ) {
    // Wrapper for forceUpdate to be used in backbone events handlers
    function forceUpdate(){
        this.forceUpdate();
    }

    var Listener = {
        componentWillMount : function(){
            var props = this.props,
                updateOn = this.updateOnProps;

            for( var prop in updateOn ){
                this.listenTo( props[ prop ], updateOn[ prop ], forceUpdate );
            }

            if( this.Model ){
                this.model = new this.Model();
                this.listenTo( this.model, 'change', forceUpdate );
            }
        },

        componentWillUnmount : function(){
            var props = this.props,
                updateOn = this.updateOnProps;

            for( var prop in updateOn ){
                this.stopListening( props[ prop ] );
            }

            if( this.Model ){
                this.stopListening( this.model );
                this.model = null;
            }
        }
    };

    Object.assign( Listener, Backbone.Events );

    function createClass( spec ){
        spec.mixins || ( spec.mixins = [] );

        if( !spec.Model ){
            var model = null;

            for( var i = spec.mixins.length - 1; i >= 0; i-- ){
                var mixin = spec.mixins[ i ];
                if( mixin.model ){
                    model || ( model = {} );
                    Object.assign( model, mixin.model );
                }
            }

            if( spec.model ){
                if( model ){
                    Object.assign( model, spec.model );
                }
                else{
                    model = spec.model;
                }

                delete spec.model;
            }

            spec.Model = model ? Nested.Model.defaults( spec.model ) : null;
        }

        spec.mixins.push( Listener );

        return React.createClass.call( this, spec );
    }

    React.createStatefulClass = createClass;
    return React;
}));
