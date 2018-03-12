/*****************************************************************
 * Mixins engine and @define metaprogramming class extensions
 *
 * Vlad Balin & Volicon, (c) 2016-2017
 */
import { log, assign, omit, hashMap, getPropertyDescriptor, getBaseClass, defaults, transform } from './tools'
import { __extends } from 'tslib'

export interface Subclass< T > extends MixableConstructor {
    new ( ...args ) : T
    prototype : T
}

export interface MixableConstructor extends Function{
    __super__? : object;
    mixins? : MixinsState;
    onExtend? : ( BaseClass : Function ) => void;
    onDefine? : ( definition : object, BaseClass : Function ) => void;
    define? : ( definition? : object, statics? : object ) => MixableConstructor;
    extend? : <T extends object>( definition? : T, statics? : object ) => Subclass<T>;
}

export interface MixableDefinition {
    mixins? : Mixin[]
}

/**
 * Base class, holding metaprogramming class extensions.
 * Supports mixins and Class.define metaprogramming method.
 */
export class Mixable {
    static onExtend : ( BaseClass : Function ) => void;
    static onDefine : ( definition : object, BaseClass : Function ) => object;    
    static __super__ : object
    static mixins : MixinsState;

    /** 
     *  Must be called after inheritance and before 'define'.
     */
    static define( protoProps : MixableDefinition = {}, staticProps? : object ) : MixableConstructor {
        const BaseClass : MixableConstructor = getBaseClass( this );

        // Assign statics.
        staticProps && assign( this, staticProps );

        // Extract and apply mixins from the definition.
        const { mixins, ...defineMixin } = protoProps;
        mixins && this.mixins.merge( mixins );

        // Unshift definition to the the prototype.
        this.mixins.mergeObject( this.prototype, defineMixin, true );

        // Unshift definition from statics to the prototype.
        this.mixins.mergeObject( this.prototype, this.mixins.getStaticDefinitions( BaseClass ), true );

        // Call onDefine hook, if it's present.
        this.onDefine && this.onDefine( this.mixins.definitions, BaseClass );
        
        // Apply merge rules to inherited members. No mixins can be added after this point.
        this.mixins.mergeInheritedMembers( BaseClass );

        return this;
    }

    /** Backbone-compatible extend method to be used in ES5 and for backward compatibility */
    static extend< T extends object>(spec? : T, statics? : {} ) : Subclass< T > {
        let TheSubclass : Subclass< T >;

        // 1. Create the subclass (ES5 compatibility shim).
        // If constructor function is given...
        if( spec && spec.hasOwnProperty( 'constructor' ) ){
            // ...we need to manually call internal TypeScript __extend function. Hack! Hack!
            TheSubclass = spec.constructor as any;
            __extends( TheSubclass, this );
        }
        // Otherwise, create the subclall in usual way.
        else{
            TheSubclass = class Subclass extends this {} as any;
        }

        predefine( TheSubclass );
        spec && TheSubclass.define( spec, statics );

        return TheSubclass;
    }
}

/** @decorator `@predefine` for forward definitions. Can be used with [[Mixable]] classes only.
 * Forwards the call to the [[Mixable.predefine]];
 */
export function predefine( Constructor : MixableConstructor ) : void {
    const BaseClass : MixableConstructor = getBaseClass( Constructor );

    // Legacy systems support
    Constructor.__super__ = BaseClass.prototype;
    
    // Initialize mixins structures...
    Constructor.define || MixinsState.get( Mixable ).populate( Constructor );

    // Make sure Ctor.mixins are ready before the callback...
    MixinsState.get( Constructor );

    // Call extend hook.
    Constructor.onExtend && Constructor.onExtend( BaseClass );
}

/** @decorator `@define` for metaprogramming magic. Can be used with [[Mixable]] classes only.
 *  Forwards the call to [[Mixable.define]].
 */
export function define( ClassOrDefinition : Function ) : void;
export function define( ClassOrDefinition : object ) : ClassDecorator;
export function define( ClassOrDefinition : object | MixableConstructor ){
    // @define class
    if( typeof ClassOrDefinition === 'function' ){
        predefine( ClassOrDefinition );
        ClassOrDefinition.define();
    }
    // @define({ prop : val, ... }) class
    else{
        return function( Ctor : MixableConstructor ){
            predefine( Ctor );
            Ctor.define( ClassOrDefinition );
        }
    }
}

