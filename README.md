backbone.nestedTypes
====================

Backbone.js extension adding native properties for models, type annotations, nested models and collections.
Complete feature list:
- Inherits default attributes form the base model.
- Generate native ECMAScript properties:
    - automatically for all default model attributes;
    - manually with 'properties' specification.
- Specify types for default attributes:
    - values converted to specified type when attribute value is being set;
    - automatic JSON serialization and deserialization;
- Model attributes of Model or Collection type:
    - fire 'change:attribute' events for any changes of nested models and collections;
    - 'replace:attribute' event is fired when Model or Collection attribute is being replaced with new value;
    - carefully bubble 'change' events to parent models and collections;
    - Support for in-place models and collections updates;
    - automatic JSON serialization and deserialization;
    - deepClone operation for deep copy of nested models and collections.
