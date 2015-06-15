# Nested.store
There's a global store for the collections, which might be useful in case of bi-directional relationships. It's available as a member of Model (this.store), and globally as Nested.store.

## Initialization
```javascript
Nested.store = {
    roles : Role.Collection,
    locations : Locations.Collection
};

var User = Nested.Model.extend({
    defaults : {
        name : String,
        roles : Collection.subsetOf( 'store.roles' ); // this.store.roles
        location : Location.from( 'store.locations' }); // this.store.locations
    }
});
```

Store needs to be initialized with a hash of collections and models type specs. It can be initialized several times.

Format of the spec object is the same as in `Model.defaults`.

## Lazy loading
On first access to every member of the store, it will fetch data from the server automatically. You need to take care of update events.

## Nested.store.fetch( 'attr1', ...)

Update all store members, which are currently loaded:

    `Nested.store.fetch()`

Fetches store elements with given names:

    `Nested.store.fetch( 'name1', 'name2', ... )`

Returns aggregate promise for xhr objects.

## Nested.clear( 'attr1', ... )

Clear all store collection elements:

`Nested.store.clear()`

Clear selected store collections:

`Nested.store.clear( 'name1', 'name2', ... )`

Returns store to allow chained calls.
