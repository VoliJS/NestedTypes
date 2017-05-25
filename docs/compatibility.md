## Compatibility with NestedTypes 1.3

Major difference is the ownership policy, which is now enforced.
Because of that, NestedTypes 1.3 code will not work without modifications.

### Refactoring Guide

## Watch out for aggregation errors!

Read the [Type-R documentation](https://volicon.github.io/Type-R/API_by_feature/Aggregation_tree.html) about aggregation and shared references.

The majority of the refactoring required is adding `Model.shared` and `Collection.Refs` in places where the UI state has references to shared objects.

Errors will appear when you are trying to assign parts of one aggregation tree to another. They will look like this:

`[Model Update] Aggregated 'User.name : ModelType' attribute is assigned with an object which is aggregated somewhere else.`

`[Model Update] Aggregated 'User.name : CollectionType' attribute is assigned with a shared Collection.Set.`

`[Collection Update] Aggregating [[ Model.name : ] CollectionType ] collection is updated with models which are aggregated somewhere else.`

## Old API Deprecations
- `modelOrCollection.clone()` now performs deep cloning. `modelOrCollection.deepClone()` is deprecated.

### API changes

- model `change:attr` events are not bubbled up by collection by default. Explicit `itemEvents` spec is required. Performance reasons.
- `object.trigger( 'a b' )` is not supported. Use `object.trigger( 'a' ).trigger( 'b' )`. Performance reasons. Not to mention that when you doing so you are most likely doing something wrong.
- `model.collection` is not set inside of `model.initialize()`.
- Collection.set `add` option is not supported. Period. But `remove` option works.
- Collection.subsetOf:
    - `.justOne( x )` method is deprecated. Use `.set([ x ])` instead.
    - `.removeAll()` method is deprecated. Use `.reset()` instead.
- Types of models and collection default valus are now inferred to `shared` types.
- Symbolic references - `store.x` syntax is deprecated, use `~x` instead.
- `Integer` -> `Number.integer`
- `Date` attribute doesn't parse MS format. Use `Date.microsoft`.