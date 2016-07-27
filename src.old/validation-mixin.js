'use strict';

var _ = require( 'underscore' );

module.exports = {
    properties : {
        validationError : {
            enumerable : false,
            get : function(){
                var errors = this._validationError || ( this._validationError = new ValidationError() );
                return errors.update( this );
            }
        }
    },

    _validationError : null,

    validate : function(){},

    _validateNested : function( errors ){
        return 0;
    },

    getValidationError : function( key ){
        var error = this.validationError;
        return ( key ? error && error.nested[ key ] : error ) || null;
    },

    /**
     * Extended Backbone API
     * @param {string} key - nested object key
     * @returns {boolean}
     */
    isValid : function( key ){
        return !this.getValidationError( key );
    },

    _invalidate : function( options ){
        var error;
        if( options.validate && ( error = this.validationError ) ){
            this.trigger( 'invalid', this, error, _.extend( { validationError : error }, options ) );
            return true;
        }
    }
};

function ValidationError(){
    this._changeToken = {};
    this.length       = 0;
    this.nested       = {};
    this.error        = null;
}

ValidationError.prototype.update = function( obj ){
    if( this._changeToken !== obj._changeToken ){
        this.length = obj._validateNested( this.nested = {} );

        if( this.error = obj.validate( obj ) ){
            this.length++;
        }

        this._changeToken = obj._changeToken;
    }

    return this.length ? this : null;
};