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
        email : String, // <- or type constructor
        isActive : true,
        lastLogin : Date.value( null ) // <- or both
    }
}

const user = new User({ id : 5 });
user.fetch().done( () => { // GET /api/users/5
    user.name = 'John';
    user.save(); // PUT /api/users/5
});
```

