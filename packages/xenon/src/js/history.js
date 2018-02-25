var api;
if (!CHROME) {
    api = require("./history.nw")();
} else {
    api = require("./history.chrome")();
}
module.exports = api;
