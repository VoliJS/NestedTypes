Object.extend({
	type: null,
	value: undefined,
	create: Function.takes().returns(Object.Any),
	clone: Function.takes(Object.Any).returns(Object.Any),
	cast:
});


//Anything
{
	type: null,
	value: ...,

	create: function() { // might be compiled
		return value; // Deep copy for JSON, don't copy otherwise.
	},

	cast: _.id,
	clone: function(value) {
		return value; // invoke .clone if exists, deep copy for JSON, don't copy otherwise
	}
}


// Separate monadic class for combinators

function accessor(name) {
	return function(value) {
		this._options[name] = value;
		return this;
	}
}

var options = ['value', 'type', 'events', 'triggerWhenChanged', ''];
Object.extend({
	options: function(options) {
		this.spec
	},

	initialize: function() {
		this._options = {};
	}
})


// Native property 'has' will create chained structure
// options and value - too.
// + Anything datatype (?)
// + JSON datatype (Object?) <- PJSO only
//   Object, Array <- Act as PJSO, but perform casts.
// Decide about datatypes Object, Array, {}, and [];
// Object.has.toJSON( false )

Ctor.has.set(function(value))

Date.has
	.value(null)
	.events({

	})
	.triggerWhenChanged(false),


	Date.has
