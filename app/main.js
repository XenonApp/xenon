const {app, dialog, ipcMain, BrowserWindow} = require('electron');
const path = require('path');

const ZedWindow = require(path.join(__dirname, 'main', 'ZedWindow'));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const zed = {
    quitting: false,
    removeWindow(win) {
        mainWindow = null;
    }
};

function createWindow() {
    mainWindow = new ZedWindow(zed);
    mainWindow.load('Xenon', '');
    mainWindow.show();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    console.log('windows are all closed');
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('open-directory', event => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    dialog.showOpenDialog(browserWindow, {
        properties: ['openDirectory']
    }, function (dirs) {
        event.sender.send('selected-directory', dirs);
    });
});