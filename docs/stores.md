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

Stores, used mainly for lookups and information display:

Encoder-related information. Must be updated in real time.
encoders, probes, probeGroups, channelSets

users, roles, channelSets

(!) There might be special reference resolution algorithm, knowing about stores.
    If item is not present in store, it will perform look-up in the parent store. (!)

(!) Store hierarchy might be either explicit (store inside of the store),
    or implicit (store requires another store definition). (!)

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
- Store, consisting of independent REST api points.
- Read-only store, loading its content in one REST operation, and pull itself for updates.
- Store, loading and updating itself in real time through WS.

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

(?) What about defining model attributes with JSX (?)
    @attributes({
        user : <User value={ null }/>
        roles : <Role.Collection from='store.roles'/>
    })
