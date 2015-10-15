// Nested Relations
//=================

var bbVersion  = require( 'backbone' ).VERSION,
    attribute  = require( './attribute' ),
    Collection = require( './collection' ),
    _          = require( 'underscore' );

function parseReference( collectionRef ){
    switch( typeof collectionRef ){
    case 'function' :
        return collectionRef;
    case 'object'   :
        return function(){ return collectionRef; };
    case 'string'   :
        return new Function( 'return this.' + collectionRef );
    }
}

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
    } );

    var options = attribute( { value : null } );
    options.Attribute = ModelRefAttribute; //todo: consider moving this to the attrSpec
    return options;
};

var CollectionProto = Collection.prototype;

var refsCollectionSpec = {
    triggerWhenChanged : bbVersion >= '1.2.0' ? 'update reset' : 'add remove reset', // don't bubble changes from models
    __class            : 'Collection.SubsetOf',

    resolvedWith : null,
    refs         : null,

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

    toggle : function( modelOrId, inSet ){
        var model = this.resolvedWith.get( modelOrId ),
            toggle = inSet === void 0;

        if( this.get( model ) ){
            if( toggle || !inSet ) this.remove( model );
        }
        else{
            if( toggle || inSet ) this.add( model );
        }
    },

    addAll    : function(){
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

    justOne   : function( arg ){
        var model = arg instanceof Backbone.Model ? arg : this.resolvedWith.get( arg );
        this.set( [ model ] );
    },

    set       : function( models, upperOptions ){
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

exports.subsetOf = function( masterCollection ){
    var SubsetOf = this.__subsetOf || ( this.__subsetOf = this.extend( refsCollectionSpec ) );
    var getMaster = parseReference( masterCollection );

    return attribute( {
        type : SubsetOf,

        get : function( refs ){
            !refs || refs.resolvedWith || refs.resolve( getMaster.call( this ) );
            return refs;
        }
    } );
};
