var zpm = require("./zpm.js");
var fs = xenon.fs;
var config = xenon.config;

module.exports = function(info) {
    console.log("Installing packages");
    return zpm.installAll().then(function(anyUpdates) {
        if (anyUpdates) {
            fs.isConfig().then(function(isConfig) {
                if (isConfig) {
                    return fs.reloadFileList();
                }
            });
            config.reload();
        }
    });
};
