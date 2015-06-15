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
