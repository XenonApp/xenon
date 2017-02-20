'use strict';

const {BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');

class ZedWindow {
    constructor(zed) {
        this.zed = zed;
        this.readyToClose = false;
        this.title = 'Zed';
        this.path = '';
        
        this.window = new BrowserWindow({
            width: 800,
            height: 600,
            icon: path.join(__dirname, '..', '..', 'Zed.png'),
            show: false
        });
        this.handleEvents();
    }
    
    focus() {
        this.window.focus();
    }
    
    getWebContents() {
        return this.window.webContents;
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
            this.window = null;
            this.zed.removeWindow(this);
        });
    }
    
    isFocused() {
        return this.window.isFocused();
    }
    
    load(title, projectPath) {
        this.title = title;
        this.path = projectPath;
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
            
            const didSaveSessionHandler = (event) => {
                if (BrowserWindow.fromWebContents(event.sender) === this.window) {
                    didSaveSession = true;
                    ipcMain.removeListener('did-save-session', didSaveSessionHandler);
                    if (didDestroySandboxes) {
                        resolve();
                    }
                }
            };
            ipcMain.on('did-save-session', didSaveSessionHandler);
            
            const didDestroySandboxesHandler = (event) => {
                if (BrowserWindow.fromWebContents(event.sender) === this.window) {
                    didDestroySandboxes = true;
                    ipcMain.removeListener('did-destroy-sandboxes', didDestroySandboxesHandler);
                    if (didSaveSession) {
                        resolve();
                    }
                }
            };
            ipcMain.on('did-destroy-sandboxes', didDestroySandboxesHandler);
            
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
