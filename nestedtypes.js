// Backbone.nestedTypes 0.10.0 (https://github.com/Volicon/backbone.nestedTypes)
// (c) 2014 Vlad Balin & Volicon, may be freely distributed under the MIT license

// Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
// © 2011 Colin Snover <http://zetafleet.com>
// Released under MIT license.

// Global Mock for missing Integer data type...
// -------------------------------------
Integer = function( x ){ return x ? Math.round( x ) : 0; };

var Backbone = require( 'backbone' ),
    _        = require( 'underscore' );

require( './src/object+' );

var Events = require( './src/events+' ),
    trigger2 = Events.trigger2,
    trigger3 = Events.trigger3;

var modelSet = require( './src/modelset' ),
    bbSetSingleAttr = modelSet.setSingleAttr,
    bbSetAttrs = modelSet.setAttrs;

    // Optimized Backbone Core functions
    // =================================
    // Deep set model attributes, catching nested attributes changes
    function setAttrs( model, attrs, options ){
        model.__beginChange();
        applyTransform( model, attrs, model.__attributes, options );
        model.__commitChange( attrs, options );
        return model;
    }

    // transform attributes hash without apply
    function applyTransform( model, attrs, attrSpecs, options ){
        for( var name in attrs ){
            var attrSpec = attrSpecs[ name ], value = attrs[ name ];
            if( attrSpec ){
                attrs[ name ] = attrSpec.transform( value, options, model, name );
            }
            else exports.error.unknownAttribute( model, name, value );
        }
    }

    // Wire up Backbone and customisations
    // ===================================

    // Make Object.extend classes capable of sending and receiving Backbone Events...
    Object.assign( Object.extend.Class.prototype, Backbone.Events );

    // Override Backbone's objects .extend...
    [ 'Model', 'Collection', 'View', 'Router', 'History' ].forEach( function( name ){
        var BackboneType = Backbone[ name ];
        if( BackboneType ) Object.extend.attach( BackboneType );
    });

    exports.Class = Object.extend.Class;

    // Extend Object+ type errors with NestedTypes specific error types...
    exports.error = Object.assign( Object.extend.error, {
        argumentIsNotAnObject : function( context, value ){
            if( typeof value === 'string' ) value = '"' + value + '"';
            console.error( '[Type Error] Attribute hash is not an object in ' + context.__class + '.set(', value, '); this =', context );
            //throw new TypeError( 'Attribute hash is not an object in ' + context.__class + '.set(', value, ')' );
        },

        unknownAttribute : function( context, name, value ){
            if( typeof value === 'string' ) value = '"' + value + '"';
            context.suppressTypeErrors || console.warn( '[Type Error] Attribute has no default value in ' +
                                         context.__class + '.set( "' + name + '",', value, '); this =', context );
        },

        wrongCollectionSetArg : function( context, value ){
            if( typeof value === 'string' ) value = '"' + value + '"';
            console.error( '[Type Error] Wrong argument type in ' + context.__class + '.set(', value, '); this =', context );
            //throw new TypeError( 'Wrong argument type in ' + context.__class + '.set(' + value + ')' );
        }
    });

    // Nested Attribute and Options
    // ========================================
    exports.options = require( './src/attribute' );

    exports.defaults = function( x ){
        return exports.Model.defaults( x );
    };

    exports.value = function( value ){ return exports.options({ value: value }); };

    // Attribute Type definitions for core JS types
    // ============================================
    // Constructors Attribute
    // ----------------
    exports.options.Type.extend({
        cast : function( value ){
            return value == null || value instanceof this.type ? value : new this.type( value );
        },

        clone : function( value, options ){
            // delegate to clone function or deep clone through serialization
            return value.clone ? value.clone( value, options ) : this.cast( JSON.parse( JSON.stringify( value ) ) );
        }
    }).bind( Function.prototype );

    // Date Attribute
    // ----------------------
    ( function(){
        var numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ],
            msDatePattern = /\/Date\(([0-9]+)\)\//,
            isoDatePattern = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;

        function parseDate( date ){
            var msDate, timestamp, struct, minutesOffset = 0;

            if( msDate = msDatePattern.exec( date ) ){
                timestamp = Number( msDate[ 1 ] );
            }
            else if(( struct = isoDatePattern.exec( date ))) {
                // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
                for( var i = 0, k; ( k = numericKeys[i] ); ++i ) {
                    struct[ k ] = +struct[ k ] || 0;
                }

                // allow undefined days and months
                struct[ 2 ] = (+struct[ 2 ] || 1) - 1;
                struct[ 3 ] = +struct[ 3 ] || 1;

                if (struct[ 8 ] !== 'Z' && struct[ 9 ] !== undefined) {
                    minutesOffset = struct[ 10 ] * 60 + struct[ 11 ];

                    if (struct[ 9 ] === '+') {
                        minutesOffset = 0 - minutesOffset;
                    }
                }

                timestamp = Date.UTC(struct[ 1 ], struct[ 2 ], struct[ 3 ], struct[ 4 ], struct[ 5 ] + minutesOffset, struct[ 6 ], struct[ 7 ]);
            }
            else {
                timestamp = Date.parse( date );
            }

            return timestamp;
        }

        exports.options.Type.extend({
            cast : function( value ){
                return value == null || value instanceof Date ? value :
                    new Date( typeof value === 'string' ? parseDate( value ) : value )
            },

            toJSON : function( value ){ return value && value.toJSON(); },

            isChanged : function( a, b ){ return ( a && +a ) !== ( b && +b ); },
            clone : function( value ){ return new Date( +value ); }
        }).bind( Date );
    })();

    // Primitive Types
    // ----------------
    exports.options.Type.extend({
        create : function(){ return this.type(); },

        toJSON : function( value ){ return value; },
        cast : function( value ){ return value == null ? null : this.type( value ); },

        isChanged : function( a, b ){ return a !== b; },

        clone : function( value ){ return value; }
    }).bind( Number, Boolean, String, Integer );

    // Array Type
    // ---------------
    exports.options.Type.extend({
        toJSON : function( value ){ return value; },
        cast : function( value ){
            // Fix incompatible constructor behaviour of Array...
            return value == null || value instanceof Array ? value : [ value ];
        }
    }).bind( Array );

    // Nested Backbone Types
    // =========================

    // Nested Model Definition
    // -----------------------
    exports.Model = ( function(){
        var ModelProto = Backbone.Model.prototype;

        function cloneAttrs( attrSpecs, attrs, options ){
            for( var name in attrs ){
                attrs[ name ] = attrSpecs[ name ].clone( attrs[ name ], options );
            }

            return attrs;
        }

        var Model = Backbone.Model.extend({
            triggerWhenChanged: 'change',

            properties : {
                id : {
                    get : function(){
                        var name = this.idAttribute;

                        // TODO: get hook doesn't work for idAttribute === 'id'
                        return name === 'id' ? this.attributes.id : this[ name ];
                    },

                    set : function( value ){
                        var name = this.idAttribute;
                        bbSetSingleAttr( this, name, value, this.__attributes[ name ] );
                    }
                }
            },

            __attributes: { id : exports.options({ value : undefined } ).createAttribute( 'id' ) },
            __class : 'Model',

            __duringSet: 0,

            defaults : function(){ return {}; },

            __beginChange : function(){
                this.__duringSet++ || ( this.__nestedChanges = {} );
            },

            __commitChange : function( attrs, options ){
                if( !--this.__duringSet ){
                    attrs || ( attrs =  {} );

                    // Catch nested changes.
                    for( var name in this.__nestedChanges ){
                        name in attrs || ( attrs[ name ] = this.__nestedChanges[ name ] );

                        if( attrs[ name ] === this.attributes[ name ] ){
                            // patch attributes to force bbSetAttrs to trigger change event
                            this.attributes[ name ] = null;
                        }
                    }

                    this.__nestedChanges = {};
                }

                attrs && bbSetAttrs( this, attrs, options );
            },

            set : function( a, b, c ){
                switch( typeof a ){
                    case 'string' :
                        var attrSpec = this.__attributes[ a ];

                        if( attrSpec && !attrSpec.isBackboneType && !c ){
                            return bbSetSingleAttr( this, a, b, attrSpec );
                        }

                        var attrs = {};
                        attrs[ a ] = b;
                        return setAttrs( this, attrs, c );

                    case 'object' :
                        if( a && Object.getPrototypeOf( a ) === Object.prototype ) return setAttrs( this, a, b );

                    default :
                        exports.error.argumentIsNotAnObject( this, a );
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
                var path = name.split( '.' ),
                    l = path.length - 1,
                    model = this,
                    attr = path[ l ];

                for( var i = 0; i < l; i++ ){
                    var current = path[ i ],
                        next = model.get ? model.get( current ) : model[ current ];

                    // Create models in path, if they are not exist.
                    if( !next ){
                        var attrSpecs = model.__attributes;

                        if( attrSpecs ){
                            // If current object is model, create default attribute
                            var newModel = attrSpecs[ current ].create( options );

                            // If created object is model, nullify attributes when requested
                            if( options && options.nullify && newModel.__attributes ){
                                var nulls = new newModel.Attributes( {} );
                                for( var key in nulls ) nulls[ key ] = null;
                                newModel.set( nulls );
                            }

                            model[ current ] = next = newModel;
                        }
                        else return; // silently fail in other case
                    }
                    model = next;
                }

                return model.set ? model.set( attr, value, options ) : model[ attr ] = value;
            },

            constructor : function(attributes, options){
                var attrSpecs = this.__attributes,
                    attrs       = attributes || {};

                options || (options = {});
                this.cid        = _.uniqueId( 'c' );
                this.attributes = {};
                if( options.collection ) this.collection = options.collection;
                if( options.parse ) attrs = this.parse( attrs, options ) || {};

                if( typeof attrs !== 'object' || Object.getPrototypeOf( attrs ) !== Object.prototype ){
                    exports.error.argumentIsNotAnObject( this, attrs );
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
            get : function( name ){ return this[ name ]; },

            // override clone to pass options to constructor
            clone : function( options ){
                return new this.constructor( this.attributes, options );
            },

            // Create deep copy for all nested objects...
            deepClone : function(){ return this.clone({ deep : true }); },

            // Support for nested models and objects.
            // Apply toJSON recursively to produce correct JSON.
            toJSON : function(){
                var res = {},
                    attrs = this.attributes, attrSpecs = this.__attributes;

                for( var key in attrs ){
                    var value = attrs[ key ], attrSpec = attrSpecs[ key],
                        toJSON = attrSpec && attrSpec.toJSON;

                    if( toJSON ) res[ key ] = toJSON.call( this, value, key );
                }

                return res;
            },

            isValid : function( options ){
                // todo: need to do something smart with validation logic
                // something declarative on attributes level, may be
                return ModelProto.isValid.call( this, options ) && _.every( this.attributes, function( attr ){
                    if( attr && attr.isValid ) return attr.isValid( options );

                    return attr instanceof Date ? !_.isNaN( attr.getTime() ) : !_.isNaN( attr );
                });
            },

            _: _ // add underscore to be accessible in templates
        },{
            // shorthand for inline nested model definitions
            defaults : function( attrs ){ return this.extend({ defaults : attrs }); },

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
        });

        // Create model definition from protoProps spec.
        function createDefinition( protoProps, Base ){
            var defaults = protoProps.defaults || protoProps.attributes || {},
                defaultsAsFunction = typeof defaults == 'function' && defaults,
                baseAttrSpecs = Base.prototype.__attributes;

            // Support for legacy backbone defaults as functions.
            if( defaultsAsFunction ) defaults = defaults();

            var attrSpecs = Object.transform( {}, defaults, exports.options.create );

            // Create attribute for idAttribute, if it's not declared explicitly
            var idAttribute  = protoProps.idAttribute;
            if( idAttribute && !attrSpecs[ idAttribute ] ){
                attrSpecs[ idAttribute ] = exports.options({ value : undefined } ).createAttribute( idAttribute );
            }

            // Prevent conflict with backbone model's 'id' property
            if( attrSpecs[ 'id' ] ) attrSpecs[ 'id' ].createPropertySpec = false;

            var allAttrSpecs = _.defaults( {}, attrSpecs, baseAttrSpecs ),
                Attributes = createCloneCtor( allAttrSpecs );

            return _.extend( _.omit( protoProps, 'collection', 'attributes' ), {
                __attributes : new Attributes( allAttrSpecs ),
                defaults     : defaultsAsFunction || createDefaults( allAttrSpecs ),
                properties   : createAttrsNativeProps( protoProps.properties, attrSpecs ),
                Attributes   : Attributes
            });
        }

        // Create constructor for efficient attributes clone operation.
        function createCloneCtor( attrSpecs ){
            var statements = [];

            for( var name in attrSpecs ) statements.push( "this." + name + "=x." + name + ";" );

            var Attributes = new Function( "x", statements.join('') );

            // attributes hash must look like vanilla object, otherwise Model.set will trigger an exception
            Attributes.prototype = Object.prototype;

            return Attributes;
        }

        // Check if value is valid JSON.
        function isValidJSON( value ){
            if( value === null ) return true;

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
            });

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
                        if( name !== 'collection' && name !== 'parse' ) opts[ name ] = options[ name ];
                    }
                }

                var defaults = new Defaults( refs, init, opts );

                // assign attrs, overriding defaults
                for( var name in attrs ) defaults[ name ] = attrs[ name ];

                return defaults;
            }
        }

        // Create native properties for model's attributes
        function createAttrsNativeProps( properties, attrSpecs ){
            if( properties === false ) return {};

            properties || ( properties = {} );

            return Object.transform( properties, attrSpecs, function( attrSpec, name ){
                       if( !properties[ name ] && attrSpec.createPropertySpec )
                           return attrSpec.createPropertySpec();
                   });
        }

        return Model;
    })();

    // Nested Collection Definition
    // ----------------------------
    exports.Collection = exports.Model.Collection = ( function(){
        var Collection,
            CollectionProto = Backbone.Collection.prototype;

        function wrapCall( func ){
            return function(){
                if( !this.__changing++ ) this.trigger( 'before:change' );

                var res = func.apply( this, arguments );

                if( !--this.__changing ) this.trigger( 'after:change' );

				return res;
            };
        }

        Collection = Backbone.Collection.extend({
            triggerWhenChanged: Backbone.VERSION >= '1.2.0' ? 'update change reset' : 'add remove change reset',
            __class : 'Collection',

			model : exports.Model,

            isValid : function( options ){
                return this.every( function( model ){
                    return model.isValid( options );
                });
            },

            get: function(obj) {
                if (obj == null) return void 0;
                return typeof obj === 'object' ? this._byId[obj.id] || this._byId[obj.cid] : this._byId[ obj ];
            },

            deepClone : function(){ return this.clone({ deep : true }); },

            clone: function( options ){
                var models = options && options.deep ?
                    this.map( function( model ){
                        return model.clone( options );
                    } ) : this.models;

                return new this.constructor( models );
            },

            __changing: 0,

            set: wrapCall( function( models, options ){
                if( models ){
                    if( typeof models !== 'object' ||
                        !( models instanceof Array || models instanceof exports.Model || Object.getPrototypeOf( models ) === Object.prototype ) ){
                        exports.error.wrongCollectionSetArg( this, models );
                    }
                }

                return CollectionProto.set.call( this, models, options );
            }),

            remove : wrapCall( CollectionProto.remove ),
            add    : wrapCall( CollectionProto.add ),
            reset  : wrapCall( CollectionProto.reset ),
            sort   : wrapCall( CollectionProto.sort ),

            getModelIds : function(){ return _.pluck( this.models, 'id' ); }
        },{
            // Cache for subsetOf collection subclass.
            __subsetOf : null,
            defaults : function( attrs ){
                return this.prototype.model.extend({ defaults : attrs }).Collection;
            },
            extend : function(){
                // Need to subsetOf cache when extending the collection
                var This = Backbone.Collection.extend.apply( this, arguments );
                This.__subsetOf = null;
                return This;
            }
        });

        return Collection;
    })();

    // Backbone Attribute
    // ----------------

    // helper attrSpec mock to force attribute update
    var bbForceUpdateAttr = new ( exports.options.Type.extend({
        isChanged : function(){ return true; }
    }));

    exports.options.Type.extend({
        create : function( options ){ return new this.type( null, options ); },
        clone : function( value, options ){ return value && value.clone( options ); },
        toJSON : function( value ){ return value && value.toJSON(); },

        isChanged : function( a, b ){ return a !== b; },

        isBackboneType : true,
        isModel : true,

        createPropertySpec : function(){
            // if there are nested changes detection enabled, disable optimized setter
            if( this.__events ){
                return ( function( self, name, get ){
                    return {
                        set : function( value ){
                            var attrs = {};
                            attrs[ name ] = value;
                            setAttrs( this, attrs );
                        },

                        get : get ? function(){ return get.call( this, this.attributes[ name ], name ); } :
                            function(){ return this.attributes[ name ]; }
                    }
                } )( this, this.name, this.get );
            }
            else return exports.options.Type.prototype.createPropertySpec.call( this );
        },

        cast : function( value, options, model, name ){
            var incompatibleType = value != null && !( value instanceof this.type ),
                existingModelOrCollection = model.attributes[ name ];

            if( incompatibleType ){
                if( existingModelOrCollection ){ // ...delegate update for existing object 'set' method
                    if( options && options.parse && this.isModel ){ // handle inconsistent backbone's parse implementation
                        value = existingModelOrCollection.parse( value );
                    }

                    existingModelOrCollection.set( value, options );
                    value = existingModelOrCollection;
                }
                else{ // ...or create a new object, if it's not exist
                    value = new this.type( value, options );
                }
            }

            return value;
        },

        initialize : function( spec ){
            var name = this.name,
                triggerWhenChanged = this.triggerWhenChanged || spec.type.prototype.triggerWhenChanged;

            this.isModel = this.type.prototype instanceof exports.Model;

            if( triggerWhenChanged ){
                // for collection, add transactional methods to join change events on bubbling
                this.__events = this.isModel ? {} : {
                    'before:change' : exports.Model.prototype.__beginChange,
                    'after:change'  : exports.Model.prototype.__commitChange
                };

                this.__events[ triggerWhenChanged ] = function handleNestedChange(){
                    var attr = this.attributes[ name ];

                    if( this.__duringSet ){
                        this.__nestedChanges[ name ] = attr;
                    }
                    else{
                        bbSetSingleAttr( this, name, attr, bbForceUpdateAttr );
                    }
                };
            }
        }
    }).bind( exports.Model, exports.Collection );

    // Nested Relations
    //=================

    var _store = null;

    function parseReference( collectionRef ){
        switch( typeof collectionRef ){
            case 'function' : return collectionRef;
            case 'object'   : return function(){ return collectionRef; };
            case 'string'   : return new Function( 'return this.' + collectionRef );
        }
    }

    exports.Model.from = exports.Model.From = exports.Model.RefTo = ( function(){
        return function( masterCollection ){
            var getMaster = parseReference( masterCollection );

            function clone( value ){
                return value && typeof value === 'object' ? value.id : value;
            }

            var ModelRefAttribute = exports.options.Type.extend({
                toJSON : clone,
                clone  : clone,

                isChanged : function( a, b ){
                    // refs are equal when their id is equal.
                    var aId = a && typeof a == 'object' ? a.id : a,
                        bId = b && typeof b == 'object' ? b.id : b;

                    return aId !== bId;
                },

                get : function( objOrId, name ){
                    if( typeof objOrId !== 'object' ){
                        // Resolve reference.
                        var master = getMaster.call( this );

                        if( master && master.length ){
                            // Silently update attribute with object form master.
                            objOrId = master.get( objOrId ) || null;
                            this.attributes[ name ] = objOrId;

                            // Subscribe for events manually. delegateEvents won't be invoked.
                            var attrSpec = this.__attributes[ name ];
                            objOrId && attrSpec.events && this.listenTo( objOrId, attrSpec.events );
                        }
                        else{
                            objOrId = null;
                        }
                    }

                    return objOrId;
                }
            });

            var options = exports.options({ value : null });
            options.Attribute = ModelRefAttribute; //todo: consider moving this to the attrSpec
            return options;
        };
    })();

    exports.Collection.SubsetOf = exports.Collection.subsetOf = exports.Collection.RefsTo = ( function(){
        var CollectionProto = exports.Collection.prototype;

        var refsCollectionSpec = {
            triggerWhenChanged : Backbone.VERSION >= '1.2.0' ? 'update reset' : 'add remove reset', // don't bubble changes from models
            __class : 'Collection.SubsetOf',

            resolvedWith : null,
            refs : null,

            toJSON : function(){
                return this.refs || _.pluck( this.models, 'id' );
            },

            clone : function( options ){
                var copy = CollectionProto.clone.call( this, _.omit( options, 'deep' ) );
                copy.resolvedWith = this.resolvedWith;
                copy.refs = this.refs;

                return copy;
            },

            parse : function( raw ){
                var models = [];

                if( this.resolvedWith ){
                    models = _.compact( _.map( raw, function( id ){
                        return this.resolvedWith.get( id );
                    }, this ) );
                }
                else{
                    this.refs = raw;
                }

                return models;
            },

            toggle : function( modelOrId ){
                var model = this.resolvedWith.get( modelOrId );

                if( this.get( model ) ){
                    this.remove( model );
                }
                else{
                    this.add( model );
                }
            },

            addAll : function(){
                this.reset( this.resolvedWith.models );
            },
            removeAll : function(){
                this.reset();
            },
            justOne : function( arg ){
                var model = arg instanceof Backbone.Model ? arg : this.resolvedWith.get( arg );
                this.set( [ model ] );
            },
            set : function( models, upperOptions ){
                var options = { merge : false };

                if( models ){
                if( models instanceof Array && models.length && typeof models[ 0 ] !== 'object' ){
                        options.merge = options.parse = true;
                    }
                }

                CollectionProto.set.call( this, models, _.defaults( options, upperOptions ) );
            },

            resolve : function( collection ){
                if( collection && collection.length ){
                    this.resolvedWith = collection;

                    if( this.refs ){
                        this.reset( this.refs, { silent : true } );
                        this.refs = null;
                    }
                }

                return this;
            }
        };

        return function( masterCollection ){
            var SubsetOf = this.__subsetOf || ( this.__subsetOf = this.extend( refsCollectionSpec ) );
            var getMaster = parseReference( masterCollection );

            return exports.options({
                type : SubsetOf,

                get : function( refs ){
                    !refs || refs.resolvedWith || refs.resolve( getMaster.call( this ) );
                    return refs;
                }
            });
        };
    })();

    Object.defineProperty( exports, 'store', {
        set : function( spec ){
            _.each( spec, function( Type, name ){
                Type.options && ( spec[ name ] = Type.options({
                    get : function( value ){
                        if( !this.resolved[ name ] ){
                            value.fetch && value.fetch();
                            this.resolved[ name ] = true;
                        }

                        return value;
                    },

                    set : function( value ){
                        value.length || ( this.resolved[ name ] = false );
                        return value;
                    }
                }) );
            });

            var $ = Backbone.$;

            var Cache = exports.Model.extend({
                attributes : spec,
                resolved : {},

                initialize : function(){
                    this.resolved = {};
                    this.installHooks();
                },
                installHooks : function(){
                    var self = this;

                    _.each( this.attributes, function( element, name ){
                        if( !element ) return;
                        var fetch = element.fetch;
                        if( fetch ){
                            element.fetch = function(){
                                self.resolved[ name ] = true;
                                return fetch.apply( this, arguments );
                            }
                        }

                        if( element instanceof exports.Collection && element.length ){
                            this.resolved[ name ] = true;
                        }
                    }, this );
                },

                fetch : function(){
                    var xhr = [],
                        objsToFetch = arguments.length ? arguments : _.keys( this.resolved );

                    _.each( objsToFetch, function( name ){
                        var attr = this.attributes[ name ];
                        attr.fetch && xhr.push( attr.fetch() );
                    }, this );

                    return $ && $.when && $.when.apply( Backbone.$, xhr );
                },

                clear : function(){
                    var attrs = this.defaults();
                    arguments.length && ( attrs = _.pick( attrs, _.toArray( arguments ) ) );
                    this.set( attrs );
                    this.installHooks();
                    return this;
                }
            });

            exports.Model.prototype.store = _store = new Cache();
        },

        get : function(){
            return _store;
        }
    });
