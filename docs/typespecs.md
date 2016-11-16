# Type System Reference

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
- created, cloned, validated, and disposed recursively when the operation happens to its owner.

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

- serializable as an object id (or array of ids).
- not observable (internal changes do not trigger change events on the record).

`masterCollection` reference may be either:

- direct reference to the globally available collection.
- function returning the reference to the collection.
- string, which is the *symbolic reference* to collection (dot-separated path to the collection taken relative to the record's `this`).

```javascript
class Team extends Record {
    static attributes = {
        members : User.Collection
        leader : User.from( 'members' ) // <- leader is serializable reference to the record from members collection.  
    }
}
```

### Tilda-references and Stores

There's a special *tilda-reference* pointing to the elements of records called *stores*.
In NestedTypes store is the regular record which
is used as a root for tilda-reference resolution. You may have as many stores as you like.

Reference `~users` will be translated to `this.getStore().users`.

#### Store location algorithm