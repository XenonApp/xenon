const {app, dialog, ipcMain, BrowserWindow} = require('electron');
const path = require('path');

const ZedWindow = require(path.join(__dirname, 'main', 'ZedWindow'));

let mainWindow;

const zed = {
    quitting: false,
    
    // Handle all windows being closed here because the sandbox windows
    // will always remain open
    removeWindow(win) {
        mainWindow = null;
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
        zed.quitting = true;
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