import { Collection, define, definitions, mixinRules, Model, tools } from 'type-r';
import * as _ from 'underscore';
import Sync, { Restful, SyncOptions } from './sync';

const { defaults } = tools;

export interface RestOptions extends SyncOptions {
    wait? : boolean
    patch? : boolean
    reset? : boolean
    validate? : boolean
}

@define({
    itemEvents : {
        destroy( model ){ this.remove( model ); }
    } 
})
export class RestCollection extends Collection<RestModel> implements Restful {
    _xhr : JQueryXHR

    dispose(){
        if( this._xhr && this._xhr.abort ) this._xhr.abort();
        super.dispose();
    }

    model : typeof RestModel
    url() : string { return this.model.prototype.urlRoot || ''; }

    _invalidate( options : { validate? : boolean } ) : boolean {
        var error;
        if( options.validate && ( error = this.validationError ) ){
            this.trigger( 'invalid', this, error, _.extend( { validationError : error }, options ) );
            return true;
        }
    }

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch( options : RestOptions ) : any {
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
        return _sync( 'read', this, options );
    }

    create( a_model, options : any = {} ) : RestModel {
        const model : RestModel = a_model instanceof RestModel ?
                                        a_model :
                                        <any> this.model.create( a_model, options );

        // Hack! For the situation when model instance is given, aquire it. 
        model._owner || ( model._owner = this );

        options.wait || this.add([ model ], options );

        var collection  = this;
        var success     = options.success;
        options.success = ( model, resp, callbackOpts ) =>{
            if( options.wait ) this.add( [ model ], defaults({ parse : false }, callbackOpts ) );
            if( success ) success.call( callbackOpts.context, model, resp, callbackOpts );
        };

        model.save( null, options );
        return model;
    }

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync(){
        return Sync.sync.apply( this, arguments );
    }
};

const modelProto = Model.prototype;

@define({
    urlRoot : ''
})
@definitions({
    urlRoot : mixinRules.protoValue
})
export class RestModel extends Model implements Restful {
    static Collection : typeof Collection = RestCollection as any;
    
    _xhr : JQueryXHR

    urlRoot : string

    /** @private */
    _invalidate( options : { validate? : boolean } ) : boolean {
        var error;
        if( options.validate && ( error = this.validationError ) ){
            triggerAndBubble( this, 'invalid', this, error, _.extend( { validationError : error }, options ) );
            return true;
        }
    }

    dispose(){
        if( this._xhr && this._xhr.abort ) this._xhr.abort();
        super.dispose();
    }

