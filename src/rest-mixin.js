/**
 * Backbone.js 1.2.3 REST implementation
 * (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Backbone may be freely distributed under the MIT license.
 *
 * With validation patches - NestedTypes validation semantic is applied. (c) Vlad Balin, 2015.
 */

exports.Model = {
    // Fetch the model from the server, merging the response with the model's
    // local attributes. Any changed attributes will trigger a "change" event.
    fetch : function( options ){
        options         = _.extend( { parse : true }, options );
        var model       = this;
        var success     = options.success;
        options.success = function( resp ){
            var serverAttrs = options.parse ? model.parse( resp, options ) : resp;
            model.set( serverAttrs, options );
            if( model._invalidate( options ) ) return false;

            if( success ) success.call( options.context, model, resp, options );
            model.trigger( 'sync', model, resp, options );
        };

        wrapError( this, options );
        return this.sync( 'read', this, options );
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync : function(){
        // Abort and pending IO request. Just one is allowed at the time.
        var _this = this;
        if( _this._xhr ){
            _this._xhr.abort();
        }

        return this._xhr = exports.sync.apply( this, arguments )
            .always( function(){ _this.xhr = void 0; });
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save : function( key, val, options ){
        // Handle both `"key", value` and `{key: value}` -style arguments.
        var attrs;
        if( key == null || typeof key === 'object' ){
            attrs   = key;
            options = val;
        }
        else{
            (attrs = {})[ key ] = val;
        }

        options  = _.extend( { validate : true, parse : true }, options );
        var wait = options.wait;

        // If we're not waiting and attributes exist, save acts as
        // `set(attr).save(null, opts)` with validation. Otherwise, check if
        // the model will be valid when the attributes, if any, are set.
        if( attrs && !wait ){
            this.set( attrs, options );
        }

        if( this._invalidate( options ) ){
            if( attrs && wait ) this.set( attrs, options );
            return exports.errorPromise( this.validationError );
        }

        // After a successful server-side save, the client is (optionally)
        // updated with the server-side state.
        var model       = this;
        var success     = options.success;
        var attributes  = this.attributes;
        options.success = function( resp ){
            // Ensure attributes are restored during synchronous saves.
            model.attributes = attributes;
            var serverAttrs  = options.parse ? model.parse( resp, options ) : resp;
            if( wait ) serverAttrs = _.extend( {}, attrs, serverAttrs );


            if( serverAttrs ){
                model.set( serverAttrs, options );
                if( model._invalidate( options ) ) return false;
            }

            if( success ) success.call( options.context, model, resp, options );
            model.trigger( 'sync', model, resp, options );
        };
        wrapError( this, options );

        // Set temporary attributes if `{wait: true}` to properly find new ids.
        if( attrs && wait ) this.attributes = _.extend( {}, attributes, attrs );

        var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
        if( method === 'patch' && !options.attrs ) options.attrs = attrs;
        var xhr = this.sync( method, this, options );

        // Restore attributes.
        this.attributes = attributes;

        return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy : function( options ){
        options     = options ? _.clone( options ) : {};
        var model   = this;
        var success = options.success;
        var wait    = options.wait;

        var destroy = function(){
            model.stopListening();
            model.trigger( 'destroy', model, model.collection, options );
        };

        options.success = function( resp ){
            if( wait ) destroy();
            if( success ) success.call( options.context, model, resp, options );
            if( !model.isNew() ) model.trigger( 'sync', model, resp, options );
        };

        var xhr = false;
        if( this.isNew() ){
            _.defer( options.success );
        }
        else{
            wrapError( this, options );
            xhr = this.sync( 'delete', this, options );
        }
        if( !wait ) destroy();
        return xhr;
    },

    urlRoot : '',

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url : function(){
        var base =
                _.result( this, 'urlRoot' ) ||
                _.result( this.collection, 'url' ) ||
                urlError();
        if( this.isNew() ) return base;
        var id = this.get( this.idAttribute );
        return base.replace( /[^\/]$/, '$&/' ) + encodeURIComponent( id );
    }
};

exports.Collection = {
    url : '',

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch : function( options ){
        options         = _.extend( { parse : true }, options );
        var success     = options.success;
        var collection  = this;
        options.success = function( resp ){
            var method = options.reset ? 'reset' : 'set';
            collection[ method ]( resp, options );
            if( collection._invalidate( options ) ) return false;

            if( success ) success.call( options.context, collection, resp, options );
            collection.trigger( 'sync', collection, resp, options );
        };

        wrapError( this, options );
        return this.sync( 'read', this, options );
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync : function(){
        return exports.sync.apply( this, arguments );
    }
};

// Throw an error when a URL is needed, and none is supplied.
function urlError(){
    throw new Error( 'A "url" property or function must be specified' );
}

// Wrap an optional error callback with a fallback error event.
function wrapError( model, options ){
    var error     = options.error;
    options.error = function( resp ){
        if( error ) error.call( options.context, model, resp, options );
        model.trigger( 'error', model, resp, options );
    };
}

// Backbone.sync
// -------------

// Override this function to change the manner in which Backbone persists
// models to the server. You will be passed the type of request, and the
// model in question. By default, makes a RESTful Ajax request
// to the model's `url()`. Some possible customizations could be:
//
// * Use `setTimeout` to batch rapid-fire updates into a single request.
// * Send up the models as XML instead of JSON.
// * Persist models via WebSockets instead of Ajax.
//
// Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
// as `POST`, with a `_method` parameter containing the true HTTP method,
// as well as all requests with the body as `application/x-www-form-urlencoded`
// instead of `application/json` with the model in a param named `model`.
// Useful when interfacing with server-side languages like **PHP** that make
// it difficult to read the body of `PUT` requests.
exports.sync = function( method, model, options ){
    var type = methodMap[ method ];
    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = { type : type, dataType : 'json' };

    // Ensure that we have a URL.
    if( !options.url ){
        params.url = _.result( model, 'url' ) || urlError();
    }

    // Ensure that we have the appropriate request data.
    if( options.data == null && model && (method === 'create' || method === 'update' || method === 'patch') ){
        params.contentType = 'application/json';
        params.data        = JSON.stringify( options.attrs || model.toJSON( options ) );
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if( options.emulateJSON ){
        params.contentType = 'application/x-www-form-urlencoded';
        params.data        = params.data ? { model : params.data } : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if( options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH') ){
        params.type = 'POST';
        if( options.emulateJSON ) params.data._method = type;
        var beforeSend     = options.beforeSend;
        options.beforeSend = function( xhr ){
            xhr.setRequestHeader( 'X-HTTP-Method-Override', type );
            if( beforeSend ) return beforeSend.apply( this, arguments );
        };
    }

    // Don't process data on a non-GET request.
    if( params.type !== 'GET' && !options.emulateJSON ){
        params.processData = false;
    }

    // Pass along `textStatus` and `errorThrown` from jQuery.
    var error     = options.error;
    options.error = function( xhr, textStatus, errorThrown ){
        options.textStatus  = textStatus;
        options.errorThrown = errorThrown;
        if( error ) error.call( options.context, xhr, textStatus, errorThrown );
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = exports.ajax( _.extend( params, options ) );
    model.trigger( 'request', model, xhr, options );
    return xhr;
};

// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
var methodMap = {
    'create' : 'POST',
    'update' : 'PUT',
    'patch'  : 'PATCH',
    'delete' : 'DELETE',
    'read'   : 'GET'
};

// Set the default implementation of `Backbone.ajax` to proxy through to `$`.
// Override this if you'd like to use a different library.
exports.ajax = function(){
    return exports.$.ajax.apply( exports.$, arguments );
};

exports.errorPromise = function( error ){
    var x = exports.$.Deferred();
    x.reject( error );
    return x;
};