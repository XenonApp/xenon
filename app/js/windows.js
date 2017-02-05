var apiProm;
if(window.isNodeWebkit) {
    apiProm = require("./windows.nw")();
} else {
    apiProm = require("./windows.chrome")();
}

module.exports = apiProm;
