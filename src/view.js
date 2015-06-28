var Backbone = require( './backbone+' ),
    Model    = require( './model' );

var viewOptions = [ 'attrs' ];

var viewSpec = Object.assign( {}, Backbone.View.prototype, {
    triggerWhenChanged : false,

    defaults : {
        className : '',
        tagName   : 'div',

        model : Model,

        el : Nested.value( null ).set( function( el ){
            this.undelegateEvents();
            this.$el = el instanceof Backbone.$ ? el : Backbone.$( el );
            return this.$el[ 0 ];
        } ),

        events : {}
    },

    // backward compatibility
    setElement : function( el ){
        this.el = el;
        return this;
    },

    constructor : function( attrs, options ){
        this._ensureElement();
        Model.call( this, arguments );

        this.listenTo( this, 'change:events', this.delegateEvents );
        this.listenTo( this, 'change:el', this.delegateEvents );
        this.listenTo( this, 'change', function(){
            var changed = this.changed;
            if( 'events' in changed || 'el' in changed ) this.delegateEvents();

            this.render();
        } );
    },

    tagName : 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $ : function( selector ){
        return this.$el.find( selector );
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize : function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render : function(){
        return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove : function(){
        this._removeElement();
        this.stopListening();
        return this;
    },

    // Remove this view's element from the document and all event listeners
    // attached to it. Exposed for subclasses using an alternative DOM
    // manipulation API.
    _removeElement : function(){
        this.$el.remove();
    },

    _setElement : function( el ){
        this.$el = el instanceof Backbone.$ ? el : Backbone.$( el );
        this.el  = this.$el[ 0 ];
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    delegateEvents : function( events ){
        if( !(events || (events = _.result( this, 'events' ))) ) return this;
        this.undelegateEvents();
        for( var key in events ){
            var method = events[ key ];
            if( !_.isFunction( method ) ) method = this[ events[ key ] ];
            if( !method ) continue;
            var match = key.match( delegateEventSplitter );
            this.delegate( match[ 1 ], match[ 2 ], _.bind( method, this ) );
        }
        return this;
    },

    // Add a single event listener to the view's element (or a child element
    // using `selector`). This only works for delegate-able events: not `focus`,
    // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
    delegate : function( eventName, selector, listener ){
        this.$el.on( eventName + '.delegateEvents' + this.cid, selector, listener );
    },

    // Clears all callbacks previously bound to the view by `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents : function(){
        if( this.$el ) this.$el.off( '.delegateEvents' + this.cid );
        return this;
    },

    // A finer-grained `undelegateEvents` for removing a single delegated event.
    // `selector` and `listener` are both optional.
    undelegate : function( eventName, selector, listener ){
        this.$el.off( eventName + '.delegateEvents' + this.cid, selector, listener );
    },

    // Produces a DOM element to be assigned to your view. Exposed for
    // subclasses using an alternative DOM manipulation API.
    _createElement : function( tagName ){
        return document.createElement( tagName );
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement : function(){
        var attrs = _.extend( {}, _.result( this, 'attributes' ) );
        if( this.id ) attrs.id = _.result( this, 'id' );
        if( this.className ) attrs[ 'class' ] = _.result( this, 'className' );
        this.setElement( this._createElement( _.result( this, 'tagName' ) ) );
        this._setAttributes( attrs );
    },

    _setAttributes : function( attributes ){
        this.$el.attr( attributes );
    }
} );

module.exports = Model.extend( viewSpec );