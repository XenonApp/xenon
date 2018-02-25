"use strict";

var api;
if (!WEBPACK) {
    api = require("./history.nw")();
} else {
    api = require("./history.chrome")();
}
module.exports = api;
//# sourceMappingURL=history.js.map