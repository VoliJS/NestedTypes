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
+ Lazy REST store model - container of distinctive REST endpoints.
    + autoload items on first access
    + may clear and fetch items
+ base class for model, which is used as store.
+ delegate to store's sync

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

## Use cases
Now every page may define its own store, and fetch it with a single command.
```javascript

var Store = LazyStore.defaults({
  users : User.Collection,
  roles : Roles.Collection
});

var store = new Store();
store.fetch();
```

missing references will fall back to the global store. This store can override
values from the global store.

For the case of React, everything will be loaded automatically.
```javascript

React.createClass({
    Model : LazyStore,

    attributes : {
      users : User.Collection,
      roles : Roles.Collection      
    },

    render : function(){
      // just use elements in render.
      // it will trigger fetch on first access, with subsequent automatic update

      // fetch users, and update UI when they ready
      this.model.users;
    }
});

```
