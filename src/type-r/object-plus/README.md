# MixtureJS

Mixins is very powerful abstraction addressing cross-cutting concerns, which can dramatically simplify inheritance graph when used wisely.

MixtureJS is the toolkit combining React-style mixins, Backbone-style events, and minimal set of Underscore-style object manipulation functions. Just what you need when you're working in modern ES5/ES6 envorinment, packed in API which you already know.

Written in TypeScript, works with ES5, ES6, and TypeScript.

## Installation

`npm install mixturejs`

Packed as UMD, exports to global `Mixture` variable when included with script tag.

> MixtureJS is the core part of [Volicon/Verizon](http://www.volicon.com/) technology stack - [Type-R](https://github.com/Volicon/Type-R), [NestedTypes](https://github.com/Volicon/NestedTypes), and [NestedReact](https://github.com/Volicon/NestedReact).

## Events Performance

MixtureJS _implements_ [Backbone API for Events](http://backbonejs.org/#Events), but it's entirely different internally. Here's the results of the typical
run of the [performance tests](https://github.com/Volicon/mixturejs/tree/master/tests) enclosed.

![performance](https://raw.githubusercontent.com/Volicon/mixturejs/master/perf-chart.jpg)

## Features

- `Mixable`, React-style mixins implementation.
    - Fine-grained control over member merge rules.
    - Can mix both classes and plain objects.
    - Works with and without ES6 class decorators.
- `Object.extend` to simulate classes in ES5.
    - 100% backward compatible with Backbone `.extend()`.
    - Complete `Mixable` support.
    - Native properties declatations (`properties` specification).
- `Messenger`, synchronous events.
    - Can be used as mixin and as a base class.
    - 100% backward API compatibility with [Backbone Events](http://backbonejs.org/#Events) (passes Backbone 1.2.x unit test)
    - Much faster than Backbone events.
- `tools`
    - Object manipulation tools (`assign`, `defaults`, `mapObject`, etc).
    - Simple logging API with variable log-level and overridable functions. Defaults to the `console`.

## Backbone Events Compatibility

`Mixture.Events` implements the complete semantic and API of [Backbone 1.1.x Events](http://backbonejs.org/#Events), with the following exceptions:

- `source.trigger( 'ev1 ev2 ev3' )` is not supported. Use `source.trigger( 'ev1' ).trigger( 'ev2' ).trigger( 'ev3' )` instead.
- `source.trigger( 'ev', a, b, ... )` doesn't support more than 5 event parameters.
- `source.on( 'ev', callback )` - callback will _not_ be called in the context of `source` by default.

## Mixins

Both plain JS object and class constructor may be used as mixins. In the case of the class constructor, missing static members will copied over as well.

You need to import `mixins` decorator to use mixins:

```javascript
import { mixins } from 'mixturejs'

...

@mixins( plainObject, MyClass, ... )
class X {
    ...
}
```

### Merge Rules and React Compatibility

MixtureJS implements _configurable_ merge rules, which allows to add standard React mixins functionality to the ES6 React Components.

```javascript
import React from 'react'
import { Mixable } from 'mixturejs'

// Make React.Component mixable...
Mixable.mixTo( React.Component );

// Define lifecycle methods merge rules...
React.Component.mixinRules({
    componentWillMount : 'reverse',
    componentDidMount : 'reverse',
    componentWillReceiveProps : 'reverse',
    shouldComponentUpdate : 'some',
    componentWillUpdate : 'reverse',
    componentDidUpdate : 'reverse',
    componentWillUnmount : 'sequence',
});
```

Mixin merge rules can be extented in any subclass using the `@mixinRules({ attr : rule })` class decorator. Rule is the string from the following list.

- *merge* - assume property to be an object, which members taken from mixins must be merged.
- *pipe* - property is the function `( x : T ) => T` transforming the value. Multiple functions joined in pipe.
- *sequence* - property is the function. Multiple functions will be called in sequence.
- *reverse* - same as *sequence*, but functions called in reverse sequence.
- *mergeSequence* - merge the object returned by functions, executing them in sequence.
- *every* - property is the function `( ...args : any[] ) => boolean`. Resulting method will return true if every single function returns true.
- *some* - same as previous, but method will return true when at least one function returns true.

If merge rule is an object, the corresponding member is expected to be an object and the rule defines the merge rules for its members.

### Usage Example

Here we adding [Events](http://backbonejs.org/#Events) support (on, off, trigger, listenTo, etc.):

```javascript
import React from 'react'
import { mixins, Events } from 'mixturejs'

const UnsubscribeMixin = {
    componentWillUnmount(){
        this.off();
        this.stopListening();
    }
}

@mixins( Events, UnsubscribeMixin )
class EventedComponent extends React.Component {
    // ...
}
```