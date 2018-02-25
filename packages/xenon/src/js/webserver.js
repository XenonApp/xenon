var api;
if(!CHROME) {
    api = require("./webserver.nw")();
} else {
    api = require("./webserver.chrome")();
}
module.exports = api;
