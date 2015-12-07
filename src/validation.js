module.exports = {
    properties : {
        validationError(){
            var errors = this._validationError || ( this._validationError = new ValidationError() );
            return errors.update( this );
        }
    },

    _validationError : null,

    validate : function(){},

    _validateNested : function( errors ){
        return 0;
    },

    isValid : function( key ){
        var error = this.validationError;
        return !error || ( key && !error.nested[ key ] );
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

        if( this.error = obj.validate() ){
            this.length++;
        }

        this._changeToken = obj._changeToken;
    }

    return this.length ? this : null;
};