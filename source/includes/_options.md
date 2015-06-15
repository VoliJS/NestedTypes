# Attribute options
## Type.has

```javascript
var M = Nested.Model.extend({
    defaults : {
        attr : Date.has
                .value( null )
                .toJSON( false )
    }
});
```

Attribute options spec gives you to customize different aspects of attribute behavior, such as:

* attribute serialization control
* nested changes detection
* attribute's get and set

 `.value` is an example of attribute option. In order to get access to other options you need to use keyword `.has`. Options specs are chainable, you can specify any sequence of options separated by dot.

## .value( value )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.value( value ),
        b : Type.value( value )
    }
});
```
Attribute's default value. On model construction, `value` will be casted to `Type` applying usual type casting rules.

<aside class="notice">
`.value` option may be used without leading `.has`.
</aside>

## .toJSON( function( value, name ) | false )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.toJSON( function( value, name ){
            return value.text;
        }),

        b : Type.has.toJSON( false )
    }
});
```
When attribute will be serialized as a part of model, given function will be used *instead* of attribute's toJSON.

Function accepts attribute's `name` and its current `value`, and will be executed in the context of the model, holding an attribute.

Passing `false` option will prevent attribute's serialization.

## .parse( function( value, name ) )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.parse( function( value ){
            return Type.factory( value );
        })
    }
});
```

Attribute-specific `parse` logic, will be executed after model's `parse` method.

Function accepts attribute's `name` and response `value`, and will be executed in the context of the model, holding an attribute.

This option is useful to parse abstract model attributes, or handle non-standard format of specific attributes.

## .get( function( value, name ) )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.get( function( value, name ){
            return value;
        })
    }
});
```

Called during `model.get( 'a' )` or `model.a` in the context of the model, allowing you to modify value which  will be returned without altering attribute itself.

Get hook function accepts attribute's `name` and its current `value`, and returns modified value.

Multiple get hooks are chainable, and will be applied in specified order.

## .set( function( value, name ) )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.set( function( value, name ){
            return value;
        })
    }
});
```

Called during attribute's update in the context of the model *after* type cast but *before* an actual set, allowing you to modify set value.

<aside class="notice">
Set hook is only called when attribute value is changed. For nested models and collections case, it will be called <b>only in case</b> when instance will be replaced, not in case of <b>deep update</b>.
</aside>

Set hook function accepts attribute's `name` and `value` to be set, and returns modified value, or `undefined` to cancel attribute update.

Multiple set hooks are chainable, and will be applied in specified order.

Returned value will be casted to attribute's type applying standard convertion rules. So, it's guaranteed that attribute's value will always hold the correct type.

## .events( eventsMap )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Type.has.events({
            'isReady isNotReady' : function(){
                this.trigger( 'imwatchingyou' );
            }
        }),
    }
});
```

Automatically manage events subscription for nested attribute, capable of sending events. Event handlers will be called in the context of of the parent model.

## .triggerWhenChanged( String | false )
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : ModelA.has.triggerWhenChanged( 'change myEvent' ),
        b : ModelB.has.triggerWhenChanged( false ),
    }
});
```
<aside class="notice">
Makes sense only for Model and Collection attributes.
</aside>

Override default list of events used for nested changes detection of selected attribute.

Pass `false` option to disable nested changes detection for this attribute.

## Nested.attribute([ optionsHash ])
```javascript
var M = Nested.Model.extend({
    defaults : {
        a : Nested.attribute({
            value : null,
            toJSON : false
        }),

        b : Nested.attribute()
                .value( null )
                .toJSON( false )
    }
});
```

`Nested.attribute` function returns attribute spec as it appears after `.has`, optionally accepting set of options as a hash.

<aside class="notice">
It provides a way to pass options to typeless attributes.
</aside>
