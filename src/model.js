var BaseModel   = require( './backbone+' ).Model,
    modelSet    = require( './modelset' ),
    attrOptions = require( './attribute' ),
    error       = require( './errors' ),
    _           = require( 'underscore' ),
    ModelProto  = BaseModel.prototype;

var setSingleAttr = modelSet.setSingleAttr,
    setAttrs        = modelSet.setAttrs,
    applyTransform  = modelSet.transform;

function cloneAttrs( attrSpecs, attrs, options ){
    for( var name in attrs ){
        attrs[ name ] = attrSpecs[ name ].clone( attrs[ name ], options );
    }

    return attrs;
}

var Model = BaseModel.extend( {
    triggerWhenChanged : 'change',

    properties : {
        id : {
            get : function(){
                var name = this.idAttribute;

                // TODO: get hook doesn't work for idAttribute === 'id'
                return name === 'id' ? this.attributes.id : this[ name ];
            },

            set : function( value ){
                var name = this.idAttribute;
                setSingleAttr( this, name, value, this.__attributes[ name ] );
            }
        }
    },

    getStore : function(){
        var owner = this._owner || this.collection;
        return owner ? owner.getStore() : this._defaultStore;
    },

    sync : function(){
        return this.getStore().sync.apply( this, arguments );
    },

    _owner : null,

    __attributes : { id : attrOptions( { value : undefined } ).createAttribute( 'id' ) },
    __class      : 'Model',

    __duringSet : 0,

    defaults : function(){ return {}; },

    __begin  : modelSet.__begin,
    __commit : modelSet.__commit,

    transaction : modelSet.transaction,

    set : function( a, b, c ){
        switch( typeof a ){
        case 'string' :
            var attrSpec = this.__attributes[ a ];

            if( attrSpec && !attrSpec.isBackboneType && !c ){
                return setSingleAttr( this, a, b, attrSpec );
            }

            var attrs = {};
            attrs[ a ] = b;
            return setAttrs( this, attrs, c );

        case 'object' :
            if( a && Object.getPrototypeOf( a ) === Object.prototype ){
                return setAttrs( this, a, b );
            }

        default :
            error.argumentIsNotAnObject( this, a );
        }
    },

    // Return model's value for dot-separated 'deep reference'.
    // Model id and cid are allowed for collection elements.
    // If path is not exist, 'undefined' is returned.
    // model.deepGet( 'a.b.c123.x' )
    deepGet : function( name ){
        var path = name.split( '.' ), value = this;

        for( var i = 0, l = path.length; value && i < l; i++ ){
            value = value.get ? value.get( path[ i ] ) : value[ path[ i ] ];
        }

        return value;
    },

    // Set model's value for dot separated 'deep reference'.
    // If model doesn't exist at some path, create default models
    // if options.nullify is given, assign attributes with nulls
    deepSet : function( name, value, options ){
        var path  = name.split( '.' ),
            l     = path.length - 1,
            model = this,
            attr  = path[ l ];

        for( var i = 0; i < l; i++ ){
            var current = path[ i ],
                next    = model.get ? model.get( current ) : model[ current ];

            // Create models in path, if they are not exist.
            if( !next ){
                var attrSpecs = model.__attributes;

                if( attrSpecs ){
                    // If current object is model, create default attribute
                    var newModel = attrSpecs[ current ].create( options );

                    // If created object is model, nullify attributes when requested
                    if( options && options.nullify && newModel.__attributes ){
                        var nulls = new newModel.Attributes( {} );
                        for( var key in nulls ){
                            nulls[ key ] = null;
                        }
                        newModel.set( nulls );
                    }

                    model[ current ] = next = newModel;
                }
                else{
                    return;
                } // silently fail in other case
            }
            model = next;
        }

        return model.set ? model.set( attr, value, options ) : model[ attr ] = value;
    },

    constructor : function( attributes, opts ){
        var attrSpecs = this.__attributes,
            attrs     = attributes || {},
            options   = opts || {};

        this.__duringSet = 0;
        this.attributes = {};
        if( options.collection ) this.collection = options.collection;
        this.cid = _.uniqueId( 'c' );

        if( options.parse ){
            attrs = this.parse( attrs, options ) || {};
        }

        if( typeof attrs !== 'object' || Object.getPrototypeOf( attrs ) !== Object.prototype ){
            error.argumentIsNotAnObject( this, attrs );
            attrs = {};
        }

        attrs = options.deep ?
                cloneAttrs( attrSpecs, new this.Attributes( attrs ), options ) :
                this.defaults( attrs, options );

        // Execute attributes transform function instead of this.set
        applyTransform( this, attrs, attrSpecs, options );

        this.attributes = attrs;
        this.changed = {};
        this.initialize.apply( this, arguments );
    },
    // override get to invoke native getter...
    get         : function( name ){ return this[ name ]; },

    // override clone to pass options to constructor
    clone : function( options ){
        return new this.constructor( this.attributes, options );
    },

    // Create deep copy for all nested objects...
    deepClone : function(){ return this.clone( { deep : true } ); },

    // Support for nested models and objects.
    // Apply toJSON recursively to produce correct JSON.
    toJSON : function(){
        var res   = {},
            attrs = this.attributes, attrSpecs = this.__attributes;

        for( var key in attrs ){
            var value  = attrs[ key ], attrSpec = attrSpecs[ key ],
                toJSON = attrSpec && attrSpec.toJSON;

            if( toJSON ){
                res[ key ] = toJSON.call( this, value, key );
            }
        }

        return res;
    },

    parse  : function( resp ){ return this._parse( resp ); },
    _parse : _.identity,

    isValid : function( options ){
        // todo: need to do something smart with validation logic
        // something declarative on attributes level, may be
        return ModelProto.isValid.call( this, options ) && _.every( this.attributes, function( attr ){
                if( attr && attr.isValid ){
                    return attr.isValid( options );
                }

                return attr instanceof Date ? !_.isNaN( attr.getTime() ) : !_.isNaN( attr );
            } );
    },

    _ : _ // add underscore to be accessible in templates
}, {
    // shorthand for inline nested model definitions
    defaults : function( attrs ){ return this.extend( { defaults : attrs } ); },

    // extend Model and its Collection
    extend : function( protoProps, staticProps ){
        var This = Object.extend.call( this );
        This.Collection = this.Collection.extend();
        return protoProps ? This.define( protoProps, staticProps ) : This;
    },

    // define Model and its Collection. All the magic starts here.
    define : function( protoProps, staticProps ){
        var Base = Object.getPrototypeOf( this.prototype ).constructor,
            spec = createDefinition( protoProps, Base ),
            This = this;

        Object.extend.Class.define.call( This, spec, staticProps );

        // define Collection
        var collectionSpec = { model : This };
        spec.urlRoot && ( collectionSpec.url = spec.urlRoot );
        This.Collection.define( _.defaults( protoProps.collection || {}, collectionSpec ) );

        return This;
    }
} );

