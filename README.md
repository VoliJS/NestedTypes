# NestedTypes model framework

master: [![Master Build Status](https://travis-ci.org/Volicon/backbone.nestedTypes.svg?branch=master)](https://travis-ci.org/Volicon/backbone.nestedTypes)
develop: [![Develop Build Status](https://travis-ci.org/Volicon/backbone.nestedTypes.svg?branch=develop)](https://travis-ci.org/Volicon/backbone.nestedTypes)

`NestedTypes` is the modern data framework, which is mostly backward compatible with backbone.js API and can be used as 
drop-in backbonejs replacement with [moderate refactoring](/docs/BackboneTransitionGuide.md).

Compared to `backbone`, it's [order of magnitude faster](http://slides.com/vladbalin/performance#/), and has out of the box
support for all the features which could be found in backbone plugins like `backbone-relational`.

### Complex attribute types

* Cross-browser handling of Date attribute type.
* Nested models and collections.
* One-to-many and many-to-many model relationships.

It's achieved using attribute type annotations, which feels in much like statically typed programming language. Yet, this annotations are vanilla JavaScript, no transpiler step is required.

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
        roles    : Role.Collection.subsetOf( 'store.roles' ),
        // reference to model, received as model id.
        office   : Office.from( 'store.offices' )
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

### Safety

NestedTypes check types on every model update and perform dynamic type casts to ensure that attributes will always hold values of proper type.

As result, NestedTypes models are extremely reliable. It's impossible to break client-server protocol with inaccurate attribute assignment. If something will go really wrong, it will fix an error and warn you with a messages in the console.

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

### Performance
NestedTypes uses attribute type information for sophisticated optimizations targeting modern JS JIT engines.

Compared to backbonejs, model updates are up to 40 times faster in Chrome/nodejs, and at least 4 times faster in other browsers.
![Backbone vs NestedTypes](docs/performance.jpg)




## Major changes in 1.3.x:

- [Huge performance improvements](http://slides.com/vladbalin/performance#/).
- Abstract models and collection support.
- Declarative [attribute-level validation](http://slides.com/vladbalin/deck#/).
- Mixins like in React's `createClass`.
- Bug fixes
- Experimental features:
    - First-class hierarchical stores.
- Core changes:
    - Version tokens for models and collections making possible precise and efficient cache invalidation. 
        It makes possible things like React's "pure render" optimization and lazy evaluation with memoization like in new validation.
    - Events, REST, underscore support, and validation is refactored to mixins.
    - Removed unused backbone code. Now NestedTypes contains backbone's shim with View, Router and History for backward compatibility purposes.
    - NestedTypes passes modified backbone 1.2 test suite.

### Compatibility with Backbone

`NestedTypes` doesn't depend on backbone while retaining some reasonable level of API compatibility and intended to be used as drop-in Backbone
replacement. Some changes to existing backbone models and collection code is required, due the fact that
NestedTypes requires attributes to be declared in Model's `defaults`.

Please, consult with [Backbone Transition Guide](/docs/BackboneTransitionGuide.md) for more details on the topic.

Browse complete documentation here: http://volicon.github.io/backbone.nestedTypes/

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

`node.js` is also supported.

### Packaging and dependencies

NestedTypes itself is packaged as UMD (Universal Module Definition) module, and should load dependencies properly in any environment.

NestedTypes requires `underscore` and `jquery` libraries. They either must be included globally with `<script>`tag or, if `CommonJS`/`AMD` loaders are used, be accessible by their standard module names.  

### bower

`bower install nestedtypes`

### npm

`npm install nestedtypes`

### Manual
Copy `nestedtypes.js` file to desired location.
