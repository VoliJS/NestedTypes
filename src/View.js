define( function( require ){
    'use strict';
    var Chaplin = require( "chaplin" );

    return Chaplin.View.extend({

        template: function(){
            return "<h1>Under Construction</h1>";
        },

        getTemplateFunction: function(){
            return this.template;
        },

        getTemplateData: function(){
            return this.model;
        },

        attach: function(){
            Chaplin.View.prototype.attach.apply( this, arguments );

            if( this.$el.parent().length > 0 )
                this.$el.parent().trigger( "ChildAttached" );
        },

        remove: function(){
            var parent = this.$el.parent();
            Chaplin.View.prototype.remove.apply( this, arguments );

            if( parent.length > 0 )
                parent.trigger( "ChildRemoved" );

        },

        /*
         Register subviews for composite views for correct disposal.
         - Take hash of views as an argument.
         - Register subviews with chaplin, attach them as direct view members.
         */
        subview: function( a_subviews, a_justShow ){
            // override chaplin 'subview' method for the case of single argument...
            if( _.isObject( a_subviews ) && arguments.length === 1 ){

                _.each( a_subviews, function( view, name ){
                    if( this[ name ] ){
                        this[ name ].$el.detach();
                        this.stopListening( this[ name ] );
                    }

                    if( !a_justShow ){
                        this.subview( name, view );

                        this.listenTo( view, 'all', function(){
                            this.trigger.apply( this, arguments );
                        });
                    }

                    this[ name ] = view;

                    // try to attach it to the DOM...
                    var $view = this.$( '[subview="' + name + '"]' );
                    if( $view.length ){
                        $view.append( view.el );
                    }

                }, this );

            }
            else{
                // use implementation from the base class...
                return Chaplin.View.prototype.subview.apply( this, arguments );
            }

            return this;
        },

        /*
         - Attach subviews to the DOM tree
         */
        show: function( binding ){
            return this.subview( binding, true );
        },

        /*
         - Render view template
         - If subviews are not passed, render subviews
         - If subviews are passed, attach subviews to the DOM
         */
        render: function( a_first ){
            // render own template...
            Chaplin.View.prototype.render.apply( this, arguments );

            // grab subview slots...
            var self = this,
                initialize = a_first === 'initialize';

            this.$( "[subview]" ).each( function(){
                var $this = $( this ),
                    name = $this.attr( 'subview' );
				
                $this.append( self[ name ].el );

                if( !initialize ){ // don't render subviews in initialize, they are already rendered.
                    self[ name ].render( a_first );
                }
            });

            return this;
        }
    });
});