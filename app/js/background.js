'use strict';

const {ipcRenderer} = require('electron');

// TODO: fix this to handle ipc with main

const api = {};

api.getOpenWindows = function() {
    return new Promise(resolve => {
        ipcRenderer.once('open-windows', (event, windows) => {
            resolve(windows);
        });
        
        ipcRenderer.send('get-open-windows');
    });
};

api.openProject = function(title, url) {
    ipcRenderer.send('open-project', title, url);
};

api.switchToProject = function(index) {
    ipcRenderer.send('switch-to-project', index);
};

api.quit = function() {
    ipcRenderer.send('quit');
};

module.exports = api;

