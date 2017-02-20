const {app, dialog, ipcMain, BrowserWindow} = require('electron');
const fs = require('fs');
const path = require('path');

const windowsFile = path.join(app.getPath('userData'), 'openWindows.json');

const ZedWindow = require(path.join(__dirname, 'main', 'ZedWindow'));

const windows = [];

const zed = {
    quitting: false,
    removeWindow(win) {
        windows.splice(windows.indexOf(win), 1);
        if (windows.length) {
            saveOpenWindows();
        }
    }
};

function addWindow(title, url) {
    const window = new ZedWindow(zed);
    window.load(title, url);
    window.show();
    windows.push(window);
    saveOpenWindows();
}

function getOpenWindows() {
    return windows.filter(win => win.path.length).map(window => {
        return {
            title: window.title,
            path: window.path
        };
    });
}

function saveOpenWindows() {
    fs.writeFile(windowsFile, JSON.stringify(getOpenWindows()), {encoding: 'utf-8'}, err => {
        if (err) {
            console.error('Error saving open windows', err);
        }
    });
}

app.on('ready', () => {
    let openWindows;
    try {
        openWindows = fs.readFileSync(windowsFile, {encoding: 'utf-8'});
        if (!openWindows) {
            openWindows = [];
        } else {
            openWindows = JSON.parse(openWindows);
        }
    } catch(e) {
        openWindows = [];
    }
    
    if (!openWindows.length) {
        return addWindow('Zed', '');
    }
    
    openWindows.forEach(win => addWindow(win.title, win.path));
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

ipcMain.on('load-project', (event, title, url) => {
    for (let i = 0; i < windows.length; i++) {
        const win = windows[i];
        if (win.getWebContents() === event.sender) {
            win.load(title, url);
            saveOpenWindows();
        }
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

ipcMain.on('restart', () => {
    app.relaunch();
    app.quit();
});

ipcMain.on('switch-to-project', (event, index) => {
    if (!windows[index].isFocused()) {
        windows[index].focus();
    }
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