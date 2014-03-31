backbone.nestedTypes
====================

Backbone.js extension adding model's native properties, type annotations, nested models and collections.

Model's native properties
-------------------------
For any model attributes mentioned in 'defaults', use

    model.first = model.second

instead of

    model.set( 'first', model.get( 'second' ) );

Great for accessing models from templates.

Also, you can define calculated native properties like this:

    var MyModel = Model.extend({
        defaults : {
            otherModel_id : 0,
            yetAnotherModel_id : 2
        },

        __otherModelsCollection : null,

        properties : {
            otherModel : function(){
                return this.__otherModelsCollection.get( this.otherModel_id );
            },

            yetAnotherModel : {
                get : function(){
                    return this.__otherModelsCollection.get( this.yetAnotherModel_id );
                },

                set : function( model ){
                    this.yetAnotherModel_id = model.id;
                }
            }
        }
    });

    // This could be done from some other place...
    MyModel.prototype.__otherModelsCollection = ...

Great for implementing collection joins which looks like nested models.

Type annotations for Model attributes
-------------------------------------

You could use constructor functions as default value.

    var User = Model.extend({
        defaults : {
            name : String,
            created : Date,
            loginCount: Number
        }
    });

New object will be created automatically for any typed attribute, no need to override 'initialize'.
 When typed attribute assigned with value of different type, constructor will be invoked to
convert it to defined type.

    var user = new User();
    assert( user.created instanceof Date );

    user.created = "2012-12-12 12:12"; // string will be converted to Date
    assert( user.created instanceof Date );

    user.loginCount = "jhkhjhjhj";
    assert( user.loginCount === NaN );

It means, that you don't need to override Model.parse and Model.initialize when you receive time and
 date from the server. It will be parsed and serialized to JSON as ISO date automatically.

Nested Models and Collections
-----------------------------

To have nested models and collections, annotate attribute with Model or Collection type.

    var User = Model.extend({
        defaults : {
            name : String,
            created : Date,
            group : GroupModel,
            permissions : PermissionCollection
        }
    });

No need to override 'initialize', 'parse', and 'toJSON', everything will be done automatically.

There is a difference from regular types in 'set' behaviour. If attribute's current value is not null,
and new value has different type, it will be delegated to 'set' method of nested model or collection.
I.e. this code:

    var user = new User();
    user.group = {
        id: 6,
        name: "Admin"
    };

    user.permissions = [{ id: 5, type: 'full' }];

is equivalent of:

    user.group.set({
       id: 6,
       name: "Admin"
    };

    user.permissions.set( [{ id: 5, type: 'full' }] );

Change events will be bubbled from nested models and collections.
- 'change' and 'change:attribute' events for any changes in nested models and collections;
- 'replace:attribute' event when model or collection is replaced with new object.

Other enhancements
------------------
- deepClone operation for deep copy of nested models, collections, and types.
- Default attributes are being inherited from the base class.