'use strict';

global.openProjects = global.openProjects || {};

// TODO: fix windows
module.exports = {
    openProjects: global.openProjects,
    getOpenWindow: function() {
        try {
            return global.openWindow;
        } catch(e) {
            return null;
        }
    },
    setOpenWindow: function() {
        global.openWindow = nodeRequire("nw.gui").Window.get();
    },
    closeAll: function() {
        var gui = nodeRequire("nw.gui");
        gui.App.quit();
    }
};