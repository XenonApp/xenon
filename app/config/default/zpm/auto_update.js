var zpm = require("./zpm.js");
var fs = xenon.fs;
var config = xenon.config;
var configFs = xenon.configFs;

var DAY = 24 * 60 * 60 * 1000; // number of ms in a day

module.exports = function(info) {
    return configFs.readFile("/packages/last.update").then(check, function() {
        return check("0");
    });

    function check(data) {
        var date = parseInt(data, 10);
        if (Date.now() - date > DAY) {
            console.log("ZPM: Checking for updates...");
            configFs.writeFile("/packages/last.update", "" + Date.now());
            return zpm.updateAll(true).then(function(anyUpdates) {
                if (anyUpdates) {
                    fs.isConfig().then(function(isConfig) {
                        if (isConfig) {
                            return fs.reloadFileList();
                        }
                    });
                    config.reload();
                }
            });
        }
    }
};
