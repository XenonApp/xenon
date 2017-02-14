const {app, dialog, ipcMain, BrowserWindow} = require('electron');
const path = require('path');

const SandboxWindow = require(path.join(__dirname, 'main', 'SandboxWindow'));
const ZedWindow = require(path.join(__dirname, 'main', 'ZedWindow'));

let mainWindow;
const sandboxes = {};

const zed = {
    quitting: false,
    removeSandbox(sandbox) {
        delete sandboxes[sandbox.name];
    },
    
    // Handle all windows being closed here because the sandbox windows
    // will always remain open
    removeWindow(win) {
        mainWindow = null;
        if (process.platform !== 'darwin') {
            app.quit();
        }
    }
};

function createWindow() {
    mainWindow = new ZedWindow(zed);
    mainWindow.load('Xenon', '');
    mainWindow.show();
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', event => {
    if (!zed.quitting) {
        event.preventDefault();
        zed.quitting = true;
        mainWindow.saveAndCleanup().then(() => app.quit());
    }
});

ipcMain.on('open-directory', event => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    dialog.showOpenDialog(browserWindow, {
        properties: ['openDirectory']
    }, function (dirs) {
        event.sender.send('selected-directory', dirs);
    });
});

ipcMain.on('create-sandbox', (event, name) => {
    sandboxes[name] = new SandboxWindow(zed, name);
});

ipcMain.on('destroy-sandbox', (event, name) => {
    sandboxes[name].destroy();
});

ipcMain.on('reset-sandbox', (event, name) => {
    sandboxes[name].reset();
});

ipcMain.on('exec-in-sandbox', (event, name, data) => {
    sandboxes[name].exec(event.sender, data);
});