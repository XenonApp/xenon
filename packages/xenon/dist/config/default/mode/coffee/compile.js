"use strict";

var session = xenon.session;
var fs = xenon.fs;

var coffee = require("./coffee-script.js");

/**
 * inputs: text
 */
module.exports = function (data) {
    var path = data.path;
    var text = data.inputs.text;
    var jsPath = path.replace(/\.coffee$/, ".js");
    var javascript = coffee.compile(text);
    return fs.writeFile(jsPath, javascript).then(function () {
        return session.flashMessage(path, "Compilation complete", 500);
    });
};
//# sourceMappingURL=compile.js.map