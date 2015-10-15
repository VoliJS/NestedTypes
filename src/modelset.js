// Optimized Model.set functions
//---------------------------------
/*
 Does two main things:
 1) Invoke model-specific constructor for attributes cloning. It improves performance on large model updates.
 2) Invoke attribute-specific comparison function. Improves performance for everything, especially nested stuff.

 attrSpec is required to provide two methods:
 transform( value, options, model, name ) -> value
 to transform value before assignment

 isChanged( value1, value2 ) -> bool
 to detect whenever attribute must be assigned and counted as changed

 Model is required to implement Attributes constructor for attributes cloning.
 */

// Special case set: used from model's native properties.
// Single attribute change, no options, _no_ _nested_ _changes_ detection on deep update.
// 1) Code is stripped for this special case
// 2) attribute-specific transform function invoked internally

var _        = require( 'underscore' ),
    Events   = require( './backbone+' ).Events,
    error    = require( './errors' ),
    trigger2 = Events.trigger2,
    trigger3 = Events.trigger3;

module.exports = {
    isChanged     : genericIsChanged,
    setSingleAttr : setSingleAttr,
    setAttrs      : setAttrs,
    transaction   : transaction,
    transform     : applyTransform,
    __begin       : __begin,
    __commit      : __commit
};

function genericIsChanged( a, b ){
    return !( a === b || ( a && b && typeof a == 'object' && typeof b == 'object' && _.isEqual( a, b ) ) );
}

function setSingleAttr( model, key, value, attrSpec ){
    'use strict';
    var changing = model._changing,
        current  = model.attributes;

    model._changing = true;

    if( !changing ){
        model._previousAttributes = new model.Attributes( current );
        model.changed             = {};
    }

    var prev      = model._previousAttributes,
        options   = {},
        val       = attrSpec.transform( value, options, model, key ),
        isChanged = attrSpec.isChanged;

    isChanged( prev[ key ], val ) ? model.changed[ key ] = val : delete model.changed[ key ];

    if( isChanged( current[ key ], val ) ){
        current[ key ] = val;
        model._pending = options;
        trigger3( model, 'change:' + key, model, val, options );
    }

    if( changing ){
        return model;
    }

    while( model._pending ){
        options        = model._pending;
        model._pending = false;
        trigger2( model, 'change', model, options );
    }

    model._pending  = false;
    model._changing = false;
    return model;
}


// call a_fun with a_args inside of set transaction.
// model.set inside of a_fun will trigger change:attr
// but only single 'change' will be triggered at the end of transaction
// transactions can be nested
function transaction( a_fun, context, args ){
    var notChanging = !this._changing,
        options  = {};

    this._changing = true;


    if( notChanging ){
        this._previousAttributes = new this.Attributes( this.attributes );
        this.changed             = {};
    }

    this.__begin();
    var res = a_fun.apply( context || this, args );
    this.__commit();

    if( notChanging ){
        while( this._pending ){
            options       = this._pending;
            this._pending = false;
            trigger2( this, 'change', this, options );
        }

        this._pending  = false;
        this._changing = false;
    }

    return res;
}

// General case set: used for multiple and nested model/collection attributes.
// Does _not_ invoke attribute transform! It must be done at the the top level,
// due to the problems with current nested changes detection algorithm. See 'setAttrs' function below.
function bbSetAttrs( model, attrs, opts ){
    'use strict';
    var options = opts || {};

    // Run validation.
    if( !model._validate( attrs, options ) ){
        return false;
    }

    // Extract attributes and options.
    var unset     = options.unset,
        silent    = options.silent,
        changes   = [],
        changing  = model._changing,
        current   = model.attributes,
        attrSpecs = model.__attributes;

    model._changing = true;

    if( !changing ){
        model._previousAttributes = new model.Attributes( current );
        model.changed             = {};
    }

    var prev = model._previousAttributes;

    // For each `set` attribute, update or delete the current value.
    for( var attr in attrs ){
        var attrSpec  = attrSpecs[ attr ],
            isChanged = attrSpec ? attrSpec.isChanged : genericIsChanged,
            val       = attrs[ attr ];

        if( isChanged( current[ attr ], val ) ){
            changes.push( attr );
        }

        if( isChanged( prev[ attr ], val ) ){
            model.changed[ attr ] = val;
        }
        else{
            delete model.changed[ attr ];
        }

        unset ? delete current[ attr ] : current[ attr ] = val;
    }

    // Trigger all relevant attribute changes.
    if( !silent ){
        if( changes.length ){
            model._pending = options;
        }
        for( var i = 0, l = changes.length; i < l; i++ ){
            attr = changes[ i ];
            trigger3( model, 'change:' + attr, model, current[ attr ], options );
        }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if( changing ){
        return model;
    }
    if( !silent ){
        while( model._pending ){
            options        = model._pending;
            model._pending = false;
            trigger2( model, 'change', model, options );
        }
    }

    model._pending  = false;
    model._changing = false;

    return model;
}

// Optimized Backbone Core functions
// =================================
// Deep set model attributes, catching nested attributes changes
function setAttrs( model, attrs, options ){
    model.__begin();

    applyTransform( model, attrs, model.__attributes, options );

    model.__commit( attrs, options );

    return model;
}

// transform attributes hash
function applyTransform( model, attrs, attrSpecs, options ){
    for( var name in attrs ){
        var attrSpec = attrSpecs[ name ], value = attrs[ name ];
        if( attrSpec ){
            attrs[ name ] = attrSpec.transform( value, options, model, name );
        }
        else{
            error.unknownAttribute( model, name, value );
        }
    }
}

function __begin(){
    this.__duringSet++ || ( this.__nestedChanges = {} );
}

function __commit( a_attrs, options ){
    var attrs = a_attrs;

    if( !--this.__duringSet ){
        var nestedChanges = this.__nestedChanges,
            attributes    = this.attributes;

        attrs || ( attrs = {} );

        // Catch nested changes.
        for( var name in nestedChanges ){
            var value = name in attrs ? attrs[ name ] : attrs[ name ] = nestedChanges[ name ];

            if( value === attributes[ name ] ){
                // patch attributes to force change:name event
                attributes[ name ] = null;
            }
        }

        this.__nestedChanges = {};
    }

    if( attrs ){
        bbSetAttrs( this, attrs, options );
    }
}