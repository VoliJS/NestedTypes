backbone.nestedTypes
====================

In case you're precisely know what you're looking for, it's backbone.js extension adding type annotations to model attributes, easiest possible way of dealing with nested models and collections, and native properties for attributes. Providing you with a more or less complete, simple, and powerful object system for JavaScript.

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
Forget the 'get'. For any model attributes mentioned in 'defaults', use

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

It's important to note that defaults specs *are mandatory* with this plugin. Default implementation of Model.validate method will write an error in console if you attempt to save model with attributes which are not declared.

Also, defaults spec *must* be an object, you can't use function as in plain Backbone.

Nested Models and Collections
-----------------------------

To use nested models and collections, just annotate attributes with Model or Collection type.

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

No need to override `initialize`, `parse`, and `toJSON`, nested JSON will be parsed and generated automatically. You still can override parse to transform JSON received from the server, but there is no need to create new Model/Collection instances, because of the modified 'set' behaviour.

If attribute is defined as Model or Collection, new value is an object or array (for example, JSON received form the server), and its current value is not null, it will be delegated to 'set' method of existig nested model or collection (!). If current value is null, new instance of model/collection will be created. I.e. this code:

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

'set' method for models and collection is *strictly type checked*. You'll got error in the console on every attempt to set values with incompatible type.

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

Nested collections of model's references
-------------------------------------------------

When you have many-to-many relationships, it is suitable to transfer such a relationships from server as arrays of model ids. NestedTypes gives you special attribute data type to handle such a situation.

```javascript
var User = Model.extend({
    defaults : {
        name : String,
        roles : RolesCollection.RefsTo( rolesCollection ) // <- subclass of existing RolesCollection
    }
});

var user = new User({ id: 0 });
user.fetch(); // <- and you'll receive from server "{ id: 0, name : 'john', roles : [ 1, 2, 3 ] }"
...
// however, user.roles behaves like collection of Roles.
assert( user.roles instanceof Collection );
assert( user.roles.first() instanceof Role );
```

Collection.RefsTo is a collection of models. It overrides toJSON and parse to accept array of model ids. Also, it *override its 'get' property in upper model*, to resolve ids to real models from 
the given master collection on first attribute read attempt. If master collection is empty and thus references cannot be resolved, it will defer id resolution and just return collection of dummy models with ids. However, if master
collection is not empty, it will filter out ids of non-existent models.

This semantic is required to deal with collections in asynchronous JS world. Also, there are 'lazy' option for passing reference to master collection:

```javascript
var User = Model.extend({
    defaults : {
        name : String,
        roles : Collection.RefsTo( function(){
		return this.collection.rolesCollection; // <- collection of Roles is the direct member of UsersCollection.
	})
    }
});
```

I'm planning to add more 'lazy evaluation' and reference handling features in future.

Other enhancements
------------------
- deepClone operation for deep copy of nested models, collections, and types. When you start working with nested stuff seriously, you'll need it soon.
 
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
- Class type, which can send and receive Backbone events and can be extended. Also, it can have native properties, as Model and Collection. The basic building block of Backbone, which was not exported from the library directly for some reason.

```javascript
var myClass = Class.extend({
	a : 1,

	initialize : function( options ){
		this.a = options.a
		
		this.listenTo( options.nowhere, 'something', function(){
			this.trigger( 'heardsomething', this );
		});
	},

	properties : {
		b : function(){ return this.a + 1; }
	}
});
```
Installation and dependencies
-----------------------------
Native properties support is required. It means all modern browsers, IE from version 9.

You need a single file (nestedtypes.js) and backbone.js itself. It should work in browser with plain script tag,
require.js or other AMD loader. Also, it's available as npm package for node.js (https://www.npmjs.org/package/backbone.nested-types).

Module exports three variables - Class, Model, Collection. You need to use them instead of backbone's. In browser environment with plain script tag import it will export these things under NestedTypes namespace - see an example in sources.

And yes, you could expect this extension to be stable and bug free enough to use. It is being developed as a part of commercial product. Volicon rely on this extension as a core part of architecture for next gen products. And we're actually interested in your bug reports. :)
