'use strict';

const command = require('./command');

var api;
if(window.isNodeWebkit) {
    api = require("./configfs.nw")(command);
} else {
    api = require("./configfs.chrome")(command);
}

module.exports = api;
