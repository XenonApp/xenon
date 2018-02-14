"use strict";

// TODO: fix the config dir
let app;
if (!WEBPACK) {
    app = require('electron').remote.app;
}
const JSON5 = require('json5');
const nodePath = require('path');

const eventbus = require('./eventbus');
const command = require('./command');

const sandboxes = require('./sandboxes');
const configfs = require('./configfs');
const background = require('./background');

var path = require("./lib/path");

eventbus.declare("configchanged");
eventbus.declare("configneedsreloading");

require("./lib/vim_patch");

var minimumConfiguration = {
    imports: [
        "/default.json"],
    databases: {},
    preferences: {},
    modes: {},
    keys: {},
    commands: {},
    handlers: {},
    window_themes: {},
    editor_themes: {},
    packages: []
};

var config = _.extend({}, minimumConfiguration);
var userConfig = _.extend({}, minimumConfiguration); // Cache of user.json file

var expandedConfiguration = _.extend({}, config);

var api = {
    hook: function() {
        eventbus.on("loadedfilelist", loadConfiguration);
        eventbus.on("configneedsreloading", loadConfiguration);

        eventbus.on("sessionsaved", function(session) {
            if (session.filename === "/zedconfig.json") {
                loadConfiguration();
            }
        });
    },
    writeUserPrefs: writeUserPrefs,
    loadConfiguration: loadConfiguration,
    addPackage(name) {
        return configfs.readFile("/user.json").then(function(userConfig) {
            var json = JSON5.parse(userConfig);
            if (!json.packages) {
                json.packages = [];
            }
            if (json.packages.indexOf(name) === -1) {
                json.packages.push(name);
            }
            return configfs.writeFile("/user.json", JSON5.stringify(json, null, 4));
        });
    },
    removePackage(name) {
        return configfs.readFile("/user.json").then(function(userConfig) {
            var json = JSON5.parse(userConfig);
            if (!json.packages) {
                return;
            }

            const index = json.packages.indexOf(name);
            if (index === -1) {
                return;
            }

            json.packages.splice(index, 1);
            return configfs.writeFile("/user.json", JSON5.stringify(json, null, 4));
        });
    },
    getDir() {
        return localStorage.configDir || nodePath.join(app.getPath('userData'), 'config');
    },
    getPreference: function(key, session) {
        if (session && session.mode) {
            var mode = session.mode;
            if (mode.preferences[key] !== undefined) {
                return mode.preferences[key];
            }
        }
        return expandedConfiguration.preferences[key];
    },
    setPreference: function(key, value) {
        config.preferences[key] = value;
        if (!userConfig.preferences) {
            // If this happens the user.json file contains syntax
            // mistakes. However it's important to _still_ save this
            // preference. What we'll do is effectively overwrite the
            // existing user.json with only preferences, but make
            // a backup of user.json
            userConfig.preferences = {};
            makeUserBackup().then(function() {
                userConfig.preferences[key] = value;
                writeUserPrefs();
            });
        } else {
            userConfig.preferences[key] = value;
            writeUserPrefs();
        }
    },
    togglePreference: function(key, session) {
        var newvalue = !api.getPreference(key, session);
        api.setPreference(key, newvalue);
        return newvalue;
    },
    incrementInteger: function(key, amount, session) {
        var newvalue = api.getPreference(key, session) + amount;
        api.setPreference(key, newvalue);
        return newvalue;
    },
    getDatabases: function() {
        return expandedConfiguration.databases;
    },
    getModes: function() {
        return expandedConfiguration.modes;
    },
    getKeys: function() {
        return expandedConfiguration.keys;
    },
    getCommands: function() {
        return expandedConfiguration.commands;
    },
    getPackages: function() {
        return expandedConfiguration.packages;
    },
    getPreferences: function() {
        return expandedConfiguration.preferences;
    },
    getHandlers: function() {
        return expandedConfiguration.handlers;
    },
    getEditorTheme: function(name) {
        return expandedConfiguration.editor_themes[name];
    },
    getEditorThemes: function() {
        return expandedConfiguration.editor_themes;
    },
    getWindowTheme: function(name) {
        return expandedConfiguration.window_themes[name];
    },
    getWindowThemes: function() {
        return expandedConfiguration.window_themes;
    },
    getConfiguration: function() {
        return expandedConfiguration;
    }
};

