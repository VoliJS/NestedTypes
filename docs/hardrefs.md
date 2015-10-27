Model.take( ref ) or Collection.take( ref )

- Resolved with ref value, evaluated on first read attempt
- Non-serializable by default
- Non-assignable
- Assugnment with `null` delete cached ref value, forcing ref evaluation next time.
- Change events bubble up by default

Valid ref values:
- store reference
- model reference relative to `this`
- direct reference to object
- function, returning the value
