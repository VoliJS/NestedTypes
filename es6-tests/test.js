import { define, Model, Store } from 'nestedtypes'

@define
class User extends Model {}

@define
class Role extends Model {}

User.define({
    attributes : {
        name : String,
        roles : Role.Collection.subsetOf( '~roles' )
    }
});

Role.define({
    attributes : {
        name : String,
        users : Role.Collection.subsetOf( '~users' )
    }
});

@define( {
    attributes : {
        roles : Role.Collection,
        users : User.Collection
    },

    url: '/api/config'
})
class ConfigStore extends Store {}

@define({
    Model : Type,
    // when state or Model is present, use
    state : {
        count : Number
    },

    props : {
        a : 25, // type inference, default value
        b : Number, // = undefined
        c : MyModel.has.changeEvents( true ) // = undefined, track changes
    },

    mixins : [ A, B ],
    autobind : 'name1 name2 name3'
})
class MyComponent extends Component{
    render(){

    }
}

// Try base class implementation, not mixin.
// only thing needed to do is chaining calls with the base class ones.