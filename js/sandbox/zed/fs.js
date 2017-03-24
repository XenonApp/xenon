'use strict';

module.exports = {
    readFile: function(path, binary) {
        return require("../../fs").readFile(path, binary).
        catch (function(err) {
            if (err.message) {
                return Promise.reject(err.message);
            } else {
                return Promise.reject("" + err);
            }
        });
    },
    writeFile: function(path, text, binary) {
        return require("../../fs").writeFile(path, text, binary).then(function() {
            // TODO: perhaps replace with different event?
            require("../../eventbus").emit("newfilecreated", path);
        }).
        catch (function(err) {
            if (err.message) {
                return Promise.reject(err.message);
            } else {
                return Promise.reject("" + err);
            }
        });
    },
    listFiles: function() {
        return Promise.resolve(require("../../goto").getFileCache());
    },
    listFilesOfKnownFileTypes: function() {
        return Promise.resolve(require("../../goto").getFileListKnownTypes());
    },
    reloadFileList: function() {
        return Promise.resolve(require("../../goto").fetchFileList());
    },
    isConfig: function() {
        return Promise.resolve(require('../../fs').isConfig);
    },
    getCapabilities: function() {
        return Promise.resolve(require("../../fs").getCapabilities());
    },
    run: function(command, stdin) {
        var fs = require("../../fs");
        if(!fs.getCapabilities().run) {
            return Promise.reject("not-supported");
        }
        return fs.run(command, stdin);
    }
};