    // Fetch the model from the server, merging the response with the model's
    // local attributes. Any changed attributes will trigger a "change" event.
    fetch( options? : RestOptions ) : any {
        options         = _.extend( { parse : true }, options );
        var model       = this;
        var success     = options.success;
        options.success = function( serverAttrs ){
            model.set( serverAttrs, options );
            if( model._invalidate( options ) ) return false;

            if( success ) success.call( options.context, model, serverAttrs, options );
            triggerAndBubble( model, 'sync', model, serverAttrs, options );
        };

        wrapError( this, options );
        return _sync( 'read', this, options );
    }

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync( method : string, self : this, options : SyncOptions ) : any
    sync() : JQueryXHR {
        return Sync.sync.apply( this, arguments );
    }

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save( attrs? : {}, options? : RestOptions ) : any
    save( key : string, value : any, options? : RestOptions ) : any
    save( key, val, a_options? : RestOptions ) : any {
        // Handle both `"key", value` and `{key: value}` -style arguments.
        let attrs, originalOptions;

        if( key == null || typeof key === 'object' ){
            attrs   = key;
            originalOptions = val || {};
        }
        else{
            (attrs = {})[ key ] = val;
            originalOptions = a_options || {};
        }

        const options = _.extend( { validate : true, parse : true }, originalOptions ),
              wait = options.wait;

        // If we're not waiting and attributes exist, save acts as
        // `set(attr).save(null, opts)` with validation. Otherwise, check if
        // the model will be valid when the attributes, if any, are set.
        if( attrs && !wait ){
            this.set( attrs, originalOptions );
        }

        if( this._invalidate( options ) ){
            if( attrs && wait ) this.set( attrs, originalOptions );
            return Sync.errorPromise( this.validationError );
        }

        // After a successful server-side save, the client is (optionally)
        // updated with the server-side state.
        var model       = this;
        var success     = options.success;
        var attributes  = this.attributes;
        options.success = serverAttrs => {
            // Ensure attributes are restored during synchronous saves.
            model.attributes = attributes;
            if( wait ) serverAttrs = _.extend( {}, attrs, serverAttrs );

            if( serverAttrs ){
                // When server sends string, polimorphyc Model set screws up.
                modelProto.set.call( this, serverAttrs, options );
                if( model._invalidate( options ) ) return false;
            }

            if( success ) success.call( options.context, model, serverAttrs, options );
            triggerAndBubble( model, 'sync', model, serverAttrs, options );
        };

        wrapError( this, options );

        // Set temporary attributes if `{wait: true}` to properly find new ids.
        if( attrs && wait ) this.attributes = _.extend( {}, attributes, attrs );

        var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
        if( method === 'patch' && !options.attrs ) options.attrs = attrs;
        var xhr = _sync( method, this, options );

        // Restore attributes.
        this.attributes = attributes;

        return xhr;
    }

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy( options : RestOptions ) : any {
        options     = options ? _.clone( options ) : {};
        var model   = this;
        var success = options.success;
        var wait    = options.wait;

        var destroy = function(){
            model.stopListening(); // TBD: figure out whenever we need to dispose the model.
            model.trigger( 'destroy', model, model.collection, options );
        };

        options.success = function( resp ){
            if( wait ) destroy();
            if( success ) success.call( options.context, model, resp, options );
            if( !model.isNew() ) triggerAndBubble( model, 'sync', model, resp, options );
        };

        var xhr : JQueryXHR;

        if( this.isNew() ){
            _.defer( options.success );
        }
        else{
            wrapError( this, options );
            xhr = _sync( 'delete', this, options );
        }

        if( !wait ) destroy();
        
        return xhr || false;
    }

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url() : string {
        var base =
                _.result( this, 'urlRoot' ) ||
                _.result( this.collection, 'url' ) ||
                Sync.urlError();

        if( this.isNew() ) return base;

        var id = this.get( this.idAttribute );

        return base.replace( /[^\/]$/, '$&/' ) + encodeURIComponent( id );
    }

    set( key : string, value : any, options? : object ) : this
    set( attrs : {}, options? : object ) : this
    set( a, b?, c? ) : this {
        if( typeof a === 'string' ){
            if( c ){
                return <this> super.set({ [ a ] : b }, c );
            }
            else{
                this[ a ] = b;
                return this;
            } 
        }
        else{
            return <this> super.set( a, b );
        }
    }
}

function _sync( method : string, _this : Restful, options ) : JQueryXHR {
    // Abort and pending IO request. Just one is allowed at the time.
    _this._xhr && _this._xhr.abort && _this._xhr.abort();
    const xhr = _this._xhr = _this.sync( method, _this, options );
    xhr && xhr.always && xhr.always( function(){ _this._xhr = void 0; });
    return xhr;
}

// Wrap an optional error callback with a fallback error event.
function wrapError( model : any, options : RestOptions ){
    var error     = options.error;
    options.error = function( resp ){
        if( error ) error.call( options.context, model, resp, options );
        triggerAndBubble( model, 'error', model, resp, options );
    };
}

function triggerAndBubble( model : any, ...args : any[] ){
    model.trigger.apply( model, args );
    const { collection } = model;
    collection && collection.trigger.apply( collection, args ); 
}