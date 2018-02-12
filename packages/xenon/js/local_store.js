'use strict';

let api;
if (!WEBPACK) {
    api = require("./local_store.nw")();
} else {
    api = require("./local_store.chrome")();
}
module.exports = api;
