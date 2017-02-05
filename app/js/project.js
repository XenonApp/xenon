'use strict';
/**
 * The project module exposes the same API as a file system module, but
 * picks an implementation based on the "url" argument passed to the editor URL
 */
 
const opts = require("./lib/options");
const command = require('./command');
const eventbus = require('./eventbus');
const openUi = require('./open_ui');

$("title").text(opts.get("title"));

command.define("Project:Open Project Picker", {
    doc: "Open the initial Zed window that allows you to switch between projects.",
    exec: function() {
        openUi.openInNewWindow = true;
        openUi.showOpenUi();
    },
    readOnly: true
});

command.define("Project:Rename", {
    doc: "Rename the current project on disk.",
    exec: function() {
        require("./ui").prompt({
            message: "Rename project to:",
            input: opts.get('title')
        }).then(function(name) {
            if (!name) {
                // canceled
                return;
            }
            opts.set("title", name);
            require("./history").renameProject(opts.get("url"), name);
            eventbus.emit("projecttitlechanged");
        });
    },
    readOnly: true
});
