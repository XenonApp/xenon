"use strict";
/**
 * The state module keeps track of the editor state, saved to the /.zedstate file
 * state that is typically being tracked includes open files, which file is open in
 * which split, the split config itself, cursor positions, selections, part of the
 * undo stack etc.
 */

// TODO: handle messages from chrome app
let ipcRenderer;
if (!CHROME) {
    ipcRenderer = require('electron').ipcRenderer;
}
const eventbus = require('./eventbus');
const fs = require('./fs');
const config = require('./config');
const win = require('./window');

var opts = require("./lib/options");

var state = {};

eventbus.declare("stateloaded");

function isHygienic() {
    return config.getPreference("hygienicMode") || (config.getPreference("hygienicModeRemote") && opts.get("url").indexOf("http") === 0);
}

var api = {
    hook: function() {
        eventbus.once("stateloaded", function() {
            var bounds = api.get('window');
            if (bounds) {
                bounds.width = Math.min(Math.max(300, bounds.width), window.screen.availWidth);
                bounds.height = Math.min(Math.max(300, bounds.height), window.screen.availHeight);
                if (!CHROME) {
                    bounds.x = Math.max(window.screen.availLeft, Math.min(bounds.x, window.screen.availWidth - bounds.width));
                    bounds.y = Math.max(window.screen.availTop, Math.min(bounds.y, window.screen.availHeight - bounds.height));
                } else {
                    bounds.left = Math.max(window.screen.availLeft, Math.min(bounds.left, window.screen.availWidth - bounds.width));
                    bounds.top = Math.max(window.screen.availTop, Math.min(bounds.top, window.screen.availHeight - bounds.height));
                }
                win.setBounds(bounds);
            }

            if (CHROME) {
                win.addResizeListener(function() {
                    var bounds = win.getBounds();
                    // on windows minimized window reports left=-32000
                    if (bounds.left != -32000) {
                        api.set("window", bounds);
                    }
                });
            } else {
                ipcRenderer.on('save-bounds', (event, bounds) => {
                    api.set('window', bounds);
                });
            }
        });
    },
    init: function() {
        // Delaying loading a bit for other plug-ins to run their inits
        setTimeout(function() {
            api.load();
        });
    },
    set: function(key, value) {
        state[key] = value;
    },
    get: function(key) {
        return state[key];
    },
    load: function() {
        if (isHygienic()) {
            state = {};
            eventbus.emit("stateloaded", api);
            return Promise.resolve({});
        }
        return fs.readFile("/.zedstate").then(function(json) {
            state = JSON.parse(json);
            eventbus.emit("stateloaded", api);
            return state;
        }).catch(function(err) {
            state = {};
            eventbus.emit("stateloaded", api);
            return state;
        });
    },
    save: function() {
        if (!isHygienic()) {
            return fs.writeFile("/.zedstate", api.toJSON());
        } else {
            return Promise.resolve();
        }
    },
    toJSON: function() {
        return JSON.stringify(state);
    },
    reset: function() {
        state = {};
        return api.save();
    }
};

module.exports = api;
