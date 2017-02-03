const eventbus = require('./eventbus');
const background = require('./background');
const command = require('./command');

let api;
if(window.isNodeWebkit) {
    api = require("./window.nw")(command, background);
} else {
    api = require("./window.chrome")(eventbus, background);
}

module.exports = api;