export function definitions( rules : MixinMergeRules ) : ClassDecorator {
    return ( Class : Function ) => {
        const mixins = MixinsState.get( Class );
        mixins.definitionRules = defaults( hashMap(), rules, mixins.definitionRules );
    }
}

// Create simple property list decorator
export function propertyListDecorator( listName: string ) : PropertyDecorator {
    return function propList(proto, name : string) {
        const list = proto.hasOwnProperty( listName ) ?
            proto[ listName ] : (proto[ listName ] = (proto[ listName ] || []).slice());  

        list.push(name);
    }
}

export function definitionDecorator( definitionKey, value ){
    return ( proto : object, name : string ) => {
        MixinsState
            .get( proto.constructor )
            .mergeObject( proto, {
                [ definitionKey ] : {
                    [ name ] : value
                }
            });
    }
}

export class MixinsState {
    mergeRules : MixinMergeRules;
    definitionRules : MixinMergeRules;
    definitions : object = {};
    appliedMixins : Mixin[];

    // Return mixins state for the class. Initialize if it's not exist.
    static get( Class ) : MixinsState {
        const { mixins } = Class;
    
        return mixins && Class === mixins.Class ? mixins :
             Class.mixins = new MixinsState( Class );
    }

    constructor( public Class : MixableConstructor ){
        const { mixins } = getBaseClass( Class );

        this.mergeRules = ( mixins && mixins.mergeRules ) || hashMap();
        this.definitionRules = ( mixins && mixins.definitionRules ) || hashMap();
        this.appliedMixins = ( mixins && mixins.appliedMixins ) || [];
    }

    getStaticDefinitions( BaseClass : Function ){
        const definitions = hashMap(),
            { Class } = this;

        return transform( definitions, this.definitionRules, ( rule, name ) =>{
            if( BaseClass[ name ] !== Class[ name ]){
                return Class[ name ];
            }
        });
    }

    merge( mixins : Mixin[] ){
        const proto      = this.Class.prototype,
            { mergeRules } = this;

        // Copy applied mixins array as it's going to be updated.
        const appliedMixins = this.appliedMixins = this.appliedMixins.slice();

        // Apply mixins in sequence...
        for( let mixin of mixins ) {
            // Mixins array should be flattened.
            if( Array.isArray( mixin ) ) {
                this.merge( mixin );
            }
            // Don't apply mixins twice.
            else if( appliedMixins.indexOf( mixin ) < 0 ){
                appliedMixins.push( mixin );

                // For constructors, merge _both_ static and prototype members.
                if( typeof mixin === 'function' ){
                    // Merge static members
                    this.mergeObject( this.Class, mixin );

                    // merge definitionRules and mergeRules
                    const sourceMixins = ( mixin as any ).mixins;
                    if( sourceMixins ){
                        this.mergeRules = defaults( hashMap(), this.mergeRules, sourceMixins.mergeRules );
                        this.definitionRules = defaults( hashMap(), this.definitionRules, sourceMixins.definitionRules );
                        this.appliedMixins = this.appliedMixins.concat( sourceMixins.appliedMixins );
                    }

                    // Prototypes are merged according with rules.
                    this.mergeObject( proto, mixin.prototype );
                }
                // Handle plain object mixins.
                else {
                    this.mergeObject( proto, mixin );
                }
            }
        }
    }

    populate( ...ctors : Function[] ){
        for( let Ctor of ctors ) {
            MixinsState.get( Ctor ).merge([ this.Class ]);
        }
    }

    mergeObject( dest : object, source : object, unshift? : boolean ) {
        forEachOwnProp( source, name => {
            const sourceProp = Object.getOwnPropertyDescriptor( source, name );
            let rule : MixinMergeRule;

            if( rule = this.definitionRules[ name ] ){
                assignProperty( this.definitions, name, sourceProp, rule, unshift );
            }

            if( !rule || rule === mixinRules.protoValue  ){
                assignProperty( dest, name, sourceProp, this.mergeRules[ name ], unshift );
            }
        });
    }

    mergeInheritedMembers( BaseClass : Function ){
        const { mergeRules, Class } = this;

        if( mergeRules ){
            const proto = Class.prototype,
                baseProto = BaseClass.prototype;

            for( let name in mergeRules ) {
                const rule = mergeRules[ name ];

                if( proto.hasOwnProperty( name ) && name in baseProto ){
                    proto[ name ] = resolveRule( proto[ name ], baseProto[ name ], rule );
                }
            }
        }
    }
}

