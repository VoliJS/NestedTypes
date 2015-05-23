
// Optimized Backbone Core functions
// =================================

/* AttrSpec required to implement two things:
    transform( value, options, model, name ) -> value

    isChanged( value1, value2 ) -> bool
        to detect whenever attribute must be assigned and counted as changed

    Model is required to implement Attributes constructor
 */

// trigger update for selected model attribute
function bbTriggerUpdate(model, key){
    bbSetSingleAttr( model, key, model.attributes[ key ], bbForceUpdateAttr );
}

var bbForceUpdateAttr = {
    isChanged : function(){ return true; },
    transform : function( x ){ return x; }
};

// Special case:
// single attribute change, no options, no nested changes
function bbSetSingleAttr(model, key, value, attrSpec) {
    'use strict';
    // Extract attributes and options.
    var changing     = model._changing;
    model._changing  = true;

    var current = model.attributes,
        isChanged = attrSpec.isChanged;

    if( !changing ){
        model._previousAttributes = new model.Attributes( current );
        model.changed = {};
    }

    var prev = model._previousAttributes;

    if ( key === model.idAttribute ) model.id = val;

    var val = attrSpec.transform( model, value );

    if( isChanged( prev[ key ], val) ){
        model.changed[ key ] = val;
    } else {
        delete model.changed[ key ];
    }

    var options = {};

    // Trigger all relevant attribute changes.
    if( isChanged( current[ key ], val ) ){
        current[ key ] = val;

        model._pending = options;
        model.trigger( 'change:' + key, model, val, options );
    }

    if( changing ) return model;

    while( model._pending ){
        options = model._pending;
        model._pending = false;
        model.trigger( 'change', model, options );
    }

    model._pending  = false;
    model._changing = false;
    return model;
}

var bbGenericAttr = {
    isChanged : function( a, b ){
        return !( a === b || ( a && b && typeof a == 'object' && typeof b == 'object' && _.isEqual( a, b ) ) );
    }
};

function bbSetAttrs( model, attrs, options ){
    'use strict';

    options || (options = {});

    // Run validation.
    if (!model._validate(attrs, options)) return false;

    // Extract attributes and options.
    var unset           = options.unset,
        silent          = options.silent,
        changes         = [],
        changing        = model._changing,
        current         = model.attributes,
        attrSpecs       = model.__attributes;

    model._changing  = true;

    if (!changing) {
        model._previousAttributes = new model.Attributes( current );
        model.changed = {};
        model.__nestedChanges = {};
    }

    var prev = model._previousAttributes;

    // Check for changes of `id`.
    if( model.idAttribute in attrs ) model.id = attrs[ model.idAttribute ];

    // For each `set` attribute, update or delete the current value.
    for( var attr in attrs ){
        var isChanged = ( attrSpecs[ attr ] || bbGenericAttr ).isChanged,
            val = attrs[ attr ];

        if ( isChanged( current[attr], val ) ) changes.push( attr );

        if ( isChanged( prev[attr], val ) ) {
            model.changed[attr] = val;
        } else {
            delete model.changed[attr];
        }

        unset ? delete current[attr] : current[ attr ] = val;
    }

    // Trigger all relevant attribute changes.
    if( !silent ) {
        if (changes.length) model._pending = options;
        for (var i = 0, l = changes.length; i < l; i++) {
            model.trigger('change:' + changes[i], model, current[changes[i]], options);
        }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return model;
    if (!silent) {
        while (model._pending) {
            options = model._pending;
            model._pending = false;
            model.trigger('change', model, options);
        }
    }

    model._pending = false;
    model._changing = false;

    return model;
}