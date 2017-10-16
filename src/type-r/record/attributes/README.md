Attributes run-time metadata, record update pipleline, and attribute definitions.

- `any.ts` - `AnyType` is the base class for the typeless attribute descriptor.
- `updates.ts` - transactional updates.
- `attrDef.ts` - chainable attribute spec definition.

## Design

Record's attributes has descriptors stored on `record._attributes`. Attribute descriptor controls all aspects of attribute behavior.

`AnyType` is the base class for an attribute, and it represents the *typeless attribute*. This attribute might hold value of an type and perform _no type assertions and convertions_. It must implement all the update pipeline methods, though.

### Streamlined attributes semantic

Mutable attributes (changes _are_ detected):

- aggregated (Record, Collection)
- shared (Record.shared, Collection.shared, Collection.Refs)
- shared serializable (Record.from, Collection.subsetOf)

Typeless attribute: must be anything.

- No type convertion.
- No complex comparisons and other stuff, just the raw assignments.

Immutable attributes (changes are _not_ detected):

- JSON (Object, Array)
- Primitives (Boolean, Number, String)
- Date
- Function
- Class (custom constructor)

Common for immutable things:

- dispose is noop.
- clone is noop.
- no update in place.
- no change detection.

Consider adding value links to perform pure updates. record.linkAt( 'key1' ).at( 'key2' ).set( value );
Consider making it optional dependency.