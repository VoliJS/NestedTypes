# NestedTypes model framework

master: [![Master Build Status](https://travis-ci.org/Volicon/backbone.nestedTypes.svg?branch=master)](https://travis-ci.org/Volicon/backbone.nestedTypes)
develop: [![Develop Build Status](https://travis-ci.org/Volicon/backbone.nestedTypes.svg?branch=develop)](https://travis-ci.org/Volicon/backbone.nestedTypes)

`NestedTypes` is the modern data framework, which is mostly backward compatible with backbone.js API and [can be used as 
drop-in backbone replacement](/docs/BackboneTransitionGuide.md) with moderate source code refactoring.

- It's [order of magnitude faster](http://slides.com/vladbalin/performance#/) than backbone, so your application becomes more responsive and you can handle collection which are 10 times larger than you have now.
- It implements nested models and collections in the right way. During `fetch`, nested objects are updated in place, so it's safe to pass them by reference.
- It supports both aggregation and relations by `id` without the need for external plugins.
- It's type-safe, providing the same contract for model attributes as statically typed language does for class members. Thus, 
	    attributes are guaranteed to hold values of declared types whatever you do, making it impossible to break client-server protocol. 
- At the moment of writing, it's an only model framework which supports React's [pure render optimization](https://github.com/Volicon/NestedReact/tree/develop#props-specs-and-pure-render-optimization). 

## Example

Central feature of NestedTypes is attribute type annotations, which makes you feel like you're working with strongly-typed language as Java or C#.
Yet, these annotations are vanilla JavaScript, no transpiler step is required.

To give you some feeling how expressive NestedTypes type system is, lets describe simple model layer for blogging.

```javascript
import { Model, Store } from 'nestedtypes'

const User = Model.extend({
    urlRoot : '/api/users',
    
    attributes : {
        nickname  : String.has // empty string attribute
                          .check( x => x, 'Nickname is required' ), // with simple validator 
        email     : '',     // again empty string attribute
        avatarUrl : String.value( null ) // string attribute initialized with null
    }
});

// We need to put users in store to resolve relations by id...
Nested.store = new ( LazyStore.extend({
    attributes : {
        users : User.Collection // <- collection is implicitly declared
    }
}) );

const Comment = Model.extend(); // predefine Comment model...
Comment.define({ ...because we gonna make recursive comments tree definition... 
    attributes : { // ...right in the next line. Check it out.
        replies : Comment.Collection, // here's plain aggregation. Serialized as nested JSON. 
        time    : Date, // date attribute, defaults to new Date()
        author  : User.from( '~users' ), // serialized as id, resolved with Nested.store.users
        notify  : User.Collection.subsetOf( '~users' ), // array of ids, resolved with Nested.store.users
        body    : String
    }
});

// And we need something to complete our example
const BlogPost = Model.extend({
    urlRoot : '/api/posts',

    attributes : {
        created  : Date, // = new Date()
        author   : User.from( '~users' ),
        title    : String,
        body     : '',     
        comments : Comment.Collection
    }
});

const post = new BlogPost({ id : 5 });
post.fetch().done( () => {
    console.log( post.user.nickname ); // <- direct model attribute's access 
    console.log( post.comments.first().author.nickname ); // <- relations traversed as regular nested models and collections. 
});
```

## Compatibility with Backbone

`NestedTypes` doesn't depend on backbone while retaining some reasonable level of API compatibility and intended to be used as drop-in Backbone
replacement. Some changes to existing backbone models and collection code is required, due the fact that
NestedTypes requires attributes to be declared in Model's `defaults`.

Please, consult with [Backbone Transition Guide](/docs/BackboneTransitionGuide.md) for more details on the topic.

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

## Installation & Requirements

> CommonJS (node.js, browserify):

```javascript
var Nested = require( 'nestedtypes' );
```

> CommonJS/AMD (RequireJS).
> 'jquery' and 'underscore' modules must be defined in config paths.

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
It's acceptable to use `lodash` as drop-in underscore replacement.

### bower

`bower install nestedtypes`

### npm

`npm install nestedtypes`

### Manual
Copy `nestedtypes.js` file to desired location.
