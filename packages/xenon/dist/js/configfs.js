'use strict';

const background = require('./background');
const command = require('./command');
const fsUtil = require("./fs/util");
const queueFs = fsUtil.queuedFilesystem();

queueFs.storeLocalFolder = function () {
    return require("./ui").prompt({
        message: "Do you want to pick a folder to store Zed's configuration in?"
    }).then(function (yes) {
        if (yes) {
            return background.then(bg => bg.selectDirectory()).then(dir => {
                localStorage.configDir = dir;
                return require("./ui").prompt({
                    message: "Configuration location set, zed will now restart."
                }).then(function () {
                    background.restart();
                });
            });
        }
    });
};

command.define("Configuration:Set Configuration Directory", {
    doc: "Choose which directory Zed should store it's configuration in.",
    exec: function () {
        queueFs.storeLocalFolder();
    },
    readOnly: true
});

queueFs.resolve(require('./fs/config')({
    watchSelf: true
}));

module.exports = queueFs;
//# sourceMappingURL=configfs.js.map