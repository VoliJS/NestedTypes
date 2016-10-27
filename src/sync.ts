/**
 * Backbone.js 1.2.3 REST implementation
 * (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Backbone may be freely distributed under the MIT license.
 *
 * With validation patches - NestedTypes validation semantic is applied. (c) Vlad Balin, 2015.
 */
import * as _ from 'underscore'
import * as Backbone from './backbone'

import { tools } from '../type-r/src'
const { defaults } = tools;

export type LazyValue< T > = () => T | T;

// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
export type Method = 'create' | 'update' | 'patch' | 'delete' | 'read'    

export interface Restful {
    trigger( event : string, model, xhr, options )
    collection? : { trigger( event : string, model, xhr, options ) }
    toJSON( options : any ) : {}
    _xhr : JQueryPromise< any >
    sync( method : string, object : Restful, options : SyncOptions )
}

export interface SyncOptions {
    url? : LazyValue< string >
    data? : any
    emulateJSON? : boolean
    emulateHTTP? : boolean
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


export let $ = Backbone.$;
    
export let errorPromise = function( error ){
    var x = $.Deferred();
    x.reject( error );
    return x;
}

// Set the default implementation of `Backbone.ajax` to proxy through to `$`.
// Override this if you'd like to use a different library.
export let ajax : ( options : {} ) => any = function(){
    return $.ajax.apply( $, arguments );
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
export let sync = function( method : Method, model : Restful, options : SyncOptions = {} ) : JQueryXHR{
    var type = methodMap[ method ];
    // Default options, unless specified.
    defaults( options, {
        emulateHTTP: Backbone.emulateHTTP,
        emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params : any = { type : type, dataType : 'json' };

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
    var xhr = options.xhr = ajax( _.extend( params, options ) );
    model.trigger( 'request', model, xhr, options );
    model.collection && model.collection.trigger( 'request', model, xhr, options );
    return xhr;
}


// Throw an error when a URL is needed, and none is supplied.
export function urlError(){
    throw new Error( 'A "url" property or function must be specified' );
}