'use strict';
module.exports = function(command) {
    var folderPicker = require("./lib/folderpicker.nw");
    var fsUtil = require("./fs/util");

    var queueFs = fsUtil.queuedFilesystem();

    queueFs.storeLocalFolder = function() {
        return require("./ui").prompt({
            message: "Do you want to pick a folder to store Zed's configuration in?"
        }).then(function(yes) {
            if (yes) {
                return folderPicker().then(function(path) {
                    localStorage.configDir = path;
                    return require("./ui").prompt({
                        message: "Configuration location set, will now exit Zed. Please restart for the changes to take effect."
                    }).then(function() {
                        var gui = nodeRequire('nw.gui');
                        gui.App.quit();
                    });
                });
            }
        });
    };

    command.define("Configuration:Set Configuration Directory", {
        doc: "Choose which directory Zed should store it's configuration in.",
        exec: function() {
            queueFs.storeLocalFolder();
        },
        readOnly: true
    });
    
    queueFs.resolve(require('./fs/config.nw')({
        watchSelf: true
    }));

    return queueFs;
};
