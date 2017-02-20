var inited = false;
var openProjects = {}, ignoreClose = false;

function log() {
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (typeof arg === "string") {
            process.stdout.write(arg);
        } else {
            process.stdout.write(JSON.stringify(arg));
        }
        process.stdout.write(' ');
    }
    process.stdout.write("\n");
}

function init() {
    if (inited) {
        return;
    }
    inited = true;

    if (gui.App.argv.length === 0) {
        restoreOpenWindows();
    }

    function openEditor(title, url) {
        var w = gui.Window.open('editor.html?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title), {
            position: 'center',
            width: 1024,
            height: 768,
            frame: true,
            toolbar: false,
            icon: "Icon.png"
        });
        return new Promise(function(resolve) {
            w.once("loaded", function() {
                w.focus();
                resolve({
                    addCloseListener: function(listener) {
                        w.on("closed", function() {
                            listener();
                        });
                    },
                    window: w.window,
                    focus: function() {
                        w.focus();
                    }
                });
            });
        });
    }

    // OPEN PROJECTS
    // Returns true if an editor needs to be opened, returns false is not (and focus has been handled already)
    exports.openProject = function(title, url) {
        log("Going to open", title, url);
        if (openProjects[url]) {
            var win = openProjects[url].win;
            win.focus();
            win.window.zed.services.editor.getActiveEditor().focus();
            return false;
        } else {
            // openEditor(title, url);
            return true;
        }
    };

    exports.registerWindow = function(title, url, win) {
        if (!url) {
            return;
        }
        openProjects[url] = {
            win: win,
            title: title
        };
        win.on("close", function() {
            process.stdout.write("Closed a window: " + url);
            delete openProjects[url];
            saveOpenWindows();
        });
        saveOpenWindows();
    };

    exports.getOpenWindows = function() {
        var wins = [];
        Object.keys(openProjects).forEach(function(url) {
            wins.push({
                title: openProjects[url].title,
                url: url
            });
        });
        return wins;
    };

    exports.closeAllWindows = function() {
        ignoreClose = true;
        for (var url in openProjects) {
            openProjects[url].win.close();
        }
    };

    function saveOpenWindows() {
        if (!ignoreClose) {
            try {
                window.localStorage.openWindows = JSON.stringify(exports.getOpenWindows());
            } catch (e) {
                log("Could save open windows");
            }
        }
    }

    function restoreOpenWindows() {
        ignoreClose = false;
        var openWindows = window.localStorage.openWindows;
        if (openWindows) {
            openWindows = JSON.parse(openWindows);
        } else {
            openWindows = [];
        }
        var first = true;
        openWindows.forEach(function(win) {
            if (first) {
                window.location = "editor.html?title=" + encodeURIComponent(win.title) + "&url=" + encodeURIComponent(win.url);
                first = false;
                return;
            }
            openEditor(win.title, win.url);
        });
    }
}

exports.init = init;

exports.configZedrem = function(newServer) {
    if (!inited) {
        init();
    }
    if (currentSocketOptions.server !== newServer) {
        exports.initEditorSocket(newServer);
    }
};

exports.getSocketOptions = function() {
    return currentSocketOptions;
};

process.on('uncaughtException', function(err) {
    process.stdout.write('Caught exception: ' + err);
});
