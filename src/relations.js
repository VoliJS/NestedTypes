// Nested Relations
//=================

var bbVersion  = require( './backbone+' ).VERSION,
    attribute  = require( './attribute' ),
    error      = require( './errors' ),
    Collection = require( './collection' ),
    _          = require( 'underscore' );

function parseReference( collectionRef ){
    switch( typeof collectionRef ){
        case 'function' :
            return collectionRef;
        case 'object'   :
            return function(){ return collectionRef; };
        case 'string'   :
            var path = collectionRef
                .replace( /\^/g, 'getOwner().' )
                .replace( /^\~/, 'store.' )
                .replace( /^store\.(\w+)/, 'getStore().get("$1")' );

            return new Function( 'return this.' + path );
    }
}

exports.parseReference = parseReference;

var TakeAttribute = attribute.Type.extend( {
    clone     : function( value ){ return value; },
    isChanged : function( a, b ){ return a !== b; },
    set       : function( value, name ){
        if( !value ) return null;

        error.hardRefNotAssignable( this, name, value );
    },

    _update : function( val, options, model, attr ){
        return this.delegateEvents( this.cast( val, options, model, attr ), options, model, attr );
    }
} );

exports.take = function( reference ){
    var getMaster = parseReference( reference );

    var options = attribute( {
        value  : null,
        toJSON : false,
        type   : this,
        get    : function( ref, name ){
            if( !ref ){
                // Resolve reference.
                var value = getMaster.call( this );

                if( value ){
                    // Silently update attribute with object from master.
                    // Subscribe for all events...
                    var attrSpec = this.__attributes[ name ];
                    return this.attributes[ name ] = attrSpec._update( value, {}, this, name );
                }
            }

            return ref;
        }
    } );

    options.Attribute = TakeAttribute;
    return options;
};

exports.from = function( masterCollection ){
    var getMaster = parseReference( masterCollection );

    function clone( value ){
        return value && typeof value === 'object' ? value.id : value;
    }

    var ModelRefAttribute = attribute.Type.extend( {
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
                    objOrId                 = master.get( objOrId ) || null;
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
    } );

    var options       = attribute( { value : null } );
    options.Attribute = ModelRefAttribute; //todo: consider moving this to the attrSpec
    return options;
};

var CollectionProto = Collection.prototype;

var refsCollectionSpec = {
    _listenToChanges : 'update reset', // don't bubble changes from models
    __class          : 'Collection.SubsetOf',

    resolvedWith : null,
    refs         : null,

    toJSON : function(){
        return this.refs || _.pluck( this.models, 'id' );
    },

    clone : function( options ){
        var copy          = CollectionProto.clone.call( this, _.omit( options, 'deep' ) );
        copy.resolvedWith = this.resolvedWith;
        copy.refs         = this.refs;

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

    toggle : function( modelOrId, val ){
        var model = this.resolvedWith.get( modelOrId );
        return CollectionProto.toggle.call( this, model, val );
    },

    addAll : function(){
        this.reset( this.resolvedWith.models );
    },

    removeAll : function(){
        this.reset();
    },

    toggleAll : function(){
        if( this.length ){
            this.removeAll();
        }
        else{
            this.addAll();
        }
    },

    getModelIds : function(){ return this.refs || _.pluck( this.models, 'id' ); },

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

    reset : function( models, upperOptions ){
        var options = { merge : false };

        if( models ){
            if( models instanceof Array && models.length && typeof models[ 0 ] !== 'object' ){
                options.merge = options.parse = true;
            }
        }

        CollectionProto.reset.call( this, models, _.defaults( options, upperOptions ) );
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

exports.subsetOf = function( masterCollection ){
    var SubsetOf  = this.__subsetOf || ( this.__subsetOf = this.extend( refsCollectionSpec ) );
    var getMaster = parseReference( masterCollection );

    return attribute( {
        type : SubsetOf,

        get : function( refs ){
            !refs || refs.resolvedWith || refs.resolve( getMaster.call( this ) );
            return refs;
        }
    } );
};
