## Compatibility with NestedTypes 1.3

Major difference is the ownership policy, which is now enforced.
Because of that, NestedTypes 1.3 code will not work without modifications.

### Refactoring Guide

TBD

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