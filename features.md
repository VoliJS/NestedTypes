# Getting Started
## Overview
## Installation & Requirements

# Object.extend

# Attribute Types
## Overview
## Object types
## Primitive types
## Untyped value
## Date handling
## Nested Model
## Nested Collection
## 

# Attribute Options

# Nested.Model
## Overview
## model.id
In NestedTypes, `model.id` is assignable property, linked to `model.attributes[ model.idAttribute ]`.

`model.id = 5` has the same effect as `model.set( model.idAttribute, 5 )` 

## model.attrName

NestedTypes creates native property for every attribute.    

`model.attr = val;` has the same effect as `model.set( 'attr', val );`

`val = model.attr;` has the same effect as `val = model.get( 'attr' );`

Accessing attributes with native properties is faster than using `get` and `set`.

## model.set()

Set model attributes. Update sequence is fo

1. Values are converted to proper types. For existing nested models and collections `deep update` may be
invoked.
2. Set hooks are being executed for changing attributes.
3. Events are being registered for changing attributes.
4. Attribute values are being set, firing change events.

In NestedTypes, you can assign model attributes directly, and it's faster than `set`:
    `model.attr = val;`

## model.get( 'attr' )

Get attribute value by name. Returned value can be modified with `get hook` in attribute definition.

In NestedTypes, you can access model attributes directly, and it's faster than `get`:
    `val = model.attr;`

## Model.Collection
## Model.defaults()
## Model.define()
## model.defaults()
## model.deepClone()
## model.clone()
 
## model.deepGet()
## model.deepSet()
## model.toJSON()
## model.isValid()
## model.properties
## model.triggerWhenChanged


# Nested.Collection
## Collection.define()
## collection.deepClone()
## collection.clone()
## collection.set()
## collection.get()
## collection.toJSON()
## collection.isValid()
## collection.properties
## collection.triggerWhenChanged



# Nested.store