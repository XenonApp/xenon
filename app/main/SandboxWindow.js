'use strict';

const {BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');

class SandboxWindow {
    constructor(zed, name) {
        this.zed = zed;
        this.name = name;
        
        this.window = new BrowserWindow({
            width: 400,
            height: 400,
            show: false
        });
        
        this.window.loadURL(url.format({
            pathname: path.join(__dirname, '..', 'worker', 'worker.html'),
            protocol: 'file:',
            slashes: true,
            query: {
                name
            }
        }));
        
        this.handlEvents();
    }
    
    destroy() {
        this.window.close();
    }
    
    exec(sender, data) {
        const apiCallback = (event, name, results) => {
            
        };
        
        const callback = (event, name, results) => {
            if (name === this.name && data.id === results.id) {
                ipcMain.removeListener(callback);
                sender.send('sandbox-results', this.name, results);
            }
        };
        ipcMain.on('did-exec-in-sandbox', callback);
        this.window.webContents.send('exec', data);
    }
    
    handleEvents() {
        this.window.on('closed', () => {
            this.zed.removeSandbox(this);
            this.window = null;
        });
    }
    
    reset() {
        this.window.reload();
    }
}

module.exports = SandboxWindow;
