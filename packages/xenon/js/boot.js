'use strict';

const path = require('path');

window.isNodeWebkit = true;

const options = require('./lib/options');
const introText = require('fs')
    .readFileSync(path.join(__dirname, '..', 'manual', 'intro.md'), {encoding: 'utf-8'});

let editor, eventbus, history, openUI, session_manager, tracker, ui;

const baseModules = [
    eventbus = require('./eventbus'),
    ui = require('./ui'),
    require("./command"),
    editor = require("./editor"),
    require("./title_bar"),
    require("./symbol"),
    require("./config"),
    require("./goto"),
    require("./tree"),
    require("./state"),
    require("./project"),
    require("./keys"),
    require("./complete"),
    session_manager = require("./session_manager"),
    require("./modes"),
    require("./split"),
    require("./file"),
    require("./preview"),
    require("./dnd"),
    require("./handlers"),
    require("./action"),
    require("./theme"),
    // require("./log"),
    require("./window_commands"),
    require("./analytics"),
    require("./menu"),
    require("./db"),
    require("./webservers"),
    require("./version_control"),
    require("./sandboxes"),
    openUI = require("./open_ui"),
    // require("./background"),
    history = require("./history"),
    require("./local_store"),
    // require("./sandbox"),
    require("./webserver"),
    require("./window"),
    tracker = require("./analytics_tracker"),
    require("./configfs"),
    require('./fs'),
    require('./xenpm')
    // "./mac_cli_command.nw",
    // "./cli.nw"
];

if (options.get("url")) {
    openUrl(options.get("url"));
} else {
    projectPicker();
}

function projectPicker() {
    var modules = baseModules.slice();
    boot(modules, false);
    openUI.boot();
}

window.projectPicker = projectPicker;

function openUrl(url) {
    var modules = baseModules.slice();
    
    try {
        boot(modules, true);
    } catch (err) {
        console.error(err);
        var modules = baseModules.slice();
        boot(modules, false);
        // Remove this project from history
        history.removeProject(url);
        ui.prompt({
            message: "Project not longer accessible by Zed. Will now return to project picker."
        }).then(projectPicker);
    }
}


function boot(modules, bootEditor) {
    $("div").remove();
    $("span").remove();
    $("webview").remove();
    // $("body").append("<img src='/icons/Icon.png' id='wait-logo'>");
    // $("#wait-logo").remove();
    // Run hook on each service (if exposed)
    _.each(baseModules, function(service) {
        if (service.hook) {
            service.hook();
        }
    });
    // Run init on each service (if exposed)
    _.each(baseModules, function(service) {
        if (service.init) {
            service.init();
        }
    });

    if (bootEditor) {
        tracker.then(tracker => tracker.trackEvent("Editor", "FsTypeOpened", options.get("url").split(":")[0]));

        setupBuiltinDoc("zed::start", introText);
        setupBuiltinDoc("zed::log", "Zed Log\n===========\n");

    } else {
        eventbus.on("urlchanged", function() {
            openUrl(options.get("url"));
        });
    }

    console.log("App started");

    function setupBuiltinDoc(path, text) {
        var session = editor.createSession(path, text);
        session.readOnly = true;

        eventbus.on("modesloaded", function modesLoaded(modes) {
            if (modes.get("markdown")) {
                modes.setSessionMode(session, "markdown");
                eventbus.removeListener("modesloaded", modesLoaded);
            }
        });

        session_manager.specialDocs[path] = session;
    }
}
