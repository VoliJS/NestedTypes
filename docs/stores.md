# Stores design guidlines

- Store - is generalization of the session/api, and group of linked collections.
- Store consists of a bunch of collections and models, drives reference resolution,
  and define the protocol for their fetching, saving, and real-time updates.
- There might be multiple stores in the system. They are linked in hierarchy,
  performing look-ups for missing items in upper stores.

Main store in the system - is 'session' object. It:
- can perform login and logout
- knows information about current session (user, activity, etc)
- may know some additional data
- performs real-time updates.

(!) There might be special reference resolution algorithm, knowing about stores.
    If item is not present in store, it will perform look-up in the parent store. (!)

(!) Store hierarchy might be either explicit (store inside of the store),
    or implicit (store requires another store definition). (!)
    (!) Implicit is better, cause it guaranteed that solely reused code
    will be correct. It forces singleton stores, though  (!)

(!) We might override 'get' for the store, and use 'get' in reference resolution.
    It will allow us ti build 'vocabulary chain' (!)

(!) Idea about store assigning itself to collections is not good. Impossible to
    handle deep references.

(!) Idea for generic ownership information might be not that bad. Lookup for closest
    store can be optimized by caching nearest store reference in lower level nodes.
    Let's say, inside of collections (and other stores).

Ideally, it would be great to have an abitily to create multiple instances of
the same store dynamically.

Ideally, if the same models and collections might be used in different stores.

Ideally, stores defines I/O protocol, while models provide serialization mechanics.

In this ideal world, there are multiple types of stores will exists:
- Store, consisting of independent REST api points. That's what store we have now do.
- Read-only store, loading its content in one REST operation, and pull itself for updates.
  In fact, it's regular model.
- Store, loading and updating itself in real time through WS. That's interesting.
   For that, models and collections must delegate sync to store.

   To generalize it, store is the model/collection which handles I/O. And there
   is special kind of model (store), handling other stores.

   There must be some general way of distinguishing stores from regular models.
   Store-capable model/collection must be able to participate as member too.

   For example:
      // create collection store, where both model and collection is capable of saving themselves.
      var collection = new Model.Collection.Store();
      collection.fetch();


And in this sense, every model and especially collection now is store. What we
can do for the start - delegate I/O to the collection. Pair model/collection
defines simplest store.

(?) What about defining that stores using JSX (?)
var my = (
    )

Bad. What about using JSX for linking stores with HTML?

<Store type={ MyStore } fetch="users roles">
    ...
</Store>


(!) It might render inner stuff when everything is loaded, fetch data, and update
subtree when specified models are changed. Or, lower level:

<Update listenTo={ model } events="something">

</Update>

Good! (!)

(!) What about combining it with fetch?
<FetchAndListen store={ model } items="a b c">

</FetchAndListen>

It might be very good idea (!) In fact, very-very good.
- it hides everything when data are not ready.
- render when everything is complete
- updates when selected events are fired.

Declarative spec of data dependency, in render, always better.

## Examples

Two kinds of stores. 'Live' r/o, and REST r/w.

'session' store, used as read-only 'live' store, the master one.
it includes 'users' store, containing schema for users and roles.

separate store for editing encoders, as REST R/W store.

var Admin = Store.extend({
    defaults : {
      roles : Role.Collection,
      users : User.Collection,
      channelSets : ChannelSet.Collection      
    },

    master : api
});

In this case, store lookup algorithm is totally dynamic.
When ref starts with 'store.', it resolve it traversing ownership to the first
available store, and using `deepGet` in order to resolve the rest of the reference.

resolved store reference is cached in collections.

'store.my.path' -> function();
```javascript
function resolveStore(){
  // if we're owned by collection, ask it for the store.
  if( this.collection ) return this.collection.resolveStore();

  // if we're owned by the model, ask it for the store.
  if( this._owner ) return  this._owner.resolveStore();

  // otherwise, use global store.
  return this._defaultStore;
}

// in collection
function resolveStore(){
  return this._store || ( this._store = this._owner ? this._owner.resolveStore() : this._defaultStore );
}

// in store
function resolveStore(){
  return this;
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
  if( this.__attributes[ attr ] ) return this[ attr ];

  if( this._owner ) return this._owner.get( attr );
}

```

This algori

Stores, used mainly for lookups and information display:

Encoder-related information. Must be updated in real time.
encoders, probes, probeGroups, channelSets

users, roles, channelSets
