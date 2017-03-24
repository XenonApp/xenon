var api;
if(window.isNodeWebkit) {
    api = require("./history.nw")();
} else {
    api = require("./history.chrome")();
}
module.exports = api;
