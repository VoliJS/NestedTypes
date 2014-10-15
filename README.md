backbone.nestedTypes
====================

NestedTypes is the type system for JavaScript, implemented on top of  Backbone. It solve common architectural problems of Backbone applications, providing simple yet powerful tools to deal with complex nested data structures. Brief feature list:

- Class type
- *Native properties* for Model attributes, Collection, and Class.
- Inline Collection definition syntax for Models.
- Model.defaults inheritance and deep copying.
- Type declarations and automatic type casts for Model attributes.
- Easy handling of Date attributes.
- *Nested models* and collections.
- *One-to-many* and *many-to-many* models relations.
- 'change' event bubbling for nested models and collections.
- Attribute-level control for parse/toJSON and event bubbling.
- Run-time type error detection and logging.

How it feels like
-----------------

It feels much like statically typed programming language. Yet, it's vanilla JavaScript.

```javascript
var User = NestedTypes.Model.extend({
    urlRoot : '/api/users',

    defaults : {
        // Primitive types
        login    : String, // = ""
        email    : String.value( null ), // = null
        loginCount : Number.options({ toJSON : false }) // = 0, not serialized
        active   : Boolean.value( true ), // = true

        created  : Date, // = new Date()

        settings : Settings, // nested model

        // collection of models, received as an array of model ids
        roles    : Role.Collection.SubsetOf( rolesCollection ),
        // reference to model, received as model id.
        office : Office.From( officeCollection )
    }
});

var collection = new User.Collection(); // Collection is already there...
collection.fetch().done( function(){
    var user = collection.first();
    console.log( user.name ); // native properties
    console.log( user.office.name );
    console.log( user.roles.first().name );
});
```

Types are being checked in run-time on assignment, but instead of throwing exceptions it tries to cast values to defined types. For example:

```javascript
    user.login = 1;
    console.assert( user.login === "1" );

    user.active = undefined;
    console.assert( user.active === false );

    user.loginCount = "hjkhjkhfjkhjkfd";
    console.assert( _.isNan( user.loginCount ) );

    user.settings = { timeZone : 180 }; // same as user.settings.set({ timeZone : 180 })
    console.assert( user.settings instanceof Settings );
```

Requirements & Installation
---------------------------

All modern browsers and IE9+ are supported. To install, type

    bower install backbone.nested-types

or

    npm install backbone.nested-types

or just copy 'nestedtypes.js' file to desired location.

NestedTypes is compatible with node.js, CommonJS/AMD (e.g. RequireJS) module loaders, and could be included with plain script tag as well. To include it, use

    var NestedTypes = require( 'nestedtypes');

