'use strict';

if (CHROME) {
    module.exports = require('./sandbox.chrome');
} else {
    module.exports = require('./sandbox.electron');
}
