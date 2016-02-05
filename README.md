# Getting Started

master: [![Master Build Status](https://travis-ci.org/Volicon/backbone.nestedTypes.svg?branch=master)](https://travis-ci.org/Volicon/backbone.nestedTypes)
develop: [![Develop Build Status](https://travis-ci.org/Volicon/backbone.nestedTypes.svg?branch=develop)](https://travis-ci.org/Volicon/backbone.nestedTypes)


## Major changes in 1.3.x:

### Compatibility with Backbone

This version introduce following changes:

- `Model`, `Collection`, and `extend` share no common code with Backbone.
- `Events` and REST functionality (`sync`, `fetch`, `save`, and `destroy` methods) taken from Backbone 1.2. 
- `Router` and `History` are taken from Backbone 1.2, while `View` is taken from Backbone 1.1.
- `NestedTypes` is being tested against modified Backbone 1.2 unit tests.  
- `NestedTypes` retains some reasonable level of API compatibility and intended to be used as drop-in Backbone
   replacement. Some changes to existing backbone models and collection code is required, du.  

Likely, it will continue to be so. 


Browse complete documentation here: http://volicon.github.io/backbone.nestedTypes/

## What it is

It's modern data framework, mostly backward compatible with backbone.js and can be used as drop-in backbonejs replacement.

Compared to `backbonejs`, it's has order of magnitude faster model updates, and support all the features which could be found
in state of the art model frameworks through lightweight and declarative attribute type annotations.

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
