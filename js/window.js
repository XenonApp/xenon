'use strict';

const {remote} = require('electron');
const url = require('url');
const path = require('path');

const command = require('./command');
const sandboxes = require('./sandboxes');

var win = remote.getCurrentWindow();

var api = {
    close: function() {
        win.close();
    },
    loadURL: function(title, projectPath) {
        // have to destroy sandboxes or they will leak and the process will not
        // quit correctly
        sandboxes.destroy();
        win.loadURL(url.format({
            pathname: path.join(__dirname, '..', 'editor.html'),
            protocol: 'file:',
            slashes: true,
            query: {
                title,
                url: projectPath
            }
        }));
    },
    useNativeFrame: function() {
        return true;
    },
    fullScreen: function() {
        if (win.isFullscreen()) {
            win.setFullScreen(false);
        } else {
            win.setFullScreen(true);
        }
    },
    maximize: function() {
        win.maximize();
    },
    minimize: function() {
        win.minimize();
    },
    getBounds: function() {
        return win.getBounds();
    },
    setBounds: function(bounds) {
        win.setBounds(bounds);
    },
    setMenu: function(menu) {
        win.setMenu(menu);
    },
    focus: function() {
        win.focus();
    }
};

command.define("Development:Reload window", {
    doc: "Reload the current window.",
    exec: function() {
        win.reload();
    },
    readOnly: true
});

command.define("Development:Show DevTools", {
    doc: "Show the node-webkit developer tools.",
    exec: function() {
        win.webContents.openDevTools();
    },
    readOnly: true
});

module.exports = api;
