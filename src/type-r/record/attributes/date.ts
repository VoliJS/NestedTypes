import { AnyType } from './generic'
import { tools } from '../../object-plus'

const DateProto = Date.prototype;

// Date Attribute
/** @private */
export class DateType extends AnyType {
    convert( value : any, a?, b?, record? ){
        if( value == null || value instanceof Date ) return value;

        const date = new Date( value ),
              timestamp = date.getTime();

        if( timestamp !== timestamp ){
            this._log( 'warn', 'assigned with Invalid Date', value, record );
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

    clone( value ) { return value && new Date( value.getTime() ); }
}

Date._attribute = DateType;

const msDatePattern  = /\/Date\(([0-9]+)\)\//;

export class MSDateType extends DateType {
    convert( value ) {
        if( typeof value === 'string' ){
            const msDate = msDatePattern.exec( value );
            if( msDate ){
                return new Date( Number( msDate[ 1 ] ) );
            }
        }

        return DateType.prototype.convert.apply( this, arguments );
    }

    toJSON( value ) { return value && `/Date(${ value.getTime() })/`; }
}

export class TimestampType extends DateType {
    toJSON( value ) { return value.getTime(); }
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