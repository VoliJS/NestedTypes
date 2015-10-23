# Attribute proxies

Generate fallback native properties in the way that they will point to
the master model. Used for the stores.

Fallback master model's Methods may be mixed in to the prototype.

It's required to know base model's type for that. It means, it might be the good idea to make it model's attribute.

```javascript

// proxy. Create proxy methods and acessors.
var A = Model.extend({
    attributes : {
        // create
        bMixedIn        : B.has.proxy(),
        cMixedSomeProps : C.has.proxy('prop1 prop2 prop3')
    }
});
```

- create native properties accessors for all attributes missing in the main model.
    Scan __attributes if it exists.
    Must be recursive - process all other mixins too.
    {
        get : function(){
            var self = this.mixedIn;
            return self && self.prop;
        },
        set : function( value ){
            this.mixedIn.prop = value;
        }
    }
- add proxied method calls to main model prototype for all functions missing.
    proxiedFun : function(){
        var self = this.mixedIn;
        return self.proxiedFun.apply( self, arguments );
    }
- proxies must handle null value well.
- must work with regular classes.
- changes will naturally populate to the top. When list of members is specified, only
    these changes must trigger master model change.

With this change, no special store traversal algorithm is required.
(!) However, access to the type of default store is required. Which means
    that it's impossible to include dependent stores as a members of master one (!)
    And this is okay.

From the other point of view, it's quite natural in all other senses, and provides
multiple inheritance facilities.

Extremely powerful feature, needs to be implemented.

```javascript

var S = Store.extend({
  attributes : {
    roles : Role.Collection,
    users : User.Collection,
    channelSets : ChannelSet.Collection,
    fallback : DefaultStore.has.proxy()
  }
});

```
