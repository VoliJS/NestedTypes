//    This code originates from https://github.com/megawac/underscore/commit/365311c9a440438531ca1c6bfd49e3c7c5f46079
//    and is found in the NPM package purposeindustries/window-or-global (v1.0.1)

//    https://github.com/purposeindustries/window-or-global
//    (c) 2015 Purpose Industries
//    window-or-global may be freely distributed under the MIT license.

'use strict'
module.exports = (typeof self === 'object' && self.self === self && self)
  || (typeof global === 'object' && global.global === global && global)
  || this;
