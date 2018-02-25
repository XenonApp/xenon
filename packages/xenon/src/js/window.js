'use strict';

if (CHROME) {
    module.exports = require('./window.chrome');
} else {
    module.exports = require('./window.electron');
}
