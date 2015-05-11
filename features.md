NestedTypes feature list
========================
Features:

- Class type
- Native properties for Model attributes, Collection, and Class.
- Inline Collection definition syntax for Models.
- Model.defaults inheritance and deep copying.
- Type declarations and automatic type casts for Model attributes.
- Nested models and collections.
- One-to-many and many-to-many models relations.
- 'change' event bubbling for nested models and collections.
- Attribute-level control for parse/toJSON and event bubbling.
- Run-time type error detection and logging.

Basic features
--------------

- Model.defaults:
    - Native properties are created for every entry.
    - Entries are being inherited by subclass model.
    - JSON literals will be deep copied for each model instance.
- Inline collection definitions
- Class type
- Explicit native properties definition: Model, Class, Collection.
- Console errors

Types annotations
--------------------------
- Basic syntax
- Primitive types (String, Boolean, Number).
    - Are infered from default values.
    - Type cast on assignment.
- Date type
    - Serialization to ISO string
    - Handling of ISO and MS formats
    - Type cast rules

- Class type and JS objects
    - default type cast rules
    - declarative event listeners

- Attribute options
    - override native property
    - override parse/toJSON
    - type and value

- Attribute metatypes
    - overriding cast
    - overriding property

Nested Models and Collections
-----------------------------
- special type cast rules
    - 'set' call propagation
- event bubbling
    - change event
    - change:attribute event
    - replace:attribute event
    - 'triggerWhenChanged' option

Models Relations
----------------
- Model.From
- Collection.SubsetOf


Some thoughts
-------------
- artificial properties are needed for type casts and hooks in any case.
- base class could implement functionality without notifications. Just type casts + serialization control.
- then, it could be merged into base Model.set, to add notifications.
