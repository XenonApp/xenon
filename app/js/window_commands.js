'use strict';

const command = require('./command');
const win = require('./window');
const ui = require('./ui');
const background = require('./background');
    
var opts = require("./lib/options");

command.define("Window:Close", {
    doc: "Closes the current window.",
    exec: function() {
        win.close();
    },
    readOnly: true
});

command.define("Zed:Quit", {
    doc: "Closes all Zed windows.",
    exec: function() {
        background.quit();
    },
    readOnly: true
});

command.define("Window:Fullscreen", {
    doc: "Toggles between windowed and fullscreen for the current window.",
    exec: function() {
        win.fullScreen();
    },
    readOnly: true
});

command.define("Window:Maximize", {
    doc: "Toggles between windowed and maximized for the current window.",
    exec: function() {
        win.maximize();
    },
    readOnly: true
});

command.define("Window:Minimize", {
    doc: "Minimizes the current window.",
    exec: function() {
        win.minimize();
    },
    readOnly: true
});

command.define("Window:New", {
    doc: "Opens a new Zed window.",
    exec: function() {
        background.openProject("", "");
    },
    readOnly: true
});

// TODO: fix switching projects
command.define("Window:List", {
    exec: function() {
        background.getOpenWindows().then(wins => {
            ui.filterBox({
                placeholder: "Filter window list",
                text: "",
                filter: function(phrase) {
                    var lcPhrase = phrase.toLowerCase();
                    return Promise.resolve(wins.filter(function(win) {
                        if (win.url === opts.get("url")) {
                            return false;
                        }
                        return win.title.toLowerCase().indexOf(lcPhrase) !== -1;
                    }).map(function(win) {
                        return {
                            name: win.title,
                            path: win.url,
                            icon: "action"
                        };
                    }));
                },
                hint: function() {
                    return "Press <tt>Enter</tt> to switch to the selected window.";
                },
                onSelect: function(title) {
                    background.switchToProject(title);
                }
            });
        });
    },
    readOnly: true
});
