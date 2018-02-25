'use strict';

if (WEBPACK) {
    module.exports = require('./background.chrome');
} else {
    module.exports = require('./background.electron');
}
//# sourceMappingURL=background.js.map