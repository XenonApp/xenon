'use strict';

module.exports = {
    prompt: function(message, inputText, width, height) {
        return require("../../ui").prompt({
            width: width,
            height: height,
            message: message,
            input: inputText
        });
    },
    blockUI: function(message, withSpinner) {
        require("../../ui").blockUI(message, !withSpinner);
        return Promise.resolve();
    },
    unblockUI: function() {
        require("../../ui").unblockUI();
        return Promise.resolve();
    },
    openUrl: function(url) {
        if (window.isNodeWebkit) {
            var gui = nodeRequire('nw.gui');
            gui.Shell.openExternal(url);
        } else {
            var a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.click();
        }
        return Promise.resolve();
    },
    showWebview: function(url) {
        require("../../ui").showWebview(url);
        return Promise.resolve();
    },
    hideWebview: function() {
        require("../../ui").hideWebview();
        return Promise.resolve();
    }
};
