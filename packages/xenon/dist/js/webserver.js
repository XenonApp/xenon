"use strict";

var api;
if (!WEBPACK) {
    api = require("./webserver.nw")();
} else {
    api = require("./webserver.chrome")();
}
module.exports = api;
//# sourceMappingURL=webserver.js.map