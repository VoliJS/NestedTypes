# Dynamic Store

This proposal relies on object's ownership backreferences, and dynamically
resolve references to store traversing onwership graph to the top.

Basically, in this proposal stores implemented using few orthogonal features.
+ models ownerhip with traversable back references
    - `_owner` property for Model and Collection.
    - Backbone objects first assigned to model attributes hold back reference
    to the owner. It's removed when objects are removed.
+ chained vocabulary lookups in model.get
    + there's chained lookup inside of model's get if special property is provided.
+ store locator in models and collections
    + getStore() method returns closest store performing ownership traversal.
    + for references started from `store.*` locator and `get` are used.
- REST store model - container of distinctive REST endpoints.
    - autoload items on first access
    - may clear and fetch items
+ base class for model, which is used as store.
+ delegate to store's sync

(?) Root model without owner might be treated as store (?)

If no store located, global store is used.

When store object is found, it cached in collections.

When resource is resolved in store, search must traverse store hierarchy.

```javascript
    var Admin = RestStore.extend({
        defaults : {
          roles : Role.Collection,
          users : User.Collection,
          channelSets : ChannelSet.Collection      
        }
    });

    var S = Store.extend({
      defaults : {
        roles : Role.Collection,
        users : User.Collection,
        channelSets : ChannelSet.Collection      
      }
    });

    Model.from( 'store.sdefr')
```

In this case, store lookup algorithm is totally dynamic.
When ref starts with 'store.', it resolve it traversing ownership to the first
available store, and using `deepGet` in order to resolve the rest of the reference.

resolved store reference is cached in collections.

'store.my.path' -> function();
```javascript
function resolveStore(){
  // if we're owned by the model, ask it for the store.
  var owner = this.__owner;
  if( owner ) return owner.resolveStore();

  // if we're owned by collection, ask it for the store.
  var collection = this.collection;
  if( collection ){
      return collection._store || ( collection._store = collection._owner ? collection._owner.resolveStore() : this._defaultStore );
  }

  // otherwise, use global store.
  return this._defaultStore;
}

// updated compile function...
function compile( str ){
  var path = str.split( '.' );
  if( path[ 0 ] === 'store' ){
    path[ 0 ] = 'resolveStore()';
    path[ 1 ] = 'get("' + path[ 1 ] + '")';
  }

  return new Function( 'self', 'return self.' + path.join( '.' ) + ';' );
}

// store's get function...
function get( attr ){
  var res = this[ attr ];
  return res === void 0 && this._parentStore ? this._parentStore.get( attr ) : res;
}
```
