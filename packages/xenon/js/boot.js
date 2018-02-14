'use strict';

const path = require('path');

if (typeof WEBPACK === 'undefined') {
    global.WEBPACK = false;
}

window.isNodeWebkit = true;

const options = require('./lib/options');

let introText;
if (WEBPACK) {
    introText = require('../manual/intro.md');
} else {
    introText = require('fs')
        .readFileSync(path.join(__dirname, '..', 'manual', 'intro.md'), {encoding: 'utf-8'});
}

let baseModules, editor, eventbus, history, openUI, session_manager, tracker, ui;

const cache = require('./cache');
const localStore = require('./local_store');

if (WEBPACK) {
    localStore.get('xedd').then(async (xedd) => {
        const configDir = await localStore.get('configDir');
        if (!xedd.url || !configDir) {
            const xedd = require('./xedd.jsx');
            xedd.open().then(() => load());
        } else {
            cache.set('url', xedd.url);
            cache.set('configDir', configDir);
            cache.set('user', xedd.user);
            cache.set('password', xedd.password);
            load();
        }
    });
} else {
    load();
}

function load() {
    baseModules = [
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
        WEBPACK ? console.log('chrome app does not have a menu') : require("./menu"),
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
        WEBPACK ? console.log('chrome app does not have xenpm') : require('./xenpm')
        // "./mac_cli_command.nw",
        // "./cli.nw"
    ];
    
    if (options.get("url")) {
        openUrl(options.get("url"));
    } else {
        projectPicker();
    }
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
        if (service && service.hook) {
            service.hook();
        }
    });
    // Run init on each service (if exposed)
    _.each(baseModules, function(service) {
        if (service && service.init) {
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
