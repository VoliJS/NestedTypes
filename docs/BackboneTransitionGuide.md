# Backbone to NestedTypes Transition Guide

NestedTypes maintains high level of compatibility with Backbone 1.2 API,
and designed to serve as drop-in backbone replacement. Being completely independent
implementation of Model and Collections classes, it passes the most of modified backbone
 test suite.
 
However, it differs some significant part so you will be required to introduce
some small changes in your application. Procedure is not hard, and if you will go through it you'll be rewarded by ten times app 
performance improvement, and significant reduction of your code base size.

This document is about incompatibilities between backbone and NestedTypes, intended to help you in transition process.

## Model defaults

In backbone, it's okay to pass an object to model's `defaults`, but you are not required to.
Reason is that in Backbone models treated like hash of values, which can be added or 
removed dynamically.
And `defaults` is treated as initial state of this hash.

In NestedTypes, model is class with typed attributes, in much the same way as the class in 
statically typed OO languages like Java or C#. And `defaults` treated as attribute 
type specification. So... 

- Every model attribute *must* be defined in `defaults`, or your model won't work.
- You have to create distinct model subclass for every different attributes set.  
 
In backbone, it's okay to use object in defaults only in case if attributes are primitive values.
To pass object literals, arrays, and objects created with constructor, you need to use `function`:

```javascript
var BackboneModel = Model.extend({
    defaults : function(){
        return {
            x : false,
            a : 1,
            b : 'Hi',
            c : [ 'Hello', 'World' ],
            d : {},
            e : new Date(),
            f : new YourConstructor()
        }
    }
});
```

In NestedTypes, everything will work fine without `function`. Quite contrary, with `function`
 the most of the magic won't work. So, an example above should look like this:

```javascript
var NestedModel = Model.extend({
 defaults : {
     x : Boolean,
     a : 1,
     b : 'Hi',
     c : [ 'Hello', 'World' ],
     d : {},
     e : Date,
     f : YourConstructor
 }
});
```

In Backbone, you can set an attribute with any value you want.

In NestedTypes, attributes always has values of declared types or `null`. And they will be
 converted to declared types on assignment. So, it's the same contract as class members
 have in statically typed languages like C++, Java, or C#.

Type cast rules slightly differs for pre-defined types (consult with documentation for details), but they are designed according to
 the principle of least astonishment.
The general rule you need to know is the following one:

- if type of assigned value is not the same as declared, value constructor is invoked
  to perform type conversion.
 
```javascript
var NestedModel = Model.extend({
 defaults : {
     x : Boolean, // type is explicitly specified, default value is false. 
     a : 1, // Number type inferred from primitive
     b : 'Hi', // String type inferred 
     c : [ 'Hello', 'World' ], // typeless attribute
     d : {}, // typeless attribute
     e : Date, // Date type - functions are treated as constructors
     f : YourConstructor // YourConstructor type
 }
});

var m = new NestedModel();

// In NestedTypes, you can do direct assignments of model's attributes
m.e = 178327832; // new Date( 178327832 )
m.e = "2005-08-09T18:31:42"; // new Date( "2005-08-09T18:31:42" )
```

In Backbone, you have to write `parse` method to handle any complex objects with constructors
in model's attributes.

In NestedTypes, this type conversion rule free you from writing `parse` method 
most of the time.

Therefore, any custom constructor you gonna use in type specs...
- *must* assume that it will receive some parsed JSON as a single arguments.
- *must* have proper implementation of `toJSON` method.

Of course you still can override model's `parse` and `toJSON` (in NestedTypes you can 
even do it on attribute level), but most of the time it's not needed if server's 
API is the standard one.

To sum up, what you need to do:

1. Make sure you have separate model declared for every entity, and no models are used as hash.
2. Describe model's attributes in defaults, removing `function` statement. 
3. Carefully review your `parse` and `toJSON` logic, likely it just need to be removed.
    Or you can keep it, it should be fine too.

## Collections