// Create model definition from protoProps spec.
function createDefinition( protoProps, Base ){
    var defaults           = protoProps.defaults || protoProps.attributes || {},
        defaultsAsFunction = typeof defaults == 'function' && defaults,
        baseAttrSpecs      = Base.prototype.__attributes;

    // Support for legacy backbone defaults as functions.
    if( defaultsAsFunction ){
        defaults = defaults();
    }

    var attrSpecs = Object.transform( {}, defaults, attrOptions.create );

    // Create attribute for idAttribute, if it's not declared explicitly
    var idAttribute = protoProps.idAttribute;
    if( idAttribute && !attrSpecs[ idAttribute ] ){
        attrSpecs[ idAttribute ] = attrOptions( { value : undefined } ).createAttribute( idAttribute );
    }

    // Prevent conflict with backbone model's 'id' property
    if( attrSpecs[ 'id' ] ){
        attrSpecs[ 'id' ].createPropertySpec = false;
    }

    var allAttrSpecs = _.defaults( {}, attrSpecs, baseAttrSpecs ),
        Attributes   = createCloneCtor( allAttrSpecs );

    return _.extend( _.omit( protoProps, 'collection', 'attributes' ), {
        __attributes : new Attributes( allAttrSpecs ),
        _parse       : create_parse( allAttrSpecs, attrSpecs ) || Base.prototype._parse,
        defaults     : defaultsAsFunction || createDefaults( allAttrSpecs ),
        properties   : createAttrsNativeProps( protoProps.properties, attrSpecs ),
        Attributes   : Attributes
    } );
}

