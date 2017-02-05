'use strict';
module.exports = function(command) {
    var fsUtil = require("./fs/util");
    var architect = require("../dep/architect");

    var queueFs = fsUtil.queuedFilesystem();

    queueFs.storeLocalFolder = function() {
        return require("./ui").prompt({
            message: "Do you want to pick a folder to store Zed's configuration in?"
        }).then(function(yes) {
            if (yes) {
                return new Promise(function(resolve) {
                    chrome.fileSystem.chooseEntry({
                        type: "openDirectory"
                    }, function(dir) {
                        if (!dir) {
                            return resolve();
                        }
                        var id = chrome.fileSystem.retainEntry(dir);
                        chrome.storage.local.set({
                            configDir: id
                        }, function() {
                            console.log("Got here");
                            require("./ui").prompt({
                                message: "Configuration location set, will now restart Zed for changes to take effect."
                            }).then(function() {
                                chrome.runtime.reload();
                            });
                        });
                    });
                });
            } else {
                return Promise.resolve();
            }
        });
    };

    command.define("Configuration:Store in Local Folder", {
        doc: "Prompt for a local folder in which to store your Zed config. " + "Zed must restart for this to take effect.",
        exec: function() {
            queueFs.storeLocalFolder();
        },
        readOnly: true
    });

    command.define("Configuration:Store in Google Drive", {
        doc: "Begin syncing your Zed config with Google Drive. " + "Zed must restart for this to take effect.",
        exec: function() {
            chrome.storage.local.remove("configDir", function() {
                require("./ui").prompt({
                    message: "Configuration location set to Google Drive, will now restart Zed for changes to take effect."
                }).then(function() {
                    chrome.runtime.reload();
                });
            });
        },
        readOnly: true
    });

    return queueFs;
};
