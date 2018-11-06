NestedTypes v3.0 is BackboneJS compatibility layer for the [Type-R](https://volicon.github.io/Type-R/Getting_Started.html) data framework. NestedTypes adds support for BackboneJS REST API, underscore Model and Collection methods, and the rest of Backbone 1.1 classes (View, Router).

Functional-wise, there's no reason to prefer NestedTypes over the Type-R any more. If you don't need BackboneJS backward compatibility, move to the [Type-R](https://volicon.github.io/Type-R) which doesn't have any legacy dependencies like jQuery and underscore.

NestedTypes & NestedReact will be maintained as long as Verizon/Volicon systems have legacy Backbone code. NestedTypes docs won't be updated. Use [Type-R](https://volicon.github.io/Type-R) documentation as a primary source of documentation.

# Installation & Requirements

All modern JS engines are supported (IE10+, Safari, Firefox, Edge, Chrome, nodejs). May work in IE9 but not tested.

`npm install nestedtypes`

`underscore` and `jquery` are hard dependencies.

For lighter framework version without dependencies and Backbone compatibility shim check out [Type-R](https://github.com/Volicon/Type-R).   

# Quick API Reference

Central concept in NestedTypes is `Record` type, which is the JS class with following capabilities:

- Class members are deeply observable.
- It is serializable to JSON by default.
- Class members are typed and their changes are guardered with run-time type checks.

`Model` is the `Record` subclass representing REST API endpoint. Models, records, and their collections
are used as building blocks to describe both application's UI state and its data layer.

`Record` definition looks like normal ES6 class definition, but it's mandatory to declare
attributes. It looks like this:

```javascript
import { define, Record } from 'nestedtypes'

@define // <- decorator to perform class transformation
class User extends Model {
    urlRoot : '/api/users',

    static attributes = { // <- attributes declaration
        name : '', // <- can be either default value
        email : String, // <- or any JS type constructor
        isActive : true,
        lastLogin : Date.value( null ) // <- or both
    }
}

const user = new User({ id : 5 }); // <- constructor takes optional attributes hash as an argument
user.fetch().done( () => { // GET /api/users/5
    user.name = 'John';
    user.save(); // PUT /api/users/5
});
```

## Record's Attributes Type Annotations Basics

All record's attributes must be declared with `static attributes = { [ attrName ] : TypeAnnotation }` member.
Type annotation can be one of the following:

- `attrName : Constructor`. Such as `attrName : Date`.
- `attrName : Constructor.value( defaultValue )`. Such as `lastLogin : Date.value( null )`. 
- `attrName : defaultValue`. In this case, attribute type will be inferred from the value, so `isActive : true` has the same effect as `isActive : Boolean.value( true )`.

Record attributes can be accessed directly, like `user.name = x`. When attribute is assigned, the type of the the value is
checked and being converted to the declared type with its constructor invocation if it's necessary.

For the assignments like `user.isActive = x`, where `isActive` is declared as `Boolean` 

- it is assigned as is if `x` is `null` or boolean. 
- for primitive types, it's converted with plain constructor invokation like `Boolean( x )`.
- For non-primitives convertion will invoke constructor with `new`, like `new Date( x )`.

If it's impossible to convert the value it may be assigned with `NaN` or `Invalid Date` (or depending on the type update will be rejected),
and there will be an error in the console.

Therefore, *it's guaranteed* that Record attributes always have declared type.

## Collections

Every model has corresponding `Collection` type declared implicitly. Collections
implements [Backbone Collection API](http://backbonejs.org/#Collection).

```javascript
var users = new User.Collection();

users.fetch().done( () => {
    console.log( users.length );
});
```

When Record is extended, its collection is extended too. The creation of implicit Colleciton type is equivalent to this:

```javascript
@define
class Users extends Record.Collection {} 

@define
class User extends Record {
    static Collection = Users;
    // ...
}
```

You can use this pattern when you need to add custom members to the record's collection.

## Nested Records and Collections

Nested records and collections are declared with mentioning constructor in attribute type annotation.
All changes in nested objects are deeply observable; any change in children will cause change events in a parent.

Records and collections emiting the [standard set of Backbone events](http://backbonejs.org/#Events-catalog), with following differences:

- Collections does not bubble `change:[attribute]` event from the model by default (`change` event is bubbled);
     event bubbling needs to be enabled for every particular event with `static itemEvents = { 'change:attr1' : true, ... }` declaration.
- Collections have `changes` event which is semantically similar to the model's `change`.

### Transactions

Record's `change` event (and collection's `changes` event) are _transactional_. Whatever some changes 
are made as the reaction on any of change event, it won't cause additional `change` event for the owner.

Also, you can explicitly group the sequence of changes to the single transaction:

```javascript
    some.record.transaction( record => {
        record.a = 1;
        record.b = 2;
        ...
    }); // some.record will emit single 'change' event if there was any changes.

    // Execute collection.each in the scope of transaction.
    todoCollection.updateEach( item => item.done = true ); // One 'changes' event will be emitted. 
```

### Aggregation

Record can aggregate other records and collections in its attributes. 

```javascript
@define
class Team extends Record {
    static attributes = {
        members : User.Collection
        leader : User
    }
}

const team = new Team();
team.members.add( new User({ name : 'John' }) );
```

Aggregated members are:

- serialized as nested JSON.
- following operations recursively when the operation happens to its owner.

Aggregated members forms the tree of exclusive ownership. The same record or collection instance cannot be aggregated in two places at the same time,
and this rule is checked and enforced. 

### Shared nested objects

Records may have nested members which belongs to different ownership trees.
Special type annotations are required to mark attribute as shared.

- `RecordType.shared` or `CollectionType.shared`. Reference to collection or record which may be aggregated somewhere else. `null` by default.   
- `CollectionType.Refs` constructor. Collection of records which may be aggregated somewhere else. Defaults to empty collection.

`CollectionType.Refs` is an equivalent to `CollectionType.shared.value( [] )` when used as attribute type annotation.

Shared types are:

- not a part of record's ownership tree.
- not serialized.
- Not a subject of recursive operations. They are empty by default, not cloned, not validated, and not disposed when the corresponding operation applied to the parent. 

In all other aspects, they are indistinguishable from aggregated records and collections.

```javascript
@define
class Team extends Record {
    static attributes = {
        members : User.Collection.Refs
        leader : User.shared
    }
}
```

### Relationship by `id`

It's possible to create serializable reference to the shared object which is represented in JSON as a record's id (or array of ids).
Special type annotation is required to point out the master collection which will be used to resolve ids to the records. 

- `RecordType.from( masterCollection )` represents an id reference to the model.
- `CollectionType.subsetOf( masterCollection )` represents the collection of models id references.

id-reference types behaves as shared types, but:

- they are serializable as an object id (or array of ids for collections).
- they are not observable (internal changes do not trigger change events on the record).

`masterCollection` reference may be either:

- direct reference to the globally available collection.
- function returning the reference to the collection.
- string, which is the *symbolic reference* to collection (dot-separated path to the collection taken relative to the record's `this`).

```javascript
class Team extends Record {
    static attributes = {
        members : User.Collection,
        leader : User.from( 'members' ) // <- leader is serializable reference to the record from members collection.  
    }
}
``` 

#### Owner-references

`^` symbol in symbolic reference represents `getOwner()` call and returns the record owner.
Collections are skipped.

Following example expects that `Team` record will be aggregated (alone or in a collection) together
with `users` collection.

```javascript
class Team extends Record {
    static attributes = {
        members : User.Collection.subsetOf( '^users' ),
        leader : User.from( 'members' )  
    }
}
``` 

#### Tilda-References and Stores

Symbolic reference staring with `~` is resolved relative to the record called _store_,
which is located with `record.getStore()` method.
For instance, reference `~users` will be resolved as `this.getStore().users`.

`getStore()` uses following store location algorithm:

1. It traverse an ownership tree upwards and return the first `Store` model it has found.
2. If none of the record's owners is the Store, it returns global store from `Nested.store`. 

`Store` is the subclass of the `Record` and behaves as a regular Record.
Therefore, resolution of id references depends on the context and you may have as many stores as you like.

Following example expects that there's `users` collection in some upper record which is inherited from Store,
or (if there are none) in the global store: 

```javascript
class Team extends Record {
    static attributes = {
        members : User.Collection.subsetOf( '~users' ),
        leader : User.from( 'members' )  
    }
}
```

## Attribute has-annotations

It's possible to control different aspects of record's attribute behavior through additional metadata.
All of them starts with a keyword `.has` added to the constructor type.

Object describing an attribute is called *metatype*. Operations on metatypes are immutable (returns new metatype),
and can be chained.

```javascript
// Declare Month metatype.
const Month = Number.value( 1 ).has.check( x => x > 0 && x <= 12 );
``` 

#### attribute : Type.has.toJSON( false | ( x, name ) => json )

Override default serializer for the attribute. `false` option will exclude attribute from serialization.

#### attribute : Type.has.parse( ( json, name ) => data )

Override default JSON parser for the attribute.

#### attribute : Type.has.get( ( value, name ) => value )

Get hook which may transform attribute value on read. Get hooks can be chained.

#### attribute : Type.has.set( ( value, name ) => value )

Set hook which may transform attribute value before it's assigned. Set hooks can be chained.

#### attribute : RecordOrCollectionType.has.changeEvents( false )

When nested attribute is changed, don't mark the owner as changed.

#### attribute : Type.has.events({ [ event ] : handler | handlerName })

Listen to the specified events from the attribute. handler can be either function or
the name of the record's method.

#### attribute : Type.has.check( x => boolean, errorMsg? : any )

Attach check to the attribute. Checks can be chained. Attribute is valid whenever check function returns truthy value.

errorMessage is optional.

#### attribute : Type.isRequired

Similar to `Type.has.check( x => x, 'Required' )`.

## Validation

Validation is performed recursively on ownership tree. Record and collection shares the same validation API.

#### record.validate()

Override it to add custom record-level validation. Method shoudl return truthy value in case of validation error.

For attribute level checks see `Type.has.check` annotation.

#### record.isValid() : boolean

Checks whenever record is valid. 

#### record.validationError

Return validation error object or null if there are no errors.