const dontMix = {
    function : hashMap({
        length : true,
        prototype : true,
        caller : true,
        arguments : true,
        name : true,
        __super__ : true
    }),
    
    object : hashMap({
        constructor : true
    })    
}

function forEachOwnProp( object : object, fun : ( name : string ) => void ){
    const ignore = dontMix[ typeof object ];

    for( let name of Object.keys( object ) ) {
        ignore[ name ] || fun( name );
    }
}

export interface MixinMergeRules {
    [ name : string ] : MixinMergeRule
}

export type MixinMergeRule = ( a : any, b : any ) => any
export type Mixin = { [ key : string ] : any } | Function

// @mixins( A, B, ... ) decorator.
export interface MixinRulesDecorator {
    ( rules : MixinMergeRules ) : ClassDecorator
    value( a : object, b : object) : object;
    protoValue( a : object, b : object) : object;
    merge( a : object, b : object ) : object;
    pipe( a: Function, b : Function ) : Function;
    defaults( a: Function, b : Function ) : Function;
    classFirst( a: Function, b : Function ) : Function;
    classLast( a: Function, b : Function ) : Function;
    every( a: Function, b : Function ) : Function;
    some( a: Function, b : Function ) : Function;
}

export const mixins = ( ...list : Mixin[] ) => (
    ( Class : Function ) => MixinsState.get( Class ).merge( list )
);

// @mixinRules({ name : rule, ... }) decorator.
export const mixinRules = ( ( rules : MixinMergeRules ) => (
    ( Class : Function ) => {
        const mixins = MixinsState.get( Class );
        mixins.mergeRules = defaults( rules, mixins.mergeRules );
    }
) ) as MixinRulesDecorator;

// Pre-defined mixin merge rules

mixinRules.value = ( a, b ) => a;

mixinRules.protoValue = ( a, b ) => a;

// Recursively merge members
mixinRules.merge = ( a, b ) => defaults( {}, a, b );

    // Execute methods in pipe, with the class method executed last.
mixinRules.pipe = ( a, b ) => (
    function( x : any ) : any {
        return a.call( this, b.call( this, x ) );
    }
);

    // Assume methods return an object, and merge results with defaults (class method executed first)
mixinRules.defaults = ( a : Function, b : Function ) => (
    function() : object {
        return defaults( a.apply( this, arguments ), b.apply( this, arguments ) );
    }
);

// Execute methods in sequence staring with the class method.
mixinRules.classFirst = ( a : Function, b : Function ) => (
    function() : void {
        a.apply( this, arguments );
        b.apply( this, arguments );
    }
);

    // Execute methods in sequence ending with the class method.
mixinRules.classLast = ( a : Function, b : Function ) => (
    function() : void {
        b.apply( this, arguments );
        a.apply( this, arguments );
    }
)

    // Execute methods in sequence returning the first falsy result.
mixinRules.every = ( a : Function, b : Function ) =>(
    function() : any {
        return a.apply( this, arguments ) && b.apply( this, arguments );
    }
);
    // Execute methods in sequence returning the first truthy result.
mixinRules.some = ( a : Function, b : Function ) =>(
    function() : any {
        return a.apply( this, arguments ) || b.apply( this, arguments );
    }
);

/**
 * Helpers
 */

function assignProperty( dest : object, name : string, sourceProp : PropertyDescriptor, rule : MixinMergeRule, unshift? : boolean ){
// Destination prop is defined, thus the merge rules must be applied.
    if( dest.hasOwnProperty( name ) ){
        const destProp = Object.getOwnPropertyDescriptor( dest, name );

        if( destProp.configurable && 'value' in destProp ){
            dest[ name ] = unshift ?
                resolveRule( sourceProp.value, destProp.value, rule ) :
                resolveRule( destProp.value, sourceProp.value, rule ) ;
        }
    }
    // If destination is empty, just copy the prop over.
    else{
        Object.defineProperty( dest, name, sourceProp );
    }
}

function resolveRule( dest, source, rule : MixinMergeRule ){
    // When destination is empty, take the source.
    if( dest === void 0 ) return source;

    // In these cases we take non-empty destination:
    if( !rule || source === void 0 ) return dest;

    // In other cases we must merge values.
    return rule( dest, source );
}