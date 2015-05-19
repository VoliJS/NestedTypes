/*

AttrSpec required to implement two things:
    transform( value, options, model, name ) -> value
        may change model.__nestedChanges and model.changed

    isChanged( value1, value2 ) -> bool
        to detect whenever attribute must be assigned and counted as changed
 */


// Special case:
// single attribute change, no options, no nested changes

function setSingleAttr(model, key, value, attrSpec) {
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

function simulateAttrChange( model, attr ){
    // Extract attributes and options.
    var changing     = model._changing;
    model._changing  = true;

    var current = model.attributes,
        val = current[ attr ];

    if( !changing ){
        model._previousAttributes = new model.Attributes( current );
        model.changed = {};
    }

    model.changed[ attr ] = val;

    var options = {};

    model._pending = options;
    model.trigger( 'change:' + attr, model, val, options );

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

function genericIsChanged( a, b ){
    return !( a === b || ( typeof a == 'object' && a && typeof b == 'object' && b && _.isEqual( a, b ) ) );
}

function setManyAttrs( model, attrs, options ){
    var attr, unset, changes, silent, changing, prev, current;

    options || (options = {});

    // Run validation.
    if (!model._validate(attrs, options)) return false;

    // Extract attributes and options.
    unset           = options.unset;
    silent          = options.silent;
    changes         = [];
    changing        = model._changing;
    model._changing  = true;

    current = model.attributes;

    if (!changing) {
        model._previousAttributes = new model.Attributes( current );
        model.changed = {};
        model.__nestedChanges = {};
    }

    prev = model._previousAttributes;
    var nestedChanges = model.__nestedChanges;

    // Check for changes of `id`.
    if (model.idAttribute in attrs) model.id = attrs[model.idAttribute];

    var attrSpecs = model.__attributes, attrSpec, hasNestedChange;

    // For each `set` attribute, update or delete the current value.
    for (attr in attrs) {
        attrSpec = attrSpecs[ attr ];
        val = attrs[attr];
        isChanged = attrSpec ? attrSpec.isChanged : genericIsChanged;

        if ( isChanged( current[attr], val ) ) changes.push(attr);

        if ( isChanged( prev[attr], val ) ) {
            model.changed[attr] = val;
        } else {
            delete model.changed[attr];
        }

        unset ? delete current[attr] : current[attr] = val;
    }

    // Trigger all relevant attribute changes.
    if (!silent) {
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