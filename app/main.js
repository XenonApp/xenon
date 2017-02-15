const {app, dialog, ipcMain, BrowserWindow} = require('electron');
const path = require('path');

const ZedWindow = require(path.join(__dirname, 'main', 'ZedWindow'));

const windows = [];

const zed = {
    quitting: false,
    
    // Handle all windows being closed here because the sandbox windows
    // will always remain open
    removeWindow(win) {
        windows.splice(windows.indexOf(win), 1);
    }
};

function addWindow(title, url) {
    const window = new ZedWindow(zed);
    window.load(title, url);
    window.show();
    windows.push(window);
}

app.on('ready', () => {
    addWindow('Zed', '');
});

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        zed.quitting = true;
        app.quit();
    }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!windows.length) {
        addWindow('Zed', '');
    }
});

app.on('before-quit', event => {
    if (!zed.quitting) {
        event.preventDefault();
        zed.quitting = true;
        Promise.all(windows.map(window => window.saveAndCleanup()))
            .then(() => app.quit());
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

ipcMain.on('open-project', (event, title, url) => {
    addWindow(title, url);
});

ipcMain.on('switch-to-project', (event, index) => {
    windows[index].focus();
});

ipcMain.on('quit', () => {
    app.quit();
});

ipcMain.on('get-open-windows', event => {
    event.sender.send('open-windows', windows.map((window, index) => {
        return {
            index,
            title: window.title
        };
    }));
});