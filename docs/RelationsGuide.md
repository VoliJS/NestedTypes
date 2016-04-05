# Stores and Relations Guide

## Store and relations basics
### The problem

When you building complex data layer, sooner or later you will need to cross-reference objects by id. Lets consider
users and roles as an example. For the purpose of the example we assume (and in many real cases its true),
that users and models related to each other as many-to-many.

Two questions arise - how will we send these data in JSON, and how would we ideally want them to appear in our models layer. Lets start with JSON for the users. Obvious solution would be the one as follows:

```javascript
const users = [{
    "id" : 1,
    "login" : "Vini"
    "roles" : [ { "id" : 1, "name" : "Admin" }, { "id" : 2, "name" : "User" } ]
},
{
    "id" : 2,
    "login" : "Avraham"
    "roles" : [ { "id" : 1, "name" : "Admin" }, { "id" : 2, "name" : "User" } ]
}, ... ]
```

So, our user's model in this case will look like this:
 
```javascript
const Role = Model.extend({
    attributes : {
        name : String    
    }
});

const Users = Model.extend({
    attributes : {
        login : String,
        roles : Role.Collection
    }
});
```

Obvious problem is that we're transferring the same roles multiple times, which increase the traffic.
Less obvious problem is that when objects for `role 1` will be deserialized, they will actually become _different_ objects
in every user model. So, when one of them needs to be modified, it should be modified for every user.
In short, as relational DB developer would say, _these data are not normalized_.

So, the best thing we could do, is to normalize them, putting roles in separate collection. So, our 'users collection'
becomes 'users directory object'. 

```javascript
{
    "users" : [
        {
            "id" : 1,
            "login" : "Vini"
            "roles" : [ 1, 2 ]
        },
        {
            "id" : 2,inter
            "login" : "Avraham"
            "roles" : [ 1, 2 ]
        }, ...
    ],

    "roles" : [ { "id" : 1, "name" : "Admins" }, { "id" : 2, "name" : "Users" }, ... ]
}
```

Now JSON looks okay, and we face the second problem. How would we want it to appear in our data layer?

### Handling to-many relationships

I would say, it would be an ideal case if the user of the data layer _wouldn't notice_ this complexity at all. 
If it will look for us like full collection of roles, _and_ as nested collections of roles in every user model (but 
roles in this nested collection will be actually the references to shared objects in full collection of roles), it would
be just fine.

Likely, this is just the thing which NestedTypes allows you to do. It will require some changes to our model definition,
though:

```javascript
const Role = Model.extend({
    attributes : {
        name : String    
    }
});

const Users = Model.extend({
    attributes : {
        login : String,
        roles : Role.Collection.subsetOf( '~roles' )
    }
});

const UsersDirectory = Store.extend({
    attributes : {
        users : User.Collection,
        roles : Role.Collection
    }
})
```

There are two new things here - `Role.Collection.subsetOf( '~roles' )` and `Store`. Lets understand what does it mean.

`CollectionType.subsetOf( path )` spec literally means that the type of an attribute is the given collection, which will
  consists of an elements from different collection with a given `path` relative to model's `this`. `~` is the shortcut 
  for `getStore()` method, so `~roles` path will be resolved to `this.getStore().roles`. `getStore()` method, in turn, 
  will locate the nearest store model traversing object ownership tree upwards, until it will find something which 
  extends `Store` base class.
    
_Speaking simply, `~roles` reference points to the `roles` attribute of the `Store` model, which is the closest parent 
of our model. This semantic is important as it allows us to have multiple store instances in the system at the same time_.    
  
Now, how this code works. `subsetOf` attributes are always serialized as an arrays of model ids. So, it will take
 array of roles ids from the JSON, and wait for the moment you will actually try to read it. And when you read 
 `user.roles` attribute for the first time, it will take master collection from the path you specified, 
 and resolve ids to real models.
 
_Speaking simply, `user.roles` will appear to you as if it would be the regular `Roles.Collection`. And it's the key 
point of design that you should notice nothing strange._ 

There are some differences in behaviour, due to the fact that `subsetOf` is treated as _relation_, not _aggregation_:

- `Collection.subsetOf` is considered as changed (and throws 'changes' event) only in case its elements are being added or removed.
    _No member models changes will trigger collection change, and parent model change._
- When `Collection.subsetOf` is deep cloned, it doesn't clone its elements.
- You can use model ids in the place of the models in `set` and `add` methods.
- As it was mentioned above, it's serialized to an array of ids.

### Handling cross-references

Okay. But what if you want _both_ user and role to reference each other? Yep, you can do it too using 
the special form of `extend` for _forward declaration_:

```javascript
// Make forward declarations of the models to allow recursive definition...
const Role = Model.extend(),
      Users = Model.extend();

Role.define({
    attributes : {
        name : String,
        users : User.Collection.subsetOf( '~users' )
    }
});

User.define({
    attributes : {
        login : String,
        roles : Role.Collection.subsetOf( '~roles' )
    }
});

const UsersDirectory = Store.extend({
    attributes : {
        users : User.Collection,
        roles : Role.Collection
    }
});
```

### to-one relationships and default store

Lets say, we have some content created by users. We have few authors, and it would probably be not so bad idea to 
reference author of this content in JSON by user `id`. However, we don't like an idea that all our collections 
would be bound to the same store as UserDirectory.

First obvious thing we could do to resolve this situation, is to create some global default `store` holding all 'dictionary' data which would be used 
to resolve such an ids across the system. Lets create such a store:  

```javascript
Nested.store = new UsersDirectory();
```

Once we have _default store_, it will be used in all cases when ownership store lookup fails. So, we can just define
our standalone BlogPost model.

But wait. BlogPost have just one author, not many. Thus, we don't need `Collection`, which is `subsetOf` something.
We need `Model`, taken `from` collection.

```javascript
const BlogPost = Model.extend({
    attributes : {
        author : Model.from( '~users' ),
        created : Date,
        title : '',
        body : ''
    }
});

let posts = new BlogPost.Collection();
posts.fetch();
```

Whenever we have default store populated with data, this `post.author` attribute will be indistinguishable from regular
 nested model attribute. But as with `subsetOf`, it's not an _aggregation_, but _relation_. So, there are some differences:
 
- `Model.from` is considered as changed (and throws 'change:attr' event) only in case its model is _replaced_.
    _No nested model changes will trigger attribute change, and parent model change._
- When `Model.from` is deep cloned, it doesn't clone its element.
- You can assign model `id` to this attribute.
- It's serialized as just model ids.

### Pitfalls
There is one problem, however, which you should be aware of. In case when role is being deleted from master collection, you will need to reconcile
  users collection, in order to remove extra users. So far, there are no built in mechanics for that, and an easiest
  way of doing this is just to fetch UsersDirectory from server again.
  
Or (if it really important) you can do something like in the example below.
  
```javascript
const UsersDirectory = Model.extend({
  attributes : { ... },
  
  initialize(){
     this.listenTo( this.roles, 'remove', role => {
        this.users.transaction( () => { // 'users' will trigger single 'changes' event for bulk operation
            this.users.each( user => user.roles.remove( role ) );
        });
     });
  }
});
```

Or ask us to add generic `reconcile` method. In older NestedTypes
 versions it was hard to do efficient enough to make generic implementation, and also its quite rare situation 
 when you really need client-side reconcilation; that's why it's not done yet. But now we can.

## Advanced store usage
### Multiple stores
 
Now let's imagine the situation that we have a lot of authors and posts, and we can't afford to load everything upfront.
 So we want to utilize paging. Still, we have an intention to pack users in JSON separately from the posts.
  
We can do this using the same trick as we done for users and roles originally, no matter do we have default store or not.
Lets just add one more store for our task. For this case, we will create the model for every page with posts.
This model `id` will be the page id.

```javascript
const PostsPage = Store.extend({
    attributes : {
        posts : BlogPost.Collection,
        users : User.Collection
    }
});
```

Now, all `~users` references from `page.posts` will use local `page.users` collection. But `~roles` references from 
`page.users` will find no collection for roles, so what will happen? _They will fall back to the default store we have 
defined above, and take roles from there._

In nested types, you may have multiple stores at the same time, you can dynamically create them, and they plays together:

- Whenever closest parent lookup for the store fails, default store is taken.
- Stores can aggregate other stores.
- Whenever lookup for the resource in particular store fails...
    - parent store is taken, and procedure continues;
 
### Lazy Store

The last thing about our design which is not so good - we're still forced to load everything upfront in our default store.
Which is still UserDirectory so it contains users _and_ roles. It's not so good; our paged posts list 
is not interested in _all_ users.

What we would probably like to have in this situation, is an ability to load default store elements with separate REST 
requests, when we need them. And this strategy will become more important when our application will grow large.

```javascript
const UsersDirectory = LazyStore.extend({
    attributes : {
        users : User.Collection,
        roles : Role.Collection
    }
});
```

`LazyStore` manage enclosed models and collections in following way:

- It expect that any resource in its attributes can be loaded with `fetch()`.
- You can tell `LazyStore` to load specific resources with `store.fetch( 'users', 'other', ... )` call.
- Or you can fetch all resources at once with `fetch()` without arguments.
- `fetch` returns combined promise, so you can track when I/O is finished.
- If you're too `Lazy`, you can skip previous items. `LazyStore` will load it for you automatically on first access attempt.
- You can clean up the store with `store.clean()` to reclaim memory. Or pass specific resource names as in `fetch`.

As with other stores, there might be as many instances of `LazyStore` created dynamically as you wish.  

## Modeling UI state with relations

The fact that reference `path` is taken relative to model's `this` allows us to use local relations in scenarious wihout Stores, which are way simpler and more common than example discussed above. Most of these scenarious happens when you use NestedTypes not in data layer, but to model UI state. Which is very convinient due to _deep changes detection_ feature, and invaluable in sutuations when you need to preserve UI state on browser refresh.

> It's hard to write about UI patterns in general, because different frameworks has different assumptions on what is UI state. So, the case of React is covered in the last section, and React is actually the recommended way of writing applications with NestedTypes.

