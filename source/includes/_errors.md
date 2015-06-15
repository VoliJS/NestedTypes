# Nested.errors
NestedTypes detect four error types in the runtime, which will be logged to console using console.error.

## Method overriden with value
When you override function with non-function value in the subclass, it usually means an error.

This message also warn you on the situation when you made model attribute or property name the same as
some base class method.

`[Type Warning] Base class method overriden with value in Object.extend({ url : [object Object] }); Object = ...`

## Wrong model.set argument
First argument of Model.set must be either string, or literal object representing attribute hash.

Other situation means serious error. Something goes really wrong.

`[Type Error] Attribute hash is not an object in Model.set( "http://0.0.0.0/" ); this = ...`

## Wrong collection.set argument
First argument of Collection.set must be either an Array, literal object, or compatible Model.

Other situation means serious error. Something goes really wrong.

`[Type Error] Wrong argument type in Collection.set( "dsds" ); this = ...`

## Attribute has ho default value
Attempt to set an attribute which is not declared in model `defaults`.

`[Type Error] Attribute has no default value in Model.set( "a", 0 ); this =...`
