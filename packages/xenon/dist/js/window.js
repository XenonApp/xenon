'use strict';

if (WEBPACK) {
    module.exports = require('./window.chrome');
} else {
    module.exports = require('./window.electron');
}
//# sourceMappingURL=window.js.map