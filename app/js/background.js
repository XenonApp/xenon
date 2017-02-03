'use strict';
let bg;
if(window.isNodeWebkit) {
    bg = require("./background.nw")();
} else {
    bg = require("./background.chrome")();
}
module.exports = bg;
