var api;
if(window.isNodeWebkit) {
    api = require("./webserver.nw")();
} else {
    api = require("./webserver.chrome")();
}
module.exports = api;
