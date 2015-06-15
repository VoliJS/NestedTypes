# Model.defaults Type Specs
## Basic type annotation syntax and rules
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

IMPORTANT! Model.defaults must be an object to use attribute type annotations features described here.
defaults function body is supported for backward compatibility with backbone only, in order to simplify transition.

Type specs can be optionally used instead of init values in Model.defaults. They looks like this:

    name : Constructor

or

    name : Constructor.value( x )

where Constructor is JS constructor function, and x is its default value.

When default value is not specified, typed attribute is initialized invoking 'new Constructor()'.

As a general rule, when typed attribute is assigned with the value...
- which is null, attribute will be set to null.
- which is an instance of Constructor, attribute's value will be replaced.
- in other case, NestedTypes will try to convert value to the Constructor type, typically invoking "new Constructor( value )". This type conversion algorithm may be overriden for some selected types.

When receiving data from server, type cast logic is used to parse JSON responce; typically you don't need to override Model.parse.

When sending data to the server, Constructor.toJSON will be invoked to produce JSON for typed attributes, so you don't need to override Model.toJSON for that.

## Primitive types (Boolean, Number, String, Integer)

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

Primitive types are special in a sense that *they are inferred from their values*, so they are always typed. In most cases special type annotation syntax is not really required.

It means that if attribute has default value of 5 *then it's guaranteed to be Number or null* (it will be casted to Number on assignments). This is quite different from original Backbone's behaviour which you might expect, and it makes models safer. For polimorphic attributes holding different types you can disable type inference using 'Nested.value'.

> IMPORTANT! Although it's not possible to use type annotations in Model.defaults function body, primitive types will be inferred from their values in this case. So beware.

NestedTypes adds global Integer type, to be used in type annotations. It behaves the same as Number, but convert values to integer on attribute assignment using Math.round. Integer type is not being inferred from the values, and needs to be specified explicitly.

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

- Automatic parsing of common JSON date representations.
- Automatically serialized to ISO string (don't need to override toJSON)

Date attributes free you from overriding Model.parse or Model.toJSON when you want to transfer dates between server and client.

Strings and numbers will be converted to date with Date constructor. NestedTypes contains additional logic to implement cross-browser ISO date parsing and handling of MS date format.

On serialization, Date.toJSON will be invoked for date attribute, producing UTC-0 ISO date string representation.
