'use strict';

/*global _ $ ace */
// requirejs.config({
//     baseUrl: "js",
//     paths: {
//         "text": "../dep/text",
//         "json5": "../dep/json5",
//         "zedb": "../dep/zedb",
//         "async": "../config/api/zed/lib/async",
//         "events": "./lib/emitter"
//     },
// });

window.isNodeWebkit = true;

const options = require('./lib/options');
const fsPicker = require('./fs_picker');
const introText = require('fs').readFileSync('./manual/intro.md', {encoding: 'utf-8'});

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
    require("./log"),
    require("./window_commands"),
    require("./analytics"),
    require("./menu"),
    require("./db"),
    require("./webservers"),
    require("./version_control"),
    require("./sandboxes"),
    openUI = require("./open_ui"),
    require("./background"),
    history = require("./history"),
    require("./local_store"),
    require("./sandbox"),
    require("./webserver"),
    require("./window"),
    require("./windows"),
    tracker = require("./analytics_tracker"),
    require("./configfs")
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
    modules.push("./fs/empty");
    boot(modules, false);
    openUI.boot();
}

window.projectPicker = projectPicker;

function openUrl(url) {
    fsPicker(url).then(function(fsConfig) {
        var modules = baseModules.slice();
        modules.push(fsConfig);
        return boot(modules, true);
    }).
    catch (function(err) {
        console.log("Error", err);
        var modules = baseModules.slice();
        modules.push("./fs/empty");
        boot(modules, false);
        // Remove this project from history
        history.removeProject(url);
        ui.prompt({
            message: "Project not longer accessible by Zed. Will now return to project picker."
        }).then(projectPicker);
    });
}


function boot(modules, bootEditor) {
    $("div").remove();
    $("span").remove();
    $("webview").remove();
    // $("body").append("<img src='/Icon.png' id='wait-logo'>");
    // $("#wait-logo").remove();
    try {
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
        return true;
    } catch (e) {
        console.error("Error booting", e);
        return false;
    }

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
