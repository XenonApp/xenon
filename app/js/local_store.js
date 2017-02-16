'use strict';

let api;
if(window.isNodeWebkit) {
    api = require("./local_store.nw")();
} else {
    api = require("./local_store.chrome")();
}
module.exports = api;
