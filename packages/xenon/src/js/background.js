'use strict';

if (CHROME) {
    module.exports = require('./background.chrome');
} else {
    module.exports = require('./background.electron');
}