// Create attributes 'parse' option function only if local 'parse' options present.
// Otherwise return null.
function create_parse( allAttrSpecs, attrSpecs ){
    var statements = [ 'var a = this.__attributes;' ],
        create = false;

    for( var name in allAttrSpecs ){
        // Is there any 'parse' option in local model definition?
        if( attrSpecs[ name ] && attrSpecs[ name ].parse ) create = true;

        // Add statement for each attribute with 'parse' option.
        if( allAttrSpecs[ name ].parse ){
            var s = 'if("' + name + '" in r) r.' + name + '=a.' + name + '.parse.call(this,r.' + name + ',"' + name + '");';
            statements.push( s );
        }
    }

    statements.push( 'return r;' );

    return create ? new Function( 'r', statements.join( '' ) ) : null;
}

// Create constructor for efficient attributes clone operation.
function createCloneCtor( attrSpecs ){
    var statements = [];

    for( var name in attrSpecs ){
        statements.push( "this." + name + "=x." + name + ";" );
    }

    var Attributes = new Function( "x", statements.join( '' ) );

    // attributes hash must look like vanilla object, otherwise Model.set will trigger an exception
    Attributes.prototype = Object.prototype;

    return Attributes;
}

// Check if value is valid JSON.
function isValidJSON( value ){
    if( value === null ){
        return true;
    }

    switch( typeof value ){
    case 'number' :
    case 'string' :
    case 'boolean' :
        return true;

    case 'object':
        var proto = Object.getPrototypeOf( value );

        if( proto === Object.prototype || proto === Array.prototype ){
            return _.every( value, isValidJSON );
        }
    }

    return false;
}

// Create optimized model.defaults( attrs, options ) function
function createDefaults( attrSpecs ){
    var statements = [], init = {}, refs = {};

    // Compile optimized constructor function for efficient deep copy of JSON literals in defaults.
    _.each( attrSpecs, function( attrSpec, name ){
        if( attrSpec.value === undefined && attrSpec.type ){
            // if type with no value is given, create an empty object
            init[ name ] = attrSpec;
            statements.push( 'this.' + name + '=i.' + name + '.create( o );' );
        }
        else{
            // If value is given, type casting logic will do the job later, converting value to the proper type.
            if( isValidJSON( attrSpec.value ) ){
                // JSON literals must be deep copied.
                statements.push( 'this.' + name + '=' + JSON.stringify( attrSpec.value ) + ';' );
            }
            else if( attrSpec.value === undefined ){
                // handle undefined value separately. Usual case for model ids.
                statements.push( 'this.' + name + '=undefined;' );
            }
            else{
                // otherwise, copy value by reference.
                refs[ name ] = attrSpec.value;
                statements.push( 'this.' + name + '=r.' + name + ';' );
            }

        }
    } );

    var Defaults = new Function( 'r', 'i', 'o', statements.join( '' ) );
    Defaults.prototype = Object.prototype;

    // Create model.defaults( attrs, options ) function
    // 'attrs' will override default values, options will be passed to nested backbone types
    return function( attrs, options ){
        var opts = options, name;

        // 'collection' and 'parse' options must not be passed down to default nested models and collections
        if( options && ( options.collection || options.parse ) ){
            opts = {};
            for( name in options ){
                if( name !== 'collection' && name !== 'parse' ){
                    opts[ name ] = options[ name ];
                }
            }
        }

        var defaults = new Defaults( refs, init, opts );

        // assign attrs, overriding defaults
        for( var name in attrs ){
            defaults[ name ] = attrs[ name ];
        }

        return defaults;
    }
}

// Create native properties for model's attributes
function createAttrsNativeProps( properties, attrSpecs ){
    if( properties === false ){
        return {};
    }

    properties || ( properties = {} );

    return Object.transform( properties, attrSpecs, function( attrSpec, name ){
        if( !properties[ name ] && attrSpec.createPropertySpec ){
            return attrSpec.createPropertySpec();
        }
    } );
}

module.exports = Model;
