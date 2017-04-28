import { AnyType } from './attributes';
import { Attribute, AttributesValues, AttributeDescriptorMap, CloneAttributesCtor } from './transaction'
import { tools, eventsApi } from '../object-plus'
import { toAttributeDescriptor } from './typespec'
import { CompiledReference } from '../traversable'

const { defaults, isValidJSON, transform, log } = tools,
      { EventMap } = eventsApi;

/** @private */
export interface DynamicMixin {
    _attributes : AttributesSpec
    Attributes : CloneAttributesCtor
    properties : PropertyDescriptorMap
    forEachAttr? : ForEach
    defaults : Defaults
    _toJSON : ToJSON
    _parse? : Parse
    _localEvents : eventsApi.EventMap
    _keys : string[]
}

// Refine AttributesSpec definition.
/** @private */
export interface AttributesSpec {
    [ key : string ] : AnyType
}

export type ForEach   = ( obj : {}, iteratee : ( val : any, key? : string, spec? : Attribute ) => void ) => void;
export type Defaults  = ( attrs? : {} ) => {}
export type Parse     = ( data : any ) => any;
export type ToJSON    = () => any;

// Compile attributes spec
/** @private */
export function compile( rawSpecs : AttributeDescriptorMap, baseAttributes : AttributesSpec ) : DynamicMixin {
    const myAttributes = transform( <AttributesSpec>{}, rawSpecs, createAttribute ),
          allAttributes = defaults( <AttributesSpec>{}, myAttributes, baseAttributes ),
          Attributes = createCloneCtor( allAttributes ),
          mixin : DynamicMixin = {
            Attributes : Attributes,
            _attributes : new Attributes( allAttributes ),
            properties : transform( <PropertyDescriptorMap>{}, myAttributes, x => x.createPropertyDescriptor() ),
            defaults : createDefaults( allAttributes ),
            _toJSON : createToJSON( allAttributes ), // <- TODO: profile and check if there is any real benefit. I doubt it. 
            _localEvents : createEventMap( myAttributes ),
            _keys : Object.keys( allAttributes )
         };

    const _parse = createParse( myAttributes, allAttributes );
    if( _parse ){
        mixin._parse = _parse;
    }

    // Enable optimized forEach if warnings are disabled.
    if( !log.level ){
        mixin.forEachAttr = createForEach( allAttributes );
    }

    return mixin;
}

// Create attribute from the type spec.
/** @private */
function createAttribute( spec, name ){
    return AnyType.create( toAttributeDescriptor( spec ), name );
}

// Build events map for attribute change events.
/** @private */
function createEventMap( attrSpecs : AttributesSpec ) : eventsApi.EventMap {
    let events : eventsApi.EventMap;

    for( var key in attrSpecs ){
        const attribute = attrSpecs[ key ],
            { _onChange } = attribute.options; 

        if( _onChange ){
            events || ( events = new EventMap() );

            events.addEvent( 'change:' + key,
                typeof _onChange === 'string' ?
                    createWatcherFromRef( _onChange, key ) : 
                    wrapWatcher( _onChange, key ) );
        }
    }

    return events;
}

/** @private */
function wrapWatcher( watcher, key ){
    return function( record, value ){
        watcher.call( record, value, key );
    } 
}

/** @private */
function createWatcherFromRef( ref : string, key : string ){
    const { local, resolve, tail } = new CompiledReference( ref, true );
    return local ?
        function( record, value ){
            record[ tail ]( value, key );
        } :
        function( record, value ){
            resolve( record )[ tail ]( value, key );
        }
}

/** @private */
export function createForEach( attrSpecs : AttributesSpec ) : ForEach {
    let statements = [ 'var v, _a=this._attributes;' ];

    for( let name in attrSpecs ){
        statements.push( `( v = a.${name} ) === void 0 || f( v, "${name}", _a.${name} );` );
    }

    return <ForEach> new Function( 'a', 'f', statements.join( '' ) );
}

/** @private */
export function createCloneCtor( attrSpecs : AttributesSpec ) : CloneAttributesCtor {
    var statements = [];

    for( let name in attrSpecs ){
        statements.push( `this.${name} = x.${name};` );
    }

    var CloneCtor = new Function( "x", statements.join( '' ) );
    CloneCtor.prototype = Object.prototype;
    return <CloneAttributesCtor> CloneCtor;
}

// Create optimized model.defaults( attrs, options ) function
/** @private */
function createDefaults( attrSpecs : AttributesSpec ) : Defaults {
    let assign_f = ['var v;'], create_f = [];

    function appendExpr( name, expr ){
        assign_f.push( `this.${name} = ( v = a.${name} ) === void 0 ? ${expr} : v;` );
        create_f.push( `this.${name} = ${expr};` );
    }

    // Compile optimized constructor function for efficient deep copy of JSON literals in defaults.
    for( let name in attrSpecs ){
        const attrSpec = attrSpecs[ name ],
              { value, type } = attrSpec;

        if( value === void 0 && type ){
            // if type with no value is given, create an empty object
            appendExpr( name, `i.${name}.create()` );//TODO: consider adding owner reference
        }
        else{
            // If value is given, type casting logic will do the job later, converting value to the proper type.
            if( isValidJSON( value ) ){
                // JSON literals must be deep copied.
                appendExpr( name, JSON.stringify( value ) );
            }
            else if( value === void 0 ){
                // handle undefined value separately. Usual case for model ids.
                appendExpr( name, 'void 0' );
            }
            else{
                // otherwise, copy value by reference.
                appendExpr( name, `i.${name}.value` );
            }
        }
    }

    const CreateDefaults : any = new Function( 'i', create_f.join( '' ) ),
          AssignDefaults : any = new Function( 'a', 'i', assign_f.join( '' ) );

    CreateDefaults.prototype = AssignDefaults.prototype = Object.prototype;

    // Create model.defaults( attrs, options ) function
    // 'attrs' will override default values, options will be passed to nested backbone types
    return function( attrs? : {} ){ //TODO: Consider removing of the CreateDefaults. Currently is not used. May be used in Record costructor, though.
        return attrs ? new AssignDefaults( attrs, this._attributes ) : new CreateDefaults( this._attributes );
    }
}

/** @private */
function createParse( allAttrSpecs : AttributesSpec, attrSpecs : AttributesSpec ) : Parse {
    var statements = [ 'var a=this._attributes;' ],
        create     = false;

    for( let name in allAttrSpecs ){
        const local = attrSpecs[ name ];

        // Is there any 'parse' option in local model definition?
        if( local && local.parse ) create = true;

        // Add statement for each attribute with 'parse' option.
        if( allAttrSpecs[ name ].parse ){
            const s = `r.${name} === void 0 ||( r.${name} = a.${name}.parse.call( this, r.${name}, "${name}") );`;
            statements.push( s );
        }
    }

    if( create ){
        statements.push( 'return r;' );
        return <any> new Function( 'r', statements.join( '' ) );
    }
 }

/** @private */
function createToJSON( attrSpecs : AttributesSpec ) : ToJSON {
    let statements = [ `var json = {},v=this.attributes,a=this._attributes;` ];

    for( let key in attrSpecs ){
        const toJSON = attrSpecs[ key ].toJSON;

        if( toJSON ){
            statements.push( `json.${key} = a.${key}.toJSON.call( this, v.${ key }, '${key}' );` );
        }
    }

    statements.push( `return json;` );

    return <any> new Function( statements.join( '' ) );
}
