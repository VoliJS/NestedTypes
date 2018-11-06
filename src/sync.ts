/**
 * Backbone.js 1.2.3 REST implementation
 * (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Backbone may be freely distributed under the MIT license.
 *
 * With validation patches - NestedTypes validation semantic is applied. (c) Vlad Balin, 2015.
 */
import * as _ from 'underscore';
import Backbone from './backbone';

export type LazyValue< T > = () => T | T;

// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
export type Method = 'create' | 'update' | 'patch' | 'delete' | 'read'    

export interface Restful {
    trigger( event : string, model, xhr, options )
    collection? : { trigger( event : string, model, xhr, options ) }
    toJSON( options : any ) : {}
    _xhr : JQueryXHR
    sync( method : string, object : Restful, options : SyncOptions )
}

export interface SyncOptions {
    url? : LazyValue< string >
    data? : any
    attrs? : {}
    beforeSend? : ( xhr ) => any

    success? : ( resp : any ) => void
    error? : ( xhr?, textStatus?, errorThrown? ) => void

    textStatus? : string
    errorThrown? : any
    xhr? : any
    context? : {}
}

const methodMap = {
    'create' : 'POST',
    'update' : 'PUT',
    'patch'  : 'PATCH',
    'delete' : 'DELETE',
    'read'   : 'GET'
};

const exported = {
    $ : Backbone.$,
    
    errorPromise : error => {
        var x = $.Deferred();
        x.reject( error );
        return x;
    },

    // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
    // Override this if you'd like to use a different library.
    ajax : function( options : {} ){
        return $.ajax.apply( $, arguments );
    },

    sync,

    // Throw an error when a URL is needed, and none is supplied.
    urlError : function(){
        throw new Error( 'A "url" property or function must be specified' );
    }
};

export default exported;

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

function sync( method : Method, model : Restful, options : SyncOptions = {} ) : JQueryXHR{
    var type = methodMap[ method ];

    // Default JSON-request options.
    var params : any = { type : type, dataType : 'json' };

    // Ensure that we have a URL.
    if( !options.url ){
        params.url = _.result( model, 'url' ) || exported.urlError();
    }

    // Ensure that we have the appropriate request data.
    if( options.data == null && model && (method === 'create' || method === 'update' || method === 'patch') ){
        params.contentType = 'application/json';
        params.data        = JSON.stringify( options.attrs || model.toJSON( options ) );
    }

    // Don't process data on a non-GET request.
    if( params.type !== 'GET' ){
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
    var xhr = options.xhr = exported.ajax( _.extend( params, options ) );
    model.trigger( 'request', model, xhr, options );
    model.collection && model.collection.trigger( 'request', model, xhr, options );
    return xhr;
}