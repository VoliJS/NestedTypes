# Getting Started

[![Master Build Status](https://travis-ci.org/Volicon/backbone.nestedTypes.svg?branch=master)](https://travis-ci.org/Volicon/backbone.nestedTypes)
[![Develop Build Status](https://travis-ci.org/Volicon/backbone.nestedTypes.svg?branch=develop)](https://travis-ci.org/Volicon/backbone.nestedTypes)

Version 1.0.0 is here. Highlights:

- New .has type specs syntax
- Huge performance improvement over vanilla backbonejs. Model updates are 4x faster in most browsers (20x faster in Chrome and nodejs). 

## What it is

NestedTypes is state-of-the-art backbonejs-compatible model framework.

### Complex attribute types

* Cross-browser handling of Date.
* Nested models and collections.
* One-to-many and many-to-many model relationships.

It's achieved using attribute type annotations, which feels in much like statically typed programming language. Yet, this annotations are vanilla JavaScript, no transpiler step is required.

### Safety

NestedTypes check types on every model update and perform dynamic type casts to ensure that attributes will always hold values of proper type.

As result, NestedTypes models are extremely reliable. It's impossible to break client-server protocol with inaccurate attribute assignment. If something will go really wrong, it will warn you with a messages in the console.

### Performance
NestedTypes uses attribute type information for sophisticated optimizations targeting modern JS JIT engines.

Compared to backbonejs, model updates are about 20 times faster in Chrome/nodejs, and 4 times faster in other browsers.

### Easy to use and learn
NestedTypes was originally designed with an idea to make backbonejs more friendly for newbiews.

What we do, is taking intuitive newbie approach to backbonejs, and turn it from the mistake to legal way of doing things.

```javascript
var User = Nested.Model.extend({
    urlRoot : '/api/users',

    defaults : {
        // Primitive types
        login    : "", // String
        email    : String.value( null ), // null, but String
        loginCount : Number.has.toJSON( false ) // 0, not serialized
        active   : Boolean.value( true ), // true

        created  : Date, // new Date()

        settings : Settings, // new Settings()

        // collection of models, received as an array of model ids
        roles    : Role.Collection.subsetOf( rolesCollection ),
        // reference to model, received as model id.
        office   : Office.from( officeCollection )
    }
});

var collection = new User.Collection();
collection.fetch().done( function(){
    var user = collection.first();
    console.log( user.name ); // native properties
    console.log( user.office.name );
    console.log( user.roles.first().name );
});
```
> Types are being checked in run-time on assignment, but instead of throwing exceptions it tries to cast values to defined types.

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
## Installation & Requirements
> CommonJS (node.js, browserify):

```javascript
var Nested = require( 'nestedtypes' );
```

> CommonJS/AMD (RequireJS).
> 'backbone' and 'underscore' modules must be defined in config paths.

```javascript
require([ 'nestedtypes' ], function( Nested ){ ... });
```

> Browser's script tag

```html
<script src="underscore.js" type="text/javascript"></script>
<script src="backbone.js" type="text/javascript"></script>
<script src="nestedtypes.js" type="text/javascript"></script>
<script> var Model = Nested.Model; ... </script>
```

### Supported JS environments
NestedTypes requires modern JS environment with support for native properties.
It's tested in `IE 9+`, `Chrome`, `Safari`, `Firefox`, which currently gives you about 95%
of all browsers being used for accessing the web.

`node.js` and `io.js` are also supported.

### Packaging and dependencies

NestedTypes itself is packaged as UMD (Universal Module Definition) module, and should load dependencies properly in any environment.

NestedTypes require `underscore` and `backbone` libraries. They either must be included globally with `<script>`tag or, if `CommonJS`/`AMD` loaders are used, be accessible by their standard module names.  

### bower

`bower install backbone.nested-types`

### npm

`npm install backbone.nested-types`

### Manual
Copy `nestedtypes.js` file to desired location.

# Object.extend
## Overview

NestedTypes core functionality relies on improved `Object.extend` function, which is also available as separate module
without any side dependencies. It compatible with Backbone's `extend`, while providing some
additional capabilities important for NestedTypes and its applications, such as:

* Native properties
* Forward declarations

You can attach it to your Constructor function like this:

`Object.extend.attach( MyConstructor1, MyConstructor2, ... );`

`Object.extend` can also be used directly to create classes.

<aside class="notice">
NestedTypes attaches <b>Object.extend</b> to all Backbone's classes, thus you may use features described in this chapter with any of your View, Model, Collection, and other Backbone types.
</aside>

When used as a part of NestedTypes,
all `Object.extend` classes also implements `Backbone.Events`, thus your custom objects are capable of sending and receiving backbone events.

You can add your own methods to all classes like this:

`Object.extend.Class.prototype.myMethod = function(){...}`

## Defining classes
```javascript
var MyClass = Object.extend({
    a : 1,
    inc : function(){ return this.a++; },

    initialize : function( x ){
        this.a = x;
    }
},{
    factory : function( x ){
        return new MyClass( x );
    }
});
```

When executed directly,
`Object.extend( protoProps, staticProps )` creates constructor function and extends
its prototype with `protoProps` properties, also attaching `staticProps` to the constructor
itself. Constructor will call optional `initialize` method.

## Inheritance
```javascript
var Subclass = MyClass.extend({
    b : 2,
    initialize : function( a, b ){
        Subclass.__super__.initialize.apply( this, arguments );
        this.b = b;
    }
}
```
Every constructor created with `Object.extend` may be further extended with `extend` method.
Correct prototype chain will be built and attached to subclass constructor. Every subclass
constructor has `__super__` property pointing to the prototype of the base class.

## Overriding constructor
```javascript
var Subclass = MyClass.extend({
    b : 2,
    constructor : function( a, b ){
        MyClass.apply( this, arguments );
        this.b = b;
    }
}
```

You may override constructor instead of dealing with `initialize` function.

##Native Properties
```javascript
var Class = Object.extend({
    properties: {
        readOnly : function(){ return 'hello!'; },
        readWrite : {
            get : function(){ return this._value2; },
            set : function( value ){
                this._value2 = value;
            }
        }
    }
});
```

Native properties can be defined with `properties` spec.
For read-only properties, it's enough to supply get function as spec.
Otherwise, properties specs format is the same as accepted by standard `Object.defineProperties`
function.

You can access native properties as if it would be regular object member variable.

`var x = c.readOnly`

`c.readWrite = 1;`

<aside class="notice">
Native properties are automatically created for model's attributes
</aside>

##Forward declarations
```javascript
var A = Object.extend(),
    B = Object.extend( function(){ this.b = 'b'; } );

A.define({
    bType : B
});

B.define({
    aType : A
});
```

Classes can be created with an `Object.extend()`, and defined later using
`MyClass.define( protoProps, staticProps )` function. It can be helpful
to resolve circular dependencies.

`define` cannot be used to override constructor. It can be achieved by passing
constructor function to `extend`, as it is done for `B` in the example.

<aside class="notice">
Forward declarations are crucial for recursive type-accurate model definitions.
</aside>

##Console Warnings
```javascript
var A = Object.extend({
    a :  function(){}
});

var B = A.extend({
    a : 0 // Warning about type error
});
```
If you try to override base class function with non-function value, `Object.extend`
will notify you about that with a warning to the console. Cause usually it's a mistake.

In this case, you'll see in the console following message:

`[Type Warning] Base class method overriden with value in Object.extend({ a : 0 }); Object = >...`

```javascript
function warning( Ctor, name, value ){
    throw new TypeError( 'Whoops...' );
}

Object.extend.error.overrideMethodWithValue = warning;
```

You may override default warning handling assigning our own function to `Object.extend.error.overrideMethodWithValue`.

<aside class="warning">
When used as part of NestedTypes, this and other warning handlers
are located in <b>Nested.error</b> variable.
</aside>

# Nested.Model
## Overview
In NestedTypes model definition's `defaults` section is the *specification* of model's attributes.
`attributes` keyword may be used instead of `defaults`.

In `defaults` or `attributes`, you may specify attribute default value, its type, and different options of
attribute behavior. Refer to corresponding sections of the manual for details.

<aside class="warning">
Every model attribute <b>must</b> be mentioned in <b>Model.defaults</b>
</aside>

In NestedTypes, attribute declaration is mandatory. When you try to set an attribute which doesn't have default value, you'll got an error in the console.

<aside class="warning">
<b>Model.defaults must</b> be an object. Functions are forbidden.
</aside>

## model.defaults( [ attrs ], [ options ] )
```javascript
    var UserInfo = Nested.Model.extend({
        defaults : {
            name : 'test'
        }
    });

    var DetailedUserInfo = UserInfo.extend({
        attributes : { // <- alternative syntax for 'defaults'
            login : '',
            roles : [ 'user' ]
        }
    });

    var user = new DetailedUserInfo();
```

> In Backbone, 'name' attr is not inherited and would be undefined.
> In NestedTypes it's inherited, and you can access it directly.

```javascript
    console.assert( user.name === 'test' );
    user.name = 'admin';
```

> In Backbone all models will share the same instance of [ 'user' ] array. Bug.
> In NestedTypes, user.roles is deep copied on creation. Good practice.

```javascript
    user.roles.push( 'admin' );
```

NestedTypes automatically creates `defaults` function for every model
from model attribute's spec. Base model attributes will be inherited.

Following statement can be used to return every model to its original state:

    `model.set( model.defaults() )`

`defaults` function accepts optional `attrs` argument with attribute values hash
and fills missing attributes with default values.

### default values deep cloning

When new model is being created, NestedTypes will deep clone
all items (including objects and arrays) from `defaults` object.

<aside class="notice">
You don't need to wrap <b>defaults</b> object in function any more.
</aside>

### Correct defaults inheritance

When extending some existing model definition, NestedTypes will property
merge base model's `defaults`.

<aside class="notice">
You don't need to do manual tricks for <b>defaults</b> inheritance.
</aside>

## model.attrName

NestedTypes creates native property for every attribute.

`model.attr = val;` has the same effect as `model.set( 'attr', val );`

`val = model.attr;` has the same effect as `val = model.get( 'attr' );`

<aside class="notice">
Accessing individual attributes with native properties is significantly
faster than using <b>get</b> and <b>set</b>.
</aside>

You still might need to use `model.set` in cases when you want to set multiple attributes
at once, or to pass some options.

## model.id
In NestedTypes, `model.id` is assignable property, linked to `model.attributes[ model.idAttribute ]`.

`model.id = 5` has the same effect as `model.set( model.idAttribute, 5 )`

## model.properties
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : 1
    },

    properties : {
        b : function(){ return this.a + 1; }
    }
});

var m = new M();
console.log( m.b ); // 2
```
Custom native properties specification. Most typical use case is calculated properties.

`model.properties` is the part of `Object.extend` functionality. Refer to `Object.extend` manual section for details.

## model.set()

Set model attributes. In NestedTypes, this operation is *type safe*. It's guaranteed that
model attribute will always hold null or value of specified type.

1. Values are converted to proper types. For existing nested models and collections `deep update` may be
invoked. Refer to `Attribute Types` manual section for details.
2. Set hooks are being executed for changing attributes. Refer to `Attribute Options` section for details.
3. Events are being registered for changing attributes. `replace:attr` events are fired,
4. Attribute values are being set, firing regular change events.

On attempt to set an attribute which is not defined, warning message will be printed to console.

In NestedTypes, you can assign individual model attributes directly, and it's faster than using `set`:
    `model.attr = val;`

## model.get( 'attr' )

Get attribute value by name. Returned value can be modified with `get hook` in attribute definition.

In NestedTypes, you can access model attributes directly, and it's faster than `get`:
    `val = model.attr;`

## Deep clone

    `model.deepClone()` or `model.clone({ deep : true })`

Deeply clone model with all nested models, collections, and other complex types.

## Deep get and set

    `x = model.deepGet( 'attr1.attr2.modelId.attr3.objId' )`

Get attribute by dot-separated path.
Model attribute name, model.id or model.cid (for collection attribute), index (for array), or object property name ( for plain objects) may be used as an elements of the path.

If some model in the middle of path doesn't exists, it will return `undefined`.  

    `x = model.deepSet( 'attr1.attr2.modelId.attr3.objId', x )`

Set model value by dot-separated path. If model attribute in the middle of path equals to null, empty model will be created.

## Model.Collection

```javascript
var UserInfo = Nested.Model.extend({
    urlBase : '/api/user/',

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

var collection = new UserInfo.Collection();
```

Every model definition has its own correct `Collection` type extending base `Model.Collection`, which can be
accessed instantly without declaration. `Collection.model` and `Collection.url` properties are taken from model.

    `var collection = new AnyModel.Collection();`

You could customize collection definition providing the spec in `Model.collection`, which then will be passed to `BaseModel.Collection.extend`.

## Model.define()
```javascript
var Tree = Nested.Mode.extend();

Tree.define({
    defaults : {
        branches : Tree.Collection
    }
});
```
Forward declarations makes possible type-accurate recursive and mutually recursive model definitions.

`Model.define` is the part of `Object.extend` functionality. Refer to `Object.extend` manual section for details.

## Serialization
### model.toJSON
```javascript
var M = Nested.Model.extend({
    defaults : {
        // Attribute-level toJSON.
        a : String.has.toJSON( false ),
        b : 5
    },

    // Model-level toJSON.
    toJSON : function(){
        // Call NestedTypes serialization algorithm.
        var json = Nested.Model.prototype.toJSON.apply( this, arguments );

        // Do some json transformations...

        return json;
    }
});
```

All nested attributes will be serialized automatically.

<aside class="notice">
Normally, you don't need to override this method.
</aside>

You can control serialization of any attribute with `toJSON` attribute option. Most typical use case is to exclude attribute from those which are being sent to the server.

### model.parse
```javascript
var M = Nested.Model.extend({
    defaults : {
        // Attribute-level parse transform.
        a : AbstractModel.has.parse( AbstractModel.factory )
    },

    // Model-level parse transform.
    parse : function( resp ){
        // Do some resp transformations...

        // (!) Call attribute-level parse transform (!)
        return this._parse( resp );
    }
});
```
All nested attributes will be parsed automatically.

<aside class="notice">
Normally, you don't need to override this method.
</aside>

You can customize parsing of any attribute with `parse` attribute option. Most typical use case is to create proper model subclass for abstract model attribute.

You may need to override model-level `parse` function in order to change attribute names or top-level format.

<aside class="warning">
If you override <b>model.parse</b>, you have to call <b>this._parse</b>
(or Nested.Model.prototype.parse) to make attribute's <b>parse option</b> work.
</aside>

# Attribute Types
## Generic Constructor types
```javascript
var A = Nested.Model.extend({
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

### Type spec format
Type specs may be used instead of init values in `Model.defaults`. They looks like this:

`name : Constructor` or `name : Constructor.value( x )`

where `Constructor` is JS constructor function, and `x` is `null` or value passed
as constructor's argument.

When value is not given, typed attribute is initialized invoking `new Constructor()`.

### Type casting rules
When typed attribute is assigned with the value...

* ...which is `null`, attribute value will be set to `null`.
* ...which is an instance of `Constructor`, attribute's value will be replaced with a given one.
* in other case, NestedTypes will try to convert value to the `Constructor` type, typically invoking `new Constructor( value )`. Procedure might be more complex for some selected types,
such as nested models and collections.

<aside class="notice">
It's guaranteed that attribute will always hold either `null` or instance of `Constructor` type.
</aside>

### Serialization

Constructor types are being serialized with `JSON.stringify()` method. You may override `toJSON` *for your type*
to customize serialization. I.e.

    `this.name.toJSON()`

will be invoked to produce JSON, if this method exists.

When receiving data from server, standard type cast logic is used to convert JSON response to Constructor object.
I.e.

    `this.name = new Constructor( jsonResponse )`

will be invoked.

<aside class="notice">
Normally, you don't need to override model.toJSON() and model.parse().
You're encouraged to properly implement constructor and toJSON of your custom type.
</aside>

## Date type
```javascript
var A = Nested.Model.extend({
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

### Type spec format
To create attribute of `Date` type, pass `Date` constructor instead of default value.

    `time : Date` or `time : Date.value( x )`

When default value is given, it will be converted to Date using type casting rules.

### Type casting rules

* `Number` is treated as milliseconds from 1970 timestamps, as returned by Date.getTime().
* `String` is treated as one of the following date-time formats (will be detected automatically):
    * UTC ISO time string.
    * Local date-time string.
    * Microsoft `/Date(msecs)/` time string.
* `null` sets attribute to `null` bypassing type conversion logic.
* Other values will be converted to `Invalid Date`.

<aside class="notice">
<b>NestedTypes</b> is capable of parsing ISO date format properly in all browsers, including Safary.
</aside>

### Serialization

`Date` attributes are serialized to UTC ISO date string by default. You may customize date serialization format
providing attribute's `toJSON` option. Following option will serialize `time` to milliseconds.

    `time : Date.has.toJSON( function( date ){ return date.getTime(); })`

You can prevent attribute from being serialized, using:

    `time : Date.has.toJSON( false )`

`Date` attributes are being parsed from JSON using type casting rules.

<aside class="notice">
You don't need to override <b>Model.parse</b> or <b>Model.toJSON</b> to handle Date attributes.
</aside>

## Primitive types
```javascript
var A = Nested.Model.extend({
    defaults : {
        // Original backbone behaviour - no type, value is 3232
        untyped : Nested.value( 3232 )

        // defaults with primitive types are always 'typed'
        number  : 5,           // same as Number.value( 5 )
        integer : Integer.value( 6 ),
        string  : 'something', // same as String.value( 'something' )
        string1 : '',          // same as String
        boolean : true,        // same as Boolean.value( true )

        initWithNull  : String.value( null ), // Type is String, default value is null
    }
});

var a = A();

a.boolean = "hello";
console.assert( a.boolean === true );

a.number = "5";
console.assert( a.number === 5 );

a.number = "hjhjfd";
console.assert( _.isNaN( a.number ) );

a.integer = 1.5423;
console.assert( a.integer === 2 );

a.string = 5;
console.assert( a.string === "5" );

a.boolean = 0;
console.assert( a.boolean === false );
```

### Type spec format
Primitive types (Boolean, Number, String) are special in a sense that *they are inferred from their values*. In most cases special type annotation syntax is not really required. For example:
* `n : 5` is the same as `n : Number.value( 5 )`
* `b : true` is the same as `b : Boolean.value( true )`
* `s : 'hi'` is the same as `s : String.value( 'hi' )`
* `x : null` is *not* the same. No type will be being inferred from `null` value.

<aside class="warning">
Even without type annotations, it's guaranteed that attributes will <b>retain the type of default primitive values</b>. This is serious difference from backbonejs behavior, which makes models safer.

You can disable type inference using <b>Nested.value( x )</b> or just specifying <b>null</b> default value.
</aside>

### Integer type
NestedTypes adds global `Integer` type, to be used in type annotations. `Integer` type is not being inferred from default values, and needs to be specified explicitly.

### Type casting rules
* `null` will set attribute to `null` for all primitive types.
* `Number` attribute:
    * Number( x ) will be invoked to parse numbers.
    * Attribute will be set to `NaN` if conversion will fail.
* `Integer` attribute:
    * Same as `Number`, but values also converted to integer using `Math.round`.
* `String` attribute:
    * Primitive types will be converted to their string representation.
    * For objects, `x.toString()` method will be invoked.
    * Conversion to string never fails.
* `Boolean` attribute:
    * Will be always converted to `true` or `false` using standard JS type cast logic.

### Serialization
Primitives are serialized to JSON directly. You can disable serialization of particular attribute with an option:

    `x : Integer.value( 5 ).toJSON( false )`

## Untyped attributes
### Type spec format
To define untyped attribute, use either of these options:

* `u : null`, `u : []`, or `u : {}`.
* Any `u : x` where typeof x === 'object'.
* `u : Nested.value( x )` for value of any type, including primitives.

<aside class="notice">
Objects literals will be <b>deep copied</b> on model creation, you don't need to do anything special for it.
</aside>

### Type casting rules
None

### Serialization
When serialized, `value.toJSON` function will be invoked if it exists for particular value.

JSON responses are assigned to untyped attributes as is.

## Models and Collections
```javascript
var User = Nested.Model.extend({
    defaults : {
        name        : String,
        created     : Date,
        group       : Group,
        permissions : Permission.Collection
    }
});

var a = new User(),
    b = a.deepClone();
```

### Type spec format
To define nested model or collection, annotate attribute with Model or Collection type:

    `a : MyModel` or `b : MyModel.Collection` or `c : SomeCollection`

<aside class="notice">
In NestedTypes Every <b>Model</b> type has corresponding <b>Collection</b> type, which can be
referenced as <b>Model.Collection</b>.
</aside>

### Inline nested Models and Collections definitions

> Inline nested definitions

```javascript
var M = Nested.Model.extend({
    defaults :{
        // define model extending base Nested.Model
        nestedModel : Nested.defaults({
            a : 1,
            //define model extending specified model
            b : MyModel.defaults({
                // define collection of nested models
                items : Nested.Collection.defaults({
                    a : 1,
                    b : 2
                })

            })
        })
    }
})

```

Simple models and collections can be defined with special shortened syntax.

It's useful in case of deeply nested JS objects, when you previously preferred plain objects and arrays in place of models and collections. Now you could easily convert them to nested types, enjoying nested changes detection and 'deep update' features.

### Type casting
> Deep update example:

```javascript
var user = new User();

// Following assignment...
user.group = { name: "Admin" };
// ...is the same as this:
user.group.set({ name: "Admin" });

// Following assignment...
user.permissions = [{ id: 5, type: 'full' }];
// ...is the same as this:
user.permissions.set( [{ id: 5, type: 'full' }] );

// Following assignment...
user.group = {
    nestedModel : {
        deeplyNestedModel : { attr : 'value' },
        attr : 5
    }
};
// ...is the same as this, but fire single 'change' event
user.group.nestedModel.deeplyNestedModel.attr = 'value';
user.group.nestedModel.attr = 'value';
```


When `Model` or `Collection` attribute is assigned with the value...

* ...which is `null`, attribute value will be set to `null`.
* ...which is an instance of specified `Model`/`Collection`, attribute's value will be replaced with a given one.
* otherwise, if value has incompatible type, and current attribute value...
    * ...is `null`, new model or collection will be created taking value as constructor argument.
    * ...is existing model or collection, update will be delegated to its `set` method performing `deep update`.

### Serialization

Nested models and collections are serialized as nested JSON. When JSON response is received, they are being constructed or updated according to type case rules.

### Change events bubbling

> Event bubbling:

```javascript
var M = Nested.Model.extend({
	defaults: {
		bubbleChanges : ModelOrCollection,

		dontBubble : ModelOrCollection.has.triggerWhanChanged( false )
		}),

		bubbleCustomEvents : ModelOrCollection.has
            .triggerWhanChanged( 'event1 event2 whatever' )
	}
});
```

Change events will be bubbled from nested models and collections.

* `change` and `change:attribute` events for any changes in nested models and collections. Multiple `change` events from submodels during bulk updates are carefully joined together, which make it suitable to subscribe View.render to the top model's `change`.
* `replace:attribute` event when model or collection is replaced with new object. You might need it to subscribe for events from submodels.
* It's possible to control event bubbling for every attribute. You can completely disable it, or override the list of events which would be counted as change:

## Model id references
```javascript
var User = Nested.Model.extend({
    defaults : {
        name : String,
        roles : Role.Collection.subsetOf( roles ) // <- serialized as array of model ids
        location : Location.from( locations ) // <- serialized as model id
    }
});

var user = new User({ id: 0 });
user.fetch();
```
> Server response: "{ id: 0, name : 'john', roles : [ 1, 2, 3 ], location : 6 }"

```javascript
//ref attributes behaves like normal collections and models.
assert( user.roles instanceof Collection );
assert( user.roles.first() instanceof Role );
assert( user.location.name === "Boston" );
```

Sometimes it is suitable to serialize model references as an id or an array of ids.

NestedTypes provides special attribute data types to transparently handle this situation, as if you
would work with normal nested models and collections.

### Model.from

`Model.from` represent reference to the model from existing collection, which is serialized as model id.

    `ref : Model.from( masterCollection )`

Attribute may be assigned with model id or model itself. On `get, attribute behaves as Model type. Model id will be resolved to model on first attribute read attempt.

If master collection is empty and thus reference cannot be resolved, it will defer id resolution and `get` will return `null`. If master collection is not empty, id will be resolved to model from this collection, or `null` if corresponding model doesn't exists.

Attribute counts as changed only when different model or id is assigned.

### Collection.subsetOf

`Collection.subsetOf` is a collection of models taken from other 'master' collection. On first access, it will resolve model ids to real models using master collection for lookups.

If master collection is empty and thus references cannot be resolved, it will defer id resolution and just return empty collection. If master collection is not empty, it will filter out ids of non-existent models.

`Collection.subsetOf` supports some additional methods:

* addAll() - add all models from master collection.
* removeAll() - same as reset().
* toggle( modelOrId ) - toggle specific model in set.
* justOne( modelOrId ) - reset subset to contain just specified model.

`change` events won't be bubbled from models in Collection.subsetOf. Other collection's events will.

### Master Collection
Master collection reference may be:

- direct reference to collection object
- `string`, designating reference to the current model's member relative to 'this'.
- `function`, which returns reference to collection and executed in the context of the model.

# Attribute options
## Type.has

```javascript
var M = Nested.Model.extend({
    defaults : {
        attr : Date.has
                .value( null )
                .toJSON( false )
    }
});
```

Attribute options spec gives you to customize different aspects of attribute behavior, such as:

* attribute serialization control
* nested changes detection
* attribute's get and set

 `.value` is an example of attribute option. In order to get access to other options you need to use keyword `.has`. Options specs are chainable, you can specify any sequence of options separated by dot.

## .value( value )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.value( value ),
        b : Type.value( value )
    }
});
```
Attribute's default value. On model construction, `value` will be casted to `Type` applying usual type casting rules.

<aside class="notice">
`.value` option may be used without leading `.has`.
</aside>

## .toJSON( function( value, name ) | false )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.toJSON( function( value, name ){
            return value.text;
        }),

        b : Type.has.toJSON( false )
    }
});
```
When attribute will be serialized as a part of model, given function will be used *instead* of attribute's toJSON.

Function accepts attribute's `name` and its current `value`, and will be executed in the context of the model, holding an attribute.

Passing `false` option will prevent attribute's serialization.

## .parse( function( value, name ) )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.parse( function( value ){
            return Type.factory( value );
        })
    }
});
```

Attribute-specific `parse` logic, will be executed after model's `parse` method.

Function accepts attribute's `name` and response `value`, and will be executed in the context of the model, holding an attribute.

This option is useful to parse abstract model attributes, or handle non-standard format of specific attributes.

## .get( function( value, name ) )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.get( function( value, name ){
            return value;
        })
    }
});
```

Called during `model.get( 'a' )` or `model.a` in the context of the model, allowing you to modify value which  will be returned without altering attribute itself.

Get hook function accepts attribute's `name` and its current `value`, and returns modified value.

Multiple get hooks are chainable, and will be applied in specified order.

## .set( function( value, name ) )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.set( function( value, name ){
            return value;
        })
    }
});
```

Called during attribute's update in the context of the model *after* type cast but *before* an actual set, allowing you to modify set value.

<aside class="notice">
Set hook is only called when attribute value is changed. For nested models and collections case, it will be called <b>only in case</b> when instance will be replaced, not in case of <b>deep update</b>.
</aside>

Set hook function accepts attribute's `name` and `value` to be set, and returns modified value, or `undefined` to cancel attribute update.

Multiple set hooks are chainable, and will be applied in specified order.

Returned value will be casted to attribute's type applying standard convertion rules. So, it's guaranteed that attribute's value will always hold the correct type.

## .events( eventsMap )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.events({
            'isReady isNotReady' : function(){
                this.trigger( 'imwatchingyou' );
            }
        }),
    }
});
```

Automatically manage events subscription for nested attribute, capable of sending events. Event handlers will be called in the context of of the parent model.

## .triggerWhenChanged( String | false )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : ModelA.has.triggerWhenChanged( 'change myEvent' ),
        b : ModelB.has.triggerWhenChanged( false ),
    }
});
```
<aside class="notice">
Makes sense only for Model and Collection attributes.
</aside>

Override default list of events used for nested changes detection of selected attribute.

Pass `false` option to disable nested changes detection for this attribute.

## Nested.attribute([ optionsHash ])
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Nested.attribute({
            value : null,
            toJSON : false
        }),

        b : Nested.attribute()
                .value( null )
                .toJSON( false )
    }
});
```

`Nested.attribute` function returns attribute spec as it appears after `.has`, optionally accepting set of options as a hash.

<aside class="notice">
It provides a way to pass options to typeless attributes.
</aside>

# Nested.store
There's a global store for the collections, which might be useful in case of bi-directional relationships. It's available as a member of Model (this.store), and globally as Nested.store.

## Initialization
```javascript
Nested.store = {
    roles : Role.Collection,
    locations : Locations.Collection
};

var User = Nested.Model.extend({
    defaults : {
        name : String,
        roles : Collection.subsetOf( 'store.roles' ); // this.store.roles
        location : Location.from( 'store.locations' }); // this.store.locations
    }
});
```

Store needs to be initialized with a hash of collections and models type specs. It can be initialized several times.

Format of the spec object is the same as in `Model.defaults`.

## Lazy loading
On first access to every member of the store, it will fetch data from the server automatically. You need to take care of update events.

## Nested.store.fetch( 'attr1', ...)

Update all store members, which are currently loaded:

    `Nested.store.fetch()`

Fetches store elements with given names:

    `Nested.store.fetch( 'name1', 'name2', ... )`

Returns aggregate promise for xhr objects.

## Nested.clear( 'attr1', ... )

Clear all store collection elements:

`Nested.store.clear()`

Clear selected store collections:

`Nested.store.clear( 'name1', 'name2', ... )`

Returns store to allow chained calls.

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
