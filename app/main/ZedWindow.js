'use strict';

const {BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');

class ZedWindow {
    constructor(zed) {
        this.zed = zed;
        this.readyToClose = false;
        
        this.window = new BrowserWindow({
            width: 800,
            height: 600,
            show: false
        });
        this.handleEvents();
    }
    
    handleEvents() {
        this.window.on('move', () => {
            this.saveBounds();
        });
        
        this.window.on('resize', () => {
            this.saveBounds();
        });
        
        this.window.on('close', event => {
            if (!this.zed.quitting && !this.readyToClose) {
                this.readyToClose = true;
                event.preventDefault();
                this.saveAndCleanup().then(() => {
                    this.window.close();
                });
            }
        });
        
        this.window.on('closed', () => {
            this.zed.removeWindow(this.window);
            this.window = null;
        });
    }
    
    load(title, projectPath) {
        this.window.loadURL(url.format({
            pathname: path.join(__dirname, '..', 'editor.html'),
            protocol: 'file:',
            slashes: true,
            query: {
                title,
                url: projectPath
            }
        }));
    }
    
    saveAndCleanup() {
        return new Promise(resolve => {
            let didSaveSession = false;
            let didDestroySandboxes = false;
            
            ipcMain.on('did-save-session', event => {
                if (BrowserWindow.fromWebContents(event.sender) === this.window) {
                    didSaveSession = true;
                    if (didDestroySandboxes) {
                        resolve();
                    }
                }
            });
            
            ipcMain.on('did-destroy-sandboxes', event => {
                if (BrowserWindow.fromWebContents(event.sender) === this.window) {
                    console.log('did destroy sandboxes');
                    didDestroySandboxes = true;
                    if (didSaveSession) {
                        resolve();
                    }
                }
            });
            
            this.window.webContents.send('save-session');
            this.window.webContents.send('destroy-sandboxes');
        });
    }
    
    saveBounds() {
        this.window.webContents.send('save-bounds', this.window.getBounds());
    }
    
    show() {
        this.window.show();
        
        this.window.webContents.openDevTools();
    }
}

module.exports = ZedWindow;
