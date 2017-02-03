var api;
if(window.isNodeWebkit) {
    api = require("./sandbox.nw")();
} else {
    api = require("./sandbox.chrome")();
}

module.exports = api;