The best thing about collections is that most of the time in NestedTypes you don't need to define them.
They are implicitly defined for every model, and accessible as `Model.Collection`. Thus,
you can just remove them and add any custom properties to the model's `collection` spec. But
old fashined manual definitions should work fine too. 

Collections will work mostly fine, however, polymorphic collections are supported differently.
Thus `function` in `Collection.model` won't work. What you need to do is to remember,
how would you do it in strictly typed OO language. And create an abstract class with factory:
- Make sure all of your models for this particular collection have common base class.
- Put this base class in `Collection.model`
- Make sure that base class has static `create( attrs, options )` method attached directly to its constructor.
- In `create`, you have to redirect call to the proper model's `new Constructor`.
    Don't forget to pass both `attrs` and `options`.  

After that, this abstract class can be used in both collections _and_ model attributes, and it will be serialized properly.  

There are other incompatibilites, introduced mostly for performance reasons (NestedTypes
collections are about 10 times faster than backbone's). For example:
- No custom `options` are supported. If you have problem with this, fill the bug, 
    let's see what we can do.
- `set` method doesn't support `add` and `remove` options. Cause there are 
separate highly optimized implementation for add, remove, and set.
- `at` option is supported for `add` method only, cause of its crazy semantic in `set`.

And there are some very pleasant new features you always wanted but afraid to ask for. For example,
collections emit new `changes` event, which is being fired only once for any type of collection's change.
 Just like model's `change` event. But we're not here to talk about new features.

## Validation

While validation API in NestedTypes is close to Backbone's one, it has different semantic due to the support for
complex nested models and collections.

Most important difference is that in backbone validation checks _model update_ and _prevents_ it from happening if it appears not to be valid.
In NestedTypes, validation checks _model state_, and _never_ prevent changes to the model.

The semantic of `model.validate()` method differs accordingly. In backbone validates model _update_ receiving attribute hash.
In NestedTypes, it validates model itself, _when validation result is needed_.
It receive model as first argument to help your existing validators a bit, and since in NestedTypes model expose 
its attributes directly, it should be fine in most cases.  

Second, in NestedTypes `model.validate()` is an optional global check for the model, and doesn't prevent recursive
 validation checks for nested models and collections. NestedTypes supports attribute-level declarative validation
 checks in attribute definitions, you are encouraged to use them instead of generic `validate()`.

Also, there are default validation for typed attributes - `Invalid Date`, `NaN`, and `Infinity` cannot be serialized to
    JSON thus considered as invalid attribute values by default.

Next, it's important to understand _when_ validation is performed in NestedTypes:

- `model.set` _ignores_ `validate` option, and never perform validation.
- During `model.save()` by default as in backbone. When validation fails, it returns `model.validationError` wrapped in
    the failed promise. In backbone, it returns `null` in this case. If you think it's not good - open an issue in tracker,
     and we will discuss it.
- On first call to `model.isValid()` or access of `model.validationError`. Validation is potentially expensive for 
    complex models because it results in model tree traversal, thus it's performed 'lazily' and validation result
    is cached across the model tree until the moment models will be actually changed.    

You may find further details about new validation mechanics [in this presentation](http://slides.com/vladbalin/deck#/).
It's designed to play well with React Link, but ignore that part if it's not relevant to you.

## Plugins for handling nested models and relations

Things like `backbone-relational`, and so on.
 
That's simple. Throw them out. You don't need them any more.
NestedTypes differs aggregation from relation, and can handle both equally well.

For aggregation, it's enough to type model or collection constructor in `defaults` spec.
And that's all the story.

What is the most important, on the second `fetch` NestedTypes is smart enough to update your existing nested models and collection *in place*
instead of creating new instances which all naive implementation do
(so called "deep update" feature), because is quite hard to do (you have to override `set` to achieve it in backbone, not `parse`).

For relations by `id`, you need to use `Model.from` and `Collection.subsetOf` metatypes. 
And probably, define the store. Consult with documentation.

## Conclusion
 
Hope this helps. If you have any questions - feel free to open an issue in tracker. Or reach me
by mail.

Sincerely yours, Vlad "Gaperton" Balin and the rest of the Volicon.
