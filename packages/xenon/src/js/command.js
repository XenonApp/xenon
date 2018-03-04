"use strict";

const eventbus = require('./eventbus');
const fs = require('./fs');
const keys = require('./keys');

var useragent = global.ace.require("ace/lib/useragent");
var fuzzyfind = require("./lib/fuzzyfind");

var commands = {};

// Commands coming from configuration somehow (user commands, theme commands)
var configCommands = {};

// Triggered by mode.js when mode commands were loaded
eventbus.declare("commandsloaded");
// Triggered when config commands were reset and should be reloaded from config
eventbus.declare("configcommandsreset");
eventbus.declare("executedcommand");

function defineUserCommand(name, cmd) {
    if (!api.isAvailable(cmd)) {
        return;
    }

    api.defineConfig(name, {
        doc: cmd.doc,
        exec: function(edit, session) {
            return require("./sandboxes").execCommand(name, cmd, session).
                catch (function(err) {
                    console.error("Command", name, "failed:", err);
                });
        },
        readOnly: cmd.readOnly,
        internal: cmd.internal,
        requiredCapabilities: cmd.requiredCapabilities
    });
}


const api = {};

api.hook = function() {
    eventbus.on("configchanged", function(config) {
        configCommands = {};
        _.each(config.getCommands(), function(cmd, name) {
            defineUserCommand(name, cmd);
        });
        eventbus.emit("configcommandsreset", config);
    });
};

/**
 * @param path in the form of 'Editor:Select All'
 * @param definition json object:
 *  {
 *      exec: function() { ... },
 *      readOnly: true
 *  }
 */
api.define = function(path, def) {
    def.name = path;
    commands[path] = def;
};

api.defineConfig = function(path, def) {
    def.name = path;
    configCommands[path] = def;
};

api.lookup = function(path) {
    return configCommands[path] || commands[path];
};

api.isAvailable = function(cmd, session) {
    // Seems like this should only happen when trying to
    // configure an extension that is not installed
    if (!cmd.scriptUrl) {
        return false;
    }
    
    const defaultCommand = cmd.scriptUrl.indexOf('/default/') === 0;
    if (CHROME) {
        if (!defaultCommand) {
            return false;
        }
    } else {
        if (!defaultCommand && !fs.isNode) {
            if (session) {
                console.log(`Skipped ${session.mode.language} ${name}`);
            } else {
                console.log(`Skipped ${name}`);
            }
            return false;
        }
    }

    let requiredCapabilities = cmd.requiredCapabilities;

    let modeName = '';
    if (session) {
        modeName = session.mode ? session.mode.language : '';
    }

    if (cmd.modeCommand && cmd.modeCommand[modeName]) {
        requiredCapabilities = cmd.modeCommand[modeName].requiredCapabilities;
    }

    if (requiredCapabilities) {
        const capabilities = fs.getCapabilities();
        let hasRequiredCapabilities = true;
        Object.keys(requiredCapabilities).forEach(key => {
            if (!capabilities[key]) {
                hasRequiredCapabilities = false;
            }
        });
        if(!hasRequiredCapabilities) {
            return false;
        }
    }

    return true;
};

api.isVisible = function(cmd, session) {
    const modeName = session.mode ? session.mode.language : '';
    if (cmd.modeCommand) {
        if (!session.mode) {
            return true;
        }
        return cmd.modeCommand[modeName] && !cmd.modeCommand[modeName].internal;
    }
    if (cmd.internal) {
        return false;
    }
    return true;
};

api.exec = function(path, edit, session) {
    var def = api.lookup(path);
    if (!session.getTokenAt) { // Check if this is a session object
        console.error("Did not pass in session to exec", arguments);
    }
    return Promise.resolve(def.exec.apply(null, _.toArray(arguments).slice(1)));
};

api.identifyCurrentKey = function(path) {
    var commandKeys = keys.getCommandKeys();
    var key = commandKeys[path];
    if (key) {
        if (_.isString(key)) {
            return key;
        } else {
            return useragent.isMac ? key.mac : key.win;
        }
    }
};