or

    require([ 'nestedtypes' ], function( NestedTypes ){

or

    <script src="nestedtypes.js" type="text/javascript"></script>


API Reference
=================

Basic features
--------------

=== Model.defaults:
    - Native properties are created for every entry.
    - Entries are inherited from the base Model.defaults.
    - JSON literals will be deep copied upon creation of model.
    - defaults *must* be an object, functions are not supported.
    - attributes *must* be declared in defaults.


```javascript
    var UserInfo = NestedTypes.Model.extend({
        defaults : {
            name : 'test',
        }
    });

    var DetailedUserInfo = UserInfo.extend({
        defaults : {
            login : '',
            roles : [ 'user' ]
        }
    });

    var user = new DetailedUserInfo();

    // user.get( 'name' ) would be undefined in plain Backbone.
    console.assert( user.name === 'test' ); // you still can use 'get', but why...
    user.name = 'admin';

    // In Backbone all models will share the same instance of [ 'user' ] array.
    // So, following line will create a bug. Not in NestedTypes.
    user.roles.push( 'admin' );
```

- Inline collection definition (Model.collection).

By the way, our models from previous example has collections defined already.
```javascript
    var users = new UserInfo.Collection();
    var detailedUsers = new DetailedUserInfo.Collection();
```

Every model definition creates Collection type extending base Model.Collection.  Collection.model and Collection.url properties are taken from model. You could customize collection with a spec in Model.collection, which then will be passed to BaseModel.Collection.extend.

```javascript
var DetailedUserInfo = UserInfo.extend({
    urlBase : '/api/detailed_user/',

    defaults : {
        login : '',
        roles : [ 'user' ]
    },

    collection : {
        initialize : function(){
            this.fetch();
        }
    }
});

/*
    DetailedUserInfo.Collection = UserInfo.Collection.extend({
        url : '/api/detailed_user/',
        model : DetailedUserInfo,

        initialize: function(){
            this.fetch();
        }
    });
*/
```

- Class type, which can be extended and can throw/listen to events.

```javascript
    var A = NestedTypes.Class.extend({
        a : 1,

        initialize : function( options ){
            this.listenTo( options.other, 'event', doSomething )
        },

        doSomething : function(){
            this.trigger( 'something' );
        }
    });

    var B = A.extend({
        b : 2,

        initialize : function( options ){
            A.prototype.initialize.apply( this, arguments );
            this.listenTo( options.another, 'event', doSomething )
        },
    });

    var b = new B( options );
```

- Explicit native properties definition (Model, Class, Collection).

Native properties are generated for model attributes, however, they also can be defined explicitly for Model, Class, Collection with 'properties' specification.

For Model, explicit property will override generated one, and "properties : false" disable defaults native properties generation.

```javascript
    var A = NestedTypes.Model.extend({
        defaults : {
            a : 1,
            b : 2
        },

        properties : {
            c : function(){
                return this.a + this.b;
            },

            ax2 : {
                get : function(){
                    return this.a * 2;
                },

                set : function( value ){
                    this.a = value / 2;
                    return value;
                }
            }
        }
    });

    var a = new A();
    console.assert( a.c === 3 );

    a.ax2 = 4;
    console.assert( a.c === 2 );
```

- Run-time errors

NestedTypes detect four error types in the runtime, which will be logged to console using console.error.

```
[Type error](Model.extend) Property "name" conflicts with base class members.
```
It's forbidden for native properties to override members of the base Model. Since native properties are generated for Model.defaults elements, its also forbidden to have attribute names which are the same as members of the base Model.

```
[Type Error](Model.set) Attribute hash is not an object: ...
```
First argument of Model.set must be either string, or literal object representing attribute hash.

```
[Type Error](Model.set) Attribute "name" has no default value.
```
Attempt to set attribute which is not declared in defaults.

```
[Type Error](Model.defaults) "defaults" must be an object, functions are not supported
```

Model.defaults Type Specs
-------------------------

Type specs can be optionally used instead of init values in Model.defaults. Type specs looks like this:

    name : Type

or

    name : Type.value( 5 )

where Type is constructor function.

For typed attributes, if it is assigned with the value of the specified type or null, it will be replaced. In other case NestedTypes try to convert value to the proper attribute's type during 'set'.

- Primitive types (Boolean, Number, String)

Primitive types are being infered from their values, so in most cases special type annotation syntax is not really required.

It means that if attribute has default value of 5, *it will be impossible to assign anything but number or null*. This is quite far from default Backbone attribute behaviour which you might expect.

```javascript
var A = NestedTypes.Model.extend({
    defaults : {
        // Default backbone behaviour - no type, value is 3232
        untyped : NestedTypes.value( 3232 )

        number  : 5,           // Number.value( 5 )
        string  : 'something', // String.value( 'something' )
        boolean : true,        // Boolean.value( true )

        initWithNull  : String.value( null ), // Type is String, default value is null
    }
});

var a = A();

a.number = "5";
console.assert( a.number === 5 );

a.number = "hjhjfd";
console.assert( _.isNaN( a.number ) );

a.string = 5;
console.assert( a.string === "5" );

a.boolean = 0;
console.assert( a.boolean === false );
```

- Date type
    - Automatically serialized to ISO string (don't need to override toJSON)
    - Cross-browser parse of ISO strings, integer timestamps, and MS date format
    - Automatic parsing of server's response

When Date attribute is being assigned with null or Date, it will be replaced. Value of different type will be converted to date using Date constructor. NestedTypes contains additional logic to implement cross-browser ISO date parsing and handling of MS date format.

With Date attributes, there's no need to override Model.parse or Model.toJSON.

```javascript
var A = NestedTypes.Model.extend({
    defaults : {
        created : Date, // = new Date()
        updated : Date.value( null ), // = null
        a : Date.value( 327943789 ), //  = new Date( 327943789 )
        b : Date.value( "2012-12-12 12:12" ) //  = new Date( "2012-12-12 12:12" )
    }
});

var a = A();

a.updated = '2012-12-12 12:12';
console.assert( a.updated instanceof Date );

a.updated = '/Date(32323232323)/';
console.assert( a.updated instanceof Date );
```

- Class type and JS objects
    - new object will be created automatically
    - constructor is used for type cast

```javascript
var A = NestedTypes.Model.extend({
    defaults : {
        obj1 : Ctor, // = new Ctor()
        obj2 : Ctor.value( null ), // = null
        obj3 : Ctor.value( something ), // = new Ctor( something )
    }
});

var a = A();

a.obj2 = "dsds"; // a.obj2 = new Ctor( "dsds" );

console.assert( a.obj2 instanceof Ctor );
```

Attribute options
-----------------
- type and value
- override native property
- override parse/toJSON

Long syntax for attribute type specification looks like this:

    NestedTypes.options({ ... })

The relation between short and long syntax is summarized in the table:
```
 Short form              Long form

 Type                    NestedTypes.options({ type : Type })
 NestedTypes.value( x )  NestedTypes.options({ value : x })
 Type.value( x )         NestedTypes.options({ type : Type, value: x })
 Type.options({ ... })   NestedTypes.options({ type : Type, ... })
```

Both long and short forms of attribute options are chainable. I.e. following construct are possible:

    Type.value( x ).options({ ... })
    NestedTypes.value( x ).options({ })
    NestedTypes.options({ }).value( x )
    ...

Available options so far are:
    - type   : attribute's type (constructor function)
    - value  : attribute's default value
    - toJSON : false, to to remove attribute from JSON
               function( attrValue, attrName ), to customize  toJSON for specific attribute
    - parse  : function( data ) -> {attribute hash}, to customize parse for specific attribute
    - get    : function() -> value, to override native property getter for specific attribute
    - set    : function( value ) -> value, to override native property setter for specific attribute

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
