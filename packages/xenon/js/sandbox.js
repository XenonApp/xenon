'use strict';

if (WEBPACK) {
    module.exports = require('./sandbox.chrome');
} else {
    module.exports = require('./sandbox.electron');
}