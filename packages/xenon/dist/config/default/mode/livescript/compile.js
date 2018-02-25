"use strict";

var session = xenon.session;
var fs = xenon.fs;

//var livescript = require("./lib/livescript.js");
var lsc = require("./livescript.js").LiveScript;

/**
 * inputs: text
 */
module.exports = function (data) {
    var path = data.path;
    var text = data.inputs.text;
    var jsPath = path.replace(/\.ls$/, ".js");
    var javascript = lsc.compile(text);
    return fs.writeFile(jsPath, javascript).then(function () {
        return session.flashMessage(path, "Compilation complete", 500);
    });
};
//# sourceMappingURL=compile.js.map