/**
 * This is a super-charged version of _.extend, it recursively merges
 * objects and concatenates arrays (but does not add duplicates).
 * If an array contains a string element starting with "!" that element (without !)
 * will be removed from the merged array if present.
 *
 * This function does not modify either dest or source, it creates a new
 * object
 */
function superExtend(dest, source) {
    if (_.isArray(dest)) {
        if (!source) {
            return dest;
        }
        var removals = {};
        var newArray = [];
        var el, i;
        for (i = 0; i < dest.length; i++) {
            el = dest[i];
            if (_.isString(el) && el[0] === "!") {
                removals[el.substring(1)] = true;
            } else {
                newArray.push(el);
            }
        }
        for (i = 0; i < source.length; i++) {
            el = source[i];
            if (_.isString(el) && el[0] === "!") {
                var idx = newArray.indexOf(el.substring(1));
                if (idx !== -1) {
                    // Remove from newArray
                    newArray.splice(idx, 1);
                }
            } else if (newArray.indexOf(el) === -1 && !removals[el]) {
                newArray.push(el);
            }
        }
        return newArray;
    } else if (_.isObject(dest)) {
        dest = _.extend({}, dest); // shallow clone
        if (source) {
            for (var p in source) {
                if (source.hasOwnProperty(p)) {
                    if (dest[p] === undefined) {
                        dest[p] = source[p];
                    } else {
                        dest[p] = superExtend(dest[p], source[p]);
                    }
                }
            }
        }
        return dest;
    } else {
        return dest !== undefined ? dest : source;
    }
}

// ======= WATCHERS =============
// Setting file watchers (reload config when any of them change)
var watchers = [];

function clearWatchers() {
    watchers.forEach(function(watcher) {
        watcher.fs.unwatchFile(watcher.path, watcher.callback);
    });
    watchers = [];
}

function watchFile(fs, path, callback) {
    fs.watchFile(path, callback);
    watchers.push({
        fs: fs,
        path: path,
        callback: callback
    });
}

/**
 * Recursively import "imports" into the `expandedConfiguration` variable
 */
function expandConfiguration(setts, importedPackages) {
    setts = _.extend({}, setts);
    var imports = setts.imports;
    delete setts.imports;
    expandedConfiguration = superExtend(expandedConfiguration, setts);

    if (setts.packages && setts.packages.length > 0) {
        setts.packages.forEach(function(name) {
            if (!importedPackages[name]) {
                imports.push(`/node_modules/${name}/`);
                importedPackages[name] = true;
            }
        });
    }

    if (imports) {
        return Promise.all(imports.map(function(imp) {
            const promises = [];
            if (imp[imp.length - 1] === '/') {
                promises.push(configfs.readFile(`${imp}config.json`));
                promises.push(configfs.readFile(`${imp}package.json`));
            } else {
                promises.push(configfs.readFile(imp));
            }
            return Promise.all(promises).then(function([text, pkgText]) {
                var json;
                try {
                    json = JSON5.parse(text);

                    if (pkgText) {
                        const pkg = JSON.parse(pkgText);
                        if (json.commands) {
                            addUrlToCommands(json.commands, pkg.name, pkg.main);
                        }
                        if (json.modes) {
                            Object.keys(json.modes).forEach(key => {
                                const mode = json.modes[key];
                                if (mode.commands) {
                                    addUrlToCommands(mode.commands, pkg.name, pkg.main);
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.error("In file", imp, e);
                    return;
                }
                resolveRelativePaths(json, imp);
                return expandConfiguration(json, importedPackages);
            }, function(err) {
                console.warn("Error loading", imp, err);
            });
        }));
    } else {
        return Promise.resolve();
    }
}

function addUrlToCommands(commands, name, main) {
    Object.keys(commands).forEach(cmd => {
        commands[cmd].scriptUrl = `/node_modules/${name}/${main}`;
    });
}

function makeUserBackup() {
    return configfs.readFile("/user.json").then(function(text) {
        return configfs.writeFile("/user.backup.json", text);
    }, function(err) {
        // Probably the file didn't exist, that's ok -- move on
        return;
    });
}

function writeUserPrefs() {
    return configfs.writeFile("/user.json", JSON5.stringify(userConfig, null, 4) + "\n").
    catch (function(err) {
        console.error("Error during writing config:", err);
    });
}

/**
 * Loads config, deciding which config file to use as root:
 * - if a /zedconfig.json file exists in the project, use it
 * - otherwise use the /user.json file in the config project
 */
function loadConfiguration() {
    let goto = require('./goto');
    if (goto && goto.getFileCache().indexOf("/zedconfig.json") !== -1) {
        return require("./fs").readFile("/zedconfig.json").then(function(text) {
            var base = {};
            try {
                base = JSON5.parse(text);
            } catch (e) {
                console.error("Error parsing zedconfig.json", e);
            }
            return loadUserConfiguration(base);
        });
    } else {
        return loadUserConfiguration({});
    }
}


/**
 * Extend the project config (or the empty object, if not present)
 * with config from /user.json from the config project
 */
function loadUserConfiguration(base) {
    var rootFile = "/user.json";
    config = superExtend(base, minimumConfiguration);
    expandedConfiguration = _.extend({}, config);
    clearWatchers();
    watchFile(configfs, rootFile, loadConfiguration);
    return configfs.readFile(rootFile).then(function(config_) {
        var json = {};
        try {
            json = JSON5.parse(config_);
            resolveRelativePaths(json, rootFile);
        } catch (e) {
            console.error("Error parsing /user.json", e);
        }
        userConfig = json;
        config = superExtend(config, json);
        return expandConfiguration(config, {});
    }).then(function() {
        eventbus.emit("configchanged", api);
        return api;
    });
}

/**
 * This function finds all relative script and import paths
 * (scriptUrl keys and for imports) and replaces them with
 * absolute ones
 */
function resolveRelativePaths(configJson, jsonPath) {
    var dir = path.dirname(jsonPath);
    if (configJson.imports) {
        configJson.imports = _.map(configJson.imports, function(imp) {
            if (imp[0] === '.' && imp[1] === '/') {
                return dir + imp.substring(1);
            } else {
                return imp;
            }
        });
    }
    if (configJson.commands) {
        _.each(configJson.commands, function(cmd, name) {
            if (cmd.scriptUrl && cmd.scriptUrl[0] === '.' && cmd.scriptUrl[1] === '/') {
                configJson.commands[name].scriptUrl = dir + cmd.scriptUrl.substring(1);
            }
        });
    }
    if (configJson.modes) {
        _.each(configJson.modes, function(mode) {
            resolveRelativePaths(mode, jsonPath);
        });
    }
    if (configJson.editor_themes) {
        resolveThemes(configJson.editor_themes);
    }
    if (configJson.window_themes) {
        resolveThemes(configJson.window_themes);
    }
    function resolveThemes(themes) {
        _.each(themes, function(theme) {
            if (!_.isArray(theme.css)) {
                theme.css = [theme.css];
            }
            theme.css = _.map(theme.css, function(file) {
                if (file[0] === '.' && file[1] === '/') {
                    return dir + file.substring(1);
                } else {
                    return file;
                }
            });
        });
    }
    return configJson;
}

command.define("Configuration:Reload", {
    doc: "Reload Zed's configuration from disk.",
    exec: function() {
        loadConfiguration();
    },
    readOnly: true
});

command.define("Configuration:Reset", {
    doc: "Discard all Zed configuration and revert to factory settings.",
    exec: function() {
        require("./ui").prompt({
            message: "Are you sure you reset all config?"
        }).then(function(yes) {
            if (yes) {
                configfs.listFiles().then(function(files) {
                    return Promise.all(files.map(function(path) {
                        return configfs.deleteFile(path);
                    })).then(function() {
                        console.log("All files removed!");
                        return loadConfiguration();
                    });
                });
            }
        });
    },
    readOnly: true
});

command.define("Configuration:Show Full", {
    doc: "Dump all configuration data into a temporary buffer called " + "`zed::config` for ready-only inspection.",
    exec: function(edit, session) {
        return require("./session_manager").go("zed::config", edit, session).then(function(session) {
            session.setMode("ace/mode/json");
            session.setValue(JSON5.stringify(expandedConfiguration, null, 4));
        });
    },
    readOnly: true
});

command.define("Configuration:Open Configuration Project", {
    doc: "Open a Zed window with the Configuration project",
    exec: function() {
        background.then(bg => bg.openProject("Configuration", window.isNodeWebkit ? "nwconfig:" : "config:"));
    },
    readOnly: true
});

sandboxes.defineInputable("preferences", function() {
    return expandedConfiguration.preferences;
});

module.exports = api;