api.allCommands = function() {
    return Object.keys(configCommands).concat(Object.keys(commands));
};

api.define("Command:Enter Command", {
    doc: "Prompts for a command to invoke, with a convenient searchable interface.",
    exec: function(edit, session, prefix) {
        if (typeof prefix !== "string") {
            prefix = undefined;
        }
        // Lazy loading these
        var recentCommands = require("./state").get("recent.commands") || {};

        function filter(phrase) {
            var results = fuzzyfind(api.allCommands(), phrase);
            results = results.filter(function(result) {
                result.meta = api.identifyCurrentKey(result.path);
                result.icon = "action";
                // Let's rename the `cmd` variable using multiple cursors...
                // There are three instances
                var command = api.lookup(result.path);
                // Filter out commands that are language-specific and don't apply to this mode
                return api.isVisible(command, session);
            });
            results.sort(function(a, b) {
                if (a.score === b.score) {
                    var lastUseA = recentCommands[a.name] || 0;
                    var lastUseB = recentCommands[b.name] || 0;
                    if (lastUseA === lastUseB) {
                        return a.name < b.name ? -1 : 1;
                    } else {
                        return lastUseB - lastUseA;
                    }
                } else {
                    return b.score - a.score;
                }
            });
            return Promise.resolve(results);
        }
        require("./ui").filterBox({
            placeholder: "Enter command",
            filter: filter,
            hint: function() {
                return "Press <tt>Enter</tt> to run the selected command.";
            },
            text: prefix || "",
            onSelect: function(cmd) {
                recentCommands[cmd] = Date.now();
                require("./state").set("recent.commands", recentCommands);
                api.exec(cmd, edit, edit.getSession());
                eventbus.emit("executedcommand", cmd);
            }
        });
    },
    readOnly: true
});

api.define("Help:Commands", {
    exec: function(edit, session) {
        return require("./session_manager").go("zed::commands", edit, session).then(function(session) {
            var command_list = "> Zed Online Command Reference.\n" +
                "\n   What follows is a complete reference of all commands " +
                "known to Zed, and their current keybindings, even if " +
                "you've modified the defaults. Click a command to activate it.\n\n" +
                "   `Fold:Fold All`\n   `Fold:Unfold All`\n\n\n";
            var prev_tree = [];
            api.allCommands().sort().forEach(function(command_name) {
                // Ignore internal and wrong-mode commands.
                var command = api.lookup(command_name) || {};
                try {
                    if (command.modeCommand[session.mode.language].internal) {
                        return;
                    }
                } catch (e) {}
                if (command.internal) {
                    return;
                }

                // Add headers for different sections.
                var command_tree = command_name.split(":");
                var len = command_tree.length - 1;
                for (var i = 0; i < len; ++i) {
                    if (prev_tree[i] !== command_tree[i]) {
                        command_list += "\n" + new Array(i + 2).join("#") +
                            " " + command_tree[i] + "\n\n";
                    }
                }
                prev_tree = command_tree;

                // Get the command documentation.
                var doc = command.doc ? "\n   " + command.doc.replace(/\n/g, "\n\n   ") + "\n" : "";

                // Get the current keybinding.
                var binding = api.identifyCurrentKey(command_name) || "";
                binding = binding ? "`" + binding + "`" : "Not set";

                // Add the full command details to the document.
                command_list +=
                    "\n>    " + command_tree.slice(-1) + "\n" +
                    "\n   `" + command_name + "`" +
                    "\n   Current Key Binding:    " + binding +
                    "\n" + doc + "\n";
            });
            session.setValue(command_list);
        });
    },
    readOnly: true
});

api.define("Configuration:Reset Editor State", {
    doc: "Reset the editor to it's initial state.",
    exec: function() {
        require("./state").reset();
    },
    readOnly: true
});

module.exports = api;
