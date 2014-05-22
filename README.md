backbone.nestedTypes
====================

In case you're precisely know what you're looking for, it's backbone.js extension adding model's native properties, type annotations, nested models and collections.

In case if you don't, here is a brief outline of problems we're solving with this little thing. There are two major goals behind:

1. Simplify maping of complex server-side entities to client's models. It should:
    - free you from writing type convertion code inside of `parse`, `toJSON`, and `initialize`. It's _not_ trivial thing to do it right.
    - automatically handle nested JSON objects.
    - automatically handle simple types, such as Date.
    - behave well for inherited models as well.
    - Provide really easy way to handle different type of model's relations. Should have zero learingn curve. As we think, the way how it's done in backbone.relational is too restrictive and is an overkill for most applications.

2. Simplify usage of models as contexts for template rendering. What we've done for that:
    - support for nested models is mandatory, since view-models are usually hold the set of different models.
    - implement event bubbling from nested models and collections _right_. It means, for example, that in case of bulk collection change with collection.set upper level model should trigger 'change' event only once. Very helpful, if you like to render you view in case of model's change.
    - automatic generation of native JS properties, to make templates look good.

These issues are addressed in many different backbone plugins, but this one is defferent.

We solve these problems encouraging you to type less, than you used to. 'Type specs' in model's 'defaults' section do all the magic. So, if your attribute is a date, just write in defaults, that it's Date. That's it. No, you don't need a compiler, it's still old good vanilla JS you're get used to.

Model's native properties
-------------------------
For any model attributes mentioned in 'defaults', use

```javascript
model.first = model.second;
model.deep.nesting = some.thing.from.another.model;
```

instead of

```javascript
model.set( 'first', model.get( 'second' ) );
model.deep.set( 'nesting', some.get( 'thing' ).get( 'from' ).get( 'another' ).get( 'model );
```

Great for accessing nested models from templates.

Also, you can define calculated native properties for models and collections like this:

```javascript
var MyModel = Model.extend({
    defaults : {
        otherModel_id : 0,
        yetAnotherModel_id : 2
    },

    __otherModelsCollection : null,

    properties : {
        otherModel : function(){
            return this.__otherModelsCollection.get( this.otherModel_id );
        },

        yetAnotherModel : {
            get : function(){
                return this.__otherModelsCollection.get( this.yetAnotherModel_id );
            },

            set : function( model ){
                this.yetAnotherModel_id = model.id;
            }
        }
    }
});

// This could be done from some other place...
MyModel.prototype.__otherModelsCollection = ...
```

Great for implementing collection joins which looks like nested models. Also, since custom properties definition override default properties, it's well suitable for setting hooks on attribute's modification. In case you'll need such a weird stuff, of course.

Type annotations for Model attributes
-------------------------------------

You could use constructor functions as default value.

```javascript
var User = Model.extend({
    defaults : {
        name : String,
        created : Date,
        loginCount: Number
    }
});
```

New object will be created automatically for any typed attribute, no need to override `initialize`.
 When typed attribute assigned with value of different type, constructor will be invoked to
convert it to defined type.

```javascript
var user = new User();
assert( user.created instanceof Date );

user.created = "2012-12-12 12:12"; // string will be converted to Date
assert( user.created instanceof Date );

user.loginCount = "jhkhjhjhj";
assert( user.loginCount === NaN );
```

It means, that you don't need to override Model.parse and Model.initialize when you receive time and
 date from the server. It will be parsed and serialized to JSON as ISO date automatically.

Nested Models and Collections
-----------------------------

To have nested models and collections, annotate attribute with Model or Collection type.

```javascript
var User = Model.extend({
    defaults : {
        name : String,
        created : Date,
        group : GroupModel,
        permissions : PermissionCollection
    }
});
```

No need to override `initialize`, `parse`, and `toJSON`, everything will be done automatically.

There is a difference from regular types in 'set' behaviour. If attribute's current value is not null,
and new value has different type, it will be delegated to 'set' method of nested model or collection.
I.e. this code:

```javascript
var user = new User();
user.group = {
    name: "Admin"
};

user.permissions = [{ id: 5, type: 'full' }];
```

is equivalent of:

```javascript
user.group.set({
   name: "Admin"
};

user.permissions.set( [{ id: 5, type: 'full' }] );
```

This mechanics of 'set' allows you to work with JSON from in case of deeply nested models and collections without the need to override 'parse'. This code (considering that nested attributes defined as models):

```javascript
user.group = {
    nestedModel : {
        deeplyNestedModel : {
            attr : 'value'
        },
        
        attr : 5
    }
};
```
    
is almost equivalent of:

```javascript
user.group.nestedModel.deeplyNestedModel.set( 'attr', 'value' );
user.group.nestedModel.set( 'attr', 'value' );
```
    
but it will fire just single `change` event.

Change events will be bubbled from nested models and collections.
- `change` and `change:attribute` events for any changes in nested models and collections. Multiple `change` events from submodels during bulk updates are carefully joined together, which make it suitable to subscribe View.render to the top model's `change`.
- `replace:attribute` event when model or collection is replaced with new object. You might need it to subscribe for events from submodels.

Other enhancements
------------------
- deepClone operation for deep copy of nested models, collections, and types.
```javascript
model.nestedModel = other.nestedModel.deepClone(); // will create a copy of nested objects tree
```

- Default attributes are being inherited from the base model. In vanilla backbone, base model defaults will be completely overriden by subclass, which is annoying.
```javascript
var Base = Model.extend({
	defaults: {
		a : 1
	}
});

var Derived = Base.extend({
	defaults: {
		b : 1
	}
});

var instance = new Derived();
assert( instance.b === 1 );
assert( instance.a === 1 );
```
- Class type, which can send and receive Backbone events, can be extended, and can have native properties

```javascript
var myClass = Class.extend({
	a : 1,

	initialize : function( options ){
		this.a = options.a
	},

	properties : {
		b : function(){ return this.a + 1; }
	}
});
```
Installation and dependencies
-----------------------------
You need a single file (nestedtypes.js) and backbone.js itself. It should work in browser with plain script tag,
require.js or other AMD loader. Also, it's available as npm package for node.js (https://www.npmjs.org/package/backbone.nested-types).

Module exports three variables - Class, Model, Collection. You need to use them instead of backbone's.




