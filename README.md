backbone.nestedTypes
====================

In case you're precisely know what you're looking for, it's backbone.js extension adding type annotations, type coercion and type checks (yes, _checks_) to model attributes, easiest possible way of dealing with nested models and collections, and native properties for attributes. Providing you with a more or less complete, simple, and powerful object system for JavaScript.

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

3. Seriously reduce backbone.js painfullness and shorten learning curve for backbone newbies.
    - Model and Collection's semantic is designed in the way, that it hard to make typical newbie errors. Some of them are not mistakes any more, but the right way to do things. For example, defaults section is automatically inherited for you from the base class, it's safe to forget 'get', etc...
    - Minimum of new concepts and keywords are introduced. If you know backbone, you already know NestedTypes.
    - Attribute types are checked and automatically coerced in run time.
 
These issues are addressed in many backbone plugins, but this one is different.

We solve these problems encouraging you _to type less, than you used to_. Type specs in model's 'defaults' section do all the magic. So, if your attribute is a date, just write in defaults, that it's Date. That's it.

No, you don't need a compiler, or learn some non-standard syntax. It's still old good vanilla JS you're get used to.

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
var MyModel = NestedTypes.Model.extend({
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
var User = NestedTypes.Model.extend({
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

Also, defaults spec *must* be an object, at this time you can't use function as in plain Backbone. Support for them will be added later.

Type annotations and defaults rules summary
-----------------------------------
Semantic of type annonation designed to be both intuitive and protective, in order to have minimal learning curve and help to overcome typical backbone.js mistakes usually done by newbies. Howewer, it's not as simple behind the scene. Here's more formal and detailed description of logic behind defaults:

- defaults spec must be an object
- any function used as default value is treated as constructor, and will be invoked with 'new' to create an object.
- JSON literals used as defaults will be compiled to function and efficiently  _deep_ _copied_.
- non-JSON values (other than direct instances of Object and Array) will be passed by reference. I.e. in this example:
```javascript
var M = NestedTypes.Model.extend({
    defaults : {
        num : 1,
        str : "",
        arr : [ 1, 2, 3 ],
        obj : { a: 1, b: 2 },
        date : Date,
	shared : new Date()
    }
});

// creation of default values will behave exactly as the following code in plain backbone:

var _tmp = new Date();
var M = NestedTypes.Model.extend({
    defaults : function(){
    	return {
       	    num : 1,
            str : "",
            arr : [ 1, 2, 3 ],
            obj : { a: 1, b: 2 },
            date : new Date(),
            shared : _tmp
        }
    }
});
```
- type and default value may be specified separately. Standard type coercion rules will be applied to default values.
```javascript
var M = NestedTypes.Model.extend({
    defaults : {
        date1 : NestedTypes.Attribute( Date, null ),
        date2 : NestedTypes.Attribute( Date, '2012-12-12 12:12' )
    }
});

// will behave as:
var M = NestedTypes.Model.extend({
    defaults : function(){
    	return {
            date1 : null,
            date2 : new Date( '2012-12-12 12:12' )
    	}
    }
});
```
- Native getter and setter may be overriden for every attribute using full notation:
```javascript
var M = NestedTypes.Model.extend({
    defaults : {
        date1 : NestedTypes.Attribute({
            type : Date,
            value : null,
            get : function(){
                var time = this.attributes.date1;
                return time ? time : new Date( '1900-01-01 00:00' );
            })
        }
            
    }
});
```

Nested Models and Collections
-----------------------------

To use nested models and collections, just annotate attributes with Model or Collection type.

```javascript
var User = NestedTypes.Model.extend({
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
- It's possible to control event bubbling for every attribute. You can completely disable it, or override the list of events which would be counted as change:

```javascript
var M = NestedTypes.Model.extend({
	defaults: {
		bubbleChanges : ModelOrCollection,
		
		dontBubble : NestedTypes.Attribute({
			type : ModelOrCollection,
			triggerWhanChanged : false
		}),
		
		bubbleCustomEvents : NestedTypes.Attribute({
			type : ModelOrCollection,
			triggerWhanChanged : 'event1 event2 whatever'
		}),
	}
});
```

Nested collections of model's references
-------------------------------------------------

When you have many-to-many relationships, it is suitable to transfer such a relationships from server as arrays of model ids. NestedTypes gives you special attribute data type to handle such a situation.

```javascript
var User = NestedTypes.Model.extend({
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
var User = NestedTypes.Model.extend({
    defaults : {
        name : String,
        roles : Collection.RefsTo( function(){
            return this.collection.rolesCollection; // <- collection of Roles is the direct member of UsersCollection.
        })
    }
});
```

Note, that 'change' events won't be bubbled from models in Collection.RefsTo. Collection's events will.

Type checks and type coercion rules summary
-------------------------------------------

Type checks and type coercions performed on every model 'set' call and assignment to the model's property. Failed type checks will be logged with console.error as "[Type Error...]..." message.

There are two type cercion rules:

1. When model's attribute has default type, it's may either *hold null or instance of specified type* or its subclass. When it's set with value of different type, constructor will be invoked with this value as an argument to produce specified type.
2. When model's attribute has Model (or Collection) type, it may hold either null or instance of specified Model (Collection) or its subclass. When it's being set with value of different type, it will be either *delegated to 'set' method of existing model/collection* (if current attribute value is not null), or *new model/collection will be created* with the given value as first argument.

And there are two very fast runtime type checks in Model.set, which in combination with coercion rules listed above effectively isolating significant amount of type errors:

1. All model's attributes *must* be declared in 'defaults'. Attempt to set attribute not having default value or type *is treated as an error*.
2. For bulk attributes set operation *only plain JS object may be used* as an argument. Usage of complex objects as attributes hash *is treated as an error*.

Also, there is a protection inside 'extend' from occasionally overriding base Model/Collection/Class members with attributes and properties. Required, since plugin creates native properties for attributes.

Other enhancements
------------------
- isValid method checks nested models, collections, and classes recursively.
- deepClone operation for deep copy of nested models, collections, and types. When you start working with nested stuff seriously, you'll need it soon.
 
```javascript
model.nestedModel = other.nestedModel.deepClone(); // will create a copy of nested objects tree
```

- Default attributes are being inherited from the base model. In vanilla backbone, base model defaults will be completely overriden by subclass, which is annoying.
```javascript
var Base = NestedTypes.Model.extend({
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

- Class type, which can send and receive Backbone events and can be extended. Also, it can have native properties, as well as Model and Collection. The basic building block of Backbone, which was not exported from the library directly for some reason.

```javascript
var myClass = NestedTypes.Class.extend({
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
P.S.: There's an opinion that classes are not needed in JS since you can do fancy mixins with prototypes. What I would say? C'mon, we're really old-school guys here. :) We're get used to situation when class looks like a class, not as a random excerpt from Linux kernel or something :)

Installation and dependencies
-----------------------------
Native properties support is required. It means all modern browsers, IE from version 9.

You need a single file (nestedtypes.js) and backbone.js itself. It should work in browser with plain script tag,
require.js or other AMD loader. Also, it's available as npm package for node.js (https://www.npmjs.org/package/backbone.nested-types).

Module exports three variables - Class, Model, Collection. You need to use them instead of backbone's. In browser environment with plain script tag import it will export these things under NestedTypes namespace - see an example in sources.

And yes, you could expect this extension to be stable and bug free enough to use. It is being developed as a part of commercial product. Volicon rely on this extension as a core part of architecture for next gen products. And we're actually interested in your bug reports. :)