### List of items with selection

Suppose that we have a list of items in collection, which we need to display. And some items might be selected with a click.

It could be done with DOM manipulation, and we can rely on the DOM as the primary source of information about selection. Which is extrimely bad practice. In case of any UI framework the code will be much cleaner if we would keep information about selection (and other information which is required to render the widget) as a part of the separately managed UI _state_. And here the situation our models and relations comes to help.

First idea which comes to the mind is to add 'selected' attribute to the item's model. And again, it is bad idea no matter which framework you're using. In this case we would mix UI state with our data layer. Server and other part of our application have no interest in selection made in particular UI widget, so we need to keep it separate from the `items` collection.

Thus, we introduce collection of selected items, which is, obviously, the subset of items collection, and put it along with items we wanna render:

```javascript
const State = Model.extend({
    attributes : {
        items : Collection,
        selected : Collection.subsetOf( 'items' )
    }
})
```

Here, since master collection's path is taken relative to `this`, it will be `this.items`. And this spec gives reader quite precise information about the purpose of this `selected`.

Then we can just subscribe for the changes of this model and update our UI on every change. Thanks to `NestedTypes` deep changes detection feature, whenever we will receive items from the server or anything will be changed deep inside of the models for any reason, our UI will be in sync. In case of Backbone View, it will look like this:

```javascript
initialize : function( options ){
	this.model = new State( options );
	this.listenTo( this.model, 'change', this.render );
}
```

So, instead of DOM manipulation, now it's enough to add or remove corresponding item in `selected` collection in our click event handler. It has `toggle` method for that purpose, like `selected.toggle( modelOrId )`. And since `selected` collections knows which subset it is, it can easily handle `toggle` with model id taken from the DOM as an argument.

```javascript
onClick : function( e ){
	const id = $( e.target ).attr( 'model-id' );
	this.model.selected.toggle( id ); // will trigger state model change, which will trigger UI update
}
```


> If just one item may be selected at a time, it will obviously be `Model.from( 'items' )` instead of `Collection.subsetOf`.

### Adding persistence

Now let's suppose that we need to preserve our selection in local storage when browser is refreshed.

First idea is to take some Backbone plugin for working with `localStorage`, and try it on our model. As usual. Bad idea. This time - because it could be done trivially without plugins. Thanks to powerful `NestedTypes` serialization facilities, it's enough to convert our State model to JSON and save it as one piece.

Lets do something quick and dirty to illustrate an idea. First, we need to teach our model to save to and be loaded from local storage. We suspect it won't be the single case, so we create the base class for that.

```javascript
const LocalStorage = Model.extend({
	fetch(){
		if( this.id ){ // take model id as key...
			const json = localStorage.getItem( this.id );
			json && ( this.set( JSON.parse( json ), { parse: true }) );
		}
	},

	save( attrs ){
		attrs && this.set( attrs );
		this.id && localStorage.setItem( this.id, JSON.stringify( this ) );
	}
});
```

Great. When it comes to the `State` model, we probably don't want to save `items` to local storage, because they are received from the server. Just `selected`. And thanks to `subsetOf` metatype, it will be serialized as an array of model ids, and it's exactly what we want. So...

```javascript
const State = LocalStorage.extend({
    attributes : {
        id : 'My Very Specific Widget State Local Storage Key',
        items : Collection.has.toJSON( false ),
        selected : Collection.subsetOf( 'items' )
    }
})
```

Assuming that we will have just one instance of this widget on the screen, it's okay, so it would be enough to add something like this in widget's constructor:

```javascript
    this.model.fetch();
	window.onunload = () => this.model.save();
```

That's really quick and very dirty example (describen trick with local storage is really okay for the top level View only), but I think you got the general idea.

### For the React guys...

...this example would look a bit different. Because React handle state differently (and in much better way) than traditional MVC frameworks. And because we have [special support for React](https://github.com/Volicon/NestedReact) (you're also warmly welcomed to see our complete [React TodoMVC example](https://github.com/gaperton/todomvc-nestedreact/)).

Here `props` will be translated to `propTypes`, `state` will lead to creation of the NestedTypes model to manage state (as you see both have the common type annotation style), `Model` specify the base class for the state model, and `pureRender`... Well, it's pure render, which you've probably been told of as an impossible optimization for mutable data. :) So now you know it was not true.

In the context of our topic, you might wander what `^props.items` reference means. `^` is the shortcut for `getOwner()` call, thus this reference will be translated to `this.getOwner().props.items`, which literally means _the reference to the member of my component's `props`._ Model can make direct references to its parents too, yes. I wouldn't recommend using them in other context, though.

```javascript
const QuickAndDirty = React.createClass({
    props : {
        items : Collection
    },
    
    pureRender : true,
    
    Model : LocalStorage,
    state : {
        id : 'My Very Specific Widget State Local Storage Key',
        selected : Collection.subsetOf( '^props.items' )
    },
    
    componentWillMount(){
        this.state.fetch();
    },
    
    componentWillUnmount(){
        this.state.save();
    },
    
    ...
});
```
