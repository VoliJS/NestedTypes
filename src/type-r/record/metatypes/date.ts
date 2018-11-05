/**
 * Date attribute type.
 * 
 * Implements validation, cross-browser compatibility fixes, variety of Date serialization formats,
 * and optimized update pipeline.
 */
import { TransactionOptions } from '../../transactions';
import { AnyType } from './any';
import { AttributesContainer } from '../updates';

// Date Attribute
/** @private */
export class DateType extends AnyType {
    create(){
        return new Date();
    }
    
    convert( next : any, a, record, options ){
        if( next == null || next instanceof Date ) return next;

        const date = new Date( next ),
              timestamp = date.getTime();

        if( timestamp !== timestamp ){
            this._log( 'error', 'Type-R:InvalidDate', 'Date attribute assigned with invalid date', next, record, options.logger );
        }

        return date;
    }

    validate( model, value, name ) {
        if( value != null ){
            const timestamp = value.getTime(); 
            if( timestamp !== timestamp ) return name + ' is Invalid Date';
        }
    }

    toJSON( value ) { return value && value.toISOString(); }

    isChanged( a, b ) { return ( a && a.getTime() ) !== ( b && b.getTime() ); }

    doInit( value, record : AttributesContainer, options : TransactionOptions ){
        // Date don't have handleChanges step.
        return this.transform( value === void 0 ? this.defaultValue() : value, void 0, record, options );
    }

    doUpdate( value, record, options, nested ){
        const   { name } = this,
                { attributes } = record,
                prev = attributes[ name ];
        
        // Date don't have handleChanges step.
        return this.isChanged( prev , attributes[ name ] = this.transform( value, prev, record, options ) );
    }

    clone( value ) { return value && new Date( value.getTime() ); }
    dispose(){}
}

// If ISO date is not supported by date constructor (such as in Safari), polyfill it.
function supportsDate( date ){
    return !isNaN( ( new Date( date ) ).getTime() );
}

if( !supportsDate('2011-11-29T15:52:30.5') ||
    !supportsDate('2011-11-29T15:52:30.52') ||
    !supportsDate('2011-11-29T15:52:18.867') ||
    !supportsDate('2011-11-29T15:52:18.867Z') ||
    !supportsDate('2011-11-29T15:52:18.867-03:30') ){

    DateType.prototype.convert = function( value ){
        return value == null || value instanceof Date ? value : new Date( safeParseDate( value ) );
    }
}

const numericKeys    = [ 1, 4, 5, 6, 7, 10, 11 ],
      isoDatePattern = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;

function safeParseDate( date : string ) : number {
    var timestamp, struct : any[], minutesOffset = 0;

    if( ( struct = isoDatePattern.exec( date )) ) {
        // avoid NaN timestamps caused by undefined values being passed to Date.UTC
        for( var i = 0, k; ( k = numericKeys[ i ] ); ++i ) {
            struct[ k ] = +struct[ k ] || 0;
        }

        // allow undefined days and months
        struct[ 2 ] = (+struct[ 2 ] || 1) - 1;
        struct[ 3 ] = +struct[ 3 ] || 1;

        if( struct[ 8 ] !== 'Z' && struct[ 9 ] !== undefined ) {
            minutesOffset = struct[ 10 ] * 60 + struct[ 11 ];

            if( struct[ 9 ] === '+' ) {
                minutesOffset = 0 - minutesOffset;
            }
        }

        timestamp =
            Date.UTC( struct[ 1 ], struct[ 2 ], struct[ 3 ], struct[ 4 ], struct[ 5 ] + minutesOffset, struct[ 6 ],
                    struct[ 7 ] );
    }
    else {
        timestamp = Date.parse( date );
    }

    return timestamp;
}