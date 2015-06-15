# Nested.Model
## model.defaults
> Two naive model definitions, which would be wrong in plain Backbone.

```javascript
    var UserInfo = Nested.Model.extend({
        defaults : {
            name : 'test',
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

> In Backbone, user.get( 'name' ) is not inherited and would be undefined.
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

> This is the ultimate point of NestedTypes. Naive way of doing things is not a bug any more.

This is the most important difference between `Backbone.Model` and `Nested.Model`.

In NestedTypes `defaults` section in not just the place where you may assign
some attributes with defaults values (or may not).
This is, rather, the *specification* of model's attributes. Therefore:

<aside class="warning">
 Every model attribute you're going to use <b>must</b> be mentioned in <b>Model.defaults</b>
</aside>

<aside class="warning">
<b>Model.defaults must</b> be an object. Functions are forbidden.
</aside>

And when you try to set an attribute which doesn't have default value, you'll got an
error in the console.

If you're backbone.js pro, that might sound like a bad news for you, but wait a bit.
Knowing attributes, NestedTypes can do really wonderful things.

If you're not, just don't mind. NestedTypes is designed to make things very comfortable for you,
everything will work just as you might expect.

### Attribute's Native Properties

`Nested.Model` creates native properties
for every attribute mentioned in `defaults`, so you can access them directly
as if they would be regular object members.

<aside class="notice">
You are not required to use <b>model.get</b> and <b>model.set</b> any more.
</aside>

Well, you might need to use `model.set`
in cases when you want to set multiple attributes at once, or to pass some options.

<aside class="notice">
Direct attribute assignment is significantly faster than <b>model.set</b> in most cases.
</aside>

### Defaults deep cloning

When new model is being created, NestedTypes will deep clone
all items (including objects and arrays) from `defaults` object.

<aside class="notice">
You don't need to wrap <b>defaults</b> object in function any more.
</aside>

### model.defaults( [ attrs ] ) functions
NestedTypes automatically compile `defaults` object to function.

Generated `defaults` function accepts optional `attrs` argument with attribute values hash
and fills missing attributes with default values. So, following statement can be used to
return every model to its original state:

`model.set( model.defaults() )`

### Correct defaults inheritance

When extending some existing model definition, NestedTypes will property
merge base model's `defaults`.

<aside class="notice">
You don't need to do manual tricks for <b>defaults</b> inheritance.
</aside>

## Date attributes
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

To create attribute of `Date` type, pass `Date` constructor instead of default value.
If you want to make it `null` by default, or pass some value to the Date constructor,
add `.value` immediately after `Date`.

In fact, that's all you need to do to handle Date. Because:

* It's serialized to UTC ISO string when `model.toJSON` is called.
* On any assignment, it will be converted to Date from:
    * ISO string
    * milliseconds from 1970
    * Microsoft `/Date(msecs)/` format

This conversion will work in all browsers, including Safary.

<aside class="notice">
You don't need to override <b>Model.parse</b> or <b>Model.toJSON</b>. Nothing.
</aside>

## Complex attribute types
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

Type specs may be used instead of init values in `Model.defaults`. They looks like this:

`name : Constructor` or `name : Constructor.value( x )`

where `Constructor` is JS constructor function, and `x` is `null` or value passed
as constructor's argument.

When value is not given, typed attribute is initialized invoking `new Constructor()`.

As a general rule, when typed attribute is assigned with the value...

* ...which is null, attribute will be set to null.
* ...which is an instance of Constructor, attribute's value will be replaced.
* in other case, NestedTypes will try to convert value to the Constructor type, typically invoking `new Constructor( value )`. Procedure might be more complex for some selected types,
such as nested models and collections.

When receiving data from server, type cast logic is used to parse JSON responce; typically you don't need to override `Model.parse`.

When sending data to the server, attribute's `toJSON` function will be invoked to produce JSON, so you don't need to override `Model.toJSON` for that.

## Primitive attribute types

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

Primitive types (`Boolean`, `Number`, `String`) are special in a sense that *they are inferred from their values*, so they are always typed. In most cases special type annotation syntax is not really required.

It means that if attribute has default value of 5 *then it's guaranteed to be `Number` or `null`*. Becasue, it will be casted to `Number` on assignments.

<aside class="warning">
The fact that <b>attributes holding primitive values are strongly typed by default</b> is serious difference from original Backbone's behavior.
It makes models safer.
</aside>

You can disable type inference using `Nested.value( x )` or assigning attribute with `null` default value.

NestedTypes adds global `Integer` type, to be used in type annotations. It behaves the same as `Number`, but convert values to integer on attribute assignment using `Math.round`. `Integer` type is not being inferred from default values, and needs to be specified explicitly.

## Model.Collection

```javascript
    var users = new UserInfo.Collection();
    var detailedUsers = new DetailedUserInfo.Collection();
```

Every model definition has its own correct `Collection` type extending base `Model.Collection`.
 Collection.model and Collection.url properties are taken from model.

You could customize collection providing the spec in `Model.collection`, which then will be passed to `BaseModel.Collection.extend`.

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
