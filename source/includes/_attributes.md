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
