'use strict';

const {ipcRenderer} = require('electron');

const api = {};

api.getOpenWindows = function() {
    return new Promise(resolve => {
        ipcRenderer.once('open-windows', (event, windows) => {
            resolve(windows);
        });
        
        ipcRenderer.send('get-open-windows');
    });
};

api.loadProject = function(title, url) {
    ipcRenderer.send('load-project', title, url);
};

api.openProject = function(title, url) {
    ipcRenderer.send('open-project', title, url);
};

api.restart = function() {
    ipcRenderer.send('restart');
};

api.selectDirectory = function() {
    return new Promise((resolve, reject) => {
        ipcRenderer.once('selected-directory', (event, dirs) => {
            if (!dirs) {
                reject();
            }
            
            resolve(dirs[0]);
        });
        
        ipcRenderer.send('open-directory');
    });
};

api.switchToProject = function(index) {
    ipcRenderer.send('switch-to-project', index);
};

api.quit = function() {
    ipcRenderer.send('quit');
};

module.exports = Promise.resolve(api);

