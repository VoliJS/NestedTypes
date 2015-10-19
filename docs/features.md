# Changes

- model attribute's ownerhip with traversable back references
    - Model and Collection first assigned to model attributes hold back `_owner` reference
    - _owner is cleared when object is removed from an attribute.
- Model's attribute proxies
    - Type.has.proxy() spec will create native properties linked to attribute's properties.
    - Type.has.proxy('a b c') will link only listed properties.
- Store base class for model, which is used as store.
    - Model.getStore() method returns closest store performing ownership traversal, or return global one.
    - All I/O is delegated to enclosing store's sync, if it's not the store.
    - New Model.from and Collection.subsetOf references resolution algorithm
        - for references started from `store.*` getStore() locator is used.
        - when no item is located in store, item from global default store is returned.
- LazyStore container of distinctive REST endpoints.
    + autoload items on first access
    + may clear and fetch all or individual items
- Nested.store now accepts object instance, not the spec.

# Rationale

- Create multiple stores in a system.
- Put stores in hierarchy.
- Allow dynamic stores creation.
