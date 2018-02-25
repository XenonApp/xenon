'use strict';

const eventbus = require('./eventbus');
const history = require('./history');
const fs = require('./fs');
const editor = require('./editor');
const config = require('./config');
const background = require('./background');
const xedd = require('./xedd');

let menu;
if (!WEBPACK) {
    menu = require('./menu');
}

const icons = require("./lib/icons");
const filterList = require("./lib/filter_list");

var version = require("../../package.json").version;

eventbus.declare("urlchanged");

const builtinProjects = [{
    name: "Local Folder",
    url: "node:",
    key: "L"
}, {
    name: "Xedd Folder",
    url: "xedd:",
    key: "Z"
}, {
    section: "Zed"
}, {
    name: "Configuration",
    html: "Configuration <img class='tool' data-info='set-config-dir' src='./img/edit.png'>",
    url: "nwconfig:",
    key: "C"
}, {
    name: "Manual",
    url: "manual:"
}];

var viewEl, headerEl, phraseEl, listEl;

var closed = false;

var api = {
    openInNewWindow: false,
    boot: function () {
        config.loadConfiguration().then(function () {
            if (closed) {
                return;
            }
            api.showOpenUi();
            var enable = config.getPreference("enableAnalytics");
            var showMenus = config.getPreference("showMenus");
            if (enable === undefined || showMenus === undefined) {
                api.firstRun();
            }
        }).catch(function (err) {
            console.error("Error booting", err);
        });
    },
    showOpenUi: function () {
        if (!WEBPACK) {
            menu.disabled = true;
        }
        viewEl = $("<div class='modal-view'><img src='./img/zed-small.png' class='logo'><h1><span class='title'></span><span class='version'>v" + version + "</span></h1><input type='text' id='phrase' placeholder='Filter list'><div id='item-list'></div></div>");
        $("body").append(viewEl);
        headerEl = viewEl.find("h1 > span.title");
        phraseEl = viewEl.find("#phrase");
        listEl = viewEl.find("#item-list");
        api.fadeOutBackground();
        eventbus.once("editorloaded", function () {
            api.fadeOutBackground();
        });
        api.projectList();
    },
    close: function () {
        if (!WEBPACK) {
            menu.disabled = false;
        }
        closed = true;
        api.fadeInBackground();
        viewEl && viewEl.remove();
    },
    fadeOutBackground: function () {
        $(".ace_editor").css("opacity", 0.3);
        $(".pathbar").css("opacity", 0.3);
    },
    fadeInBackground: function () {
        $(".ace_editor").css("opacity", "");
        $(".pathbar").css("opacity", "");
    },
    projectList: function () {
        headerEl.text("Zed");
        history.getProjects().then(function (projects) {
            if (projects.length > 0) {
                projects.splice(0, 0, {
                    section: "Recently Opened"
                });
            }
            projects.push({
                section: "Open"
            });
            projects = projects.concat(builtinProjects);

            var items = projects.map(function (project) {
                if (project.section) {
                    return project;
                }
                return {
                    name: project.name,
                    url: project.url,
                    html: "<img src='" + icons.protocolIcon(project.url) + "'/>" + (project.html ? project.html : project.name),
                    key: project.key
                };
            });

            phraseEl.val("");
            phraseEl.focus();
            filterList({
                inputEl: phraseEl,
                resultsEl: listEl,
                list: items,
                onSelect: function (b) {
                    if (b === "set-config-dir") {
                        api.close();
                        require("./configfs").storeLocalFolder().then(function () {
                            api.showOpenUi();
                        });
                        return;
                    }
                    if (b.notInList) {
                        api.open(b.name, b.name);
                        return api.close();
                    }
                    switch (b.url) {
                        case "node:":
                            background.then(bg => bg.selectDirectory()).then(dir => {
                                api.open(dir, `node:${dir}`);
                                api.close();
                            }).catch(() => {
                                api.projectList();
                            });
                            return; // Don't close the UI
                        case "xedd:":
                            api.xedd().then(function (url) {
                                console.log(url);
                                api.showOpenUi();
                                // if (url) {
                                // api.open(niceName(url), url);
                                // } else {
                                // api.showOpenUi();
                                // }
                            });
                            break;
                        case "manual:":
                            background.then(bg => bg.openProject("Manual", "manual:"));
                            // Using return instead of break to avoid closing
                            return api.projectList();
                        default:
                            api.open(b.name, b.url);
                    }
                    api.close();
                },
                onCancel: function () {
                    if (!fs.isEmpty) {
                        viewEl.remove();
                        api.fadeInBackground();
                        editor.getActiveEditor().focus();
                    } else {
                        // Otherwise: cancel not allowed!
                        api.projectList();
                    }
                },
                onDelete: function (b) {
                    items.splice(items.indexOf(b), 1);
                    history.removeProject(b.url);
                }
            });
        }).catch(function (err) {
            console.error("Error", err);
        });
    },
    open: function (title, url) {
        if (api.openInNewWindow) {
            background.then(bg => bg.openProject(title, url));
        } else {
            background.then(bg => bg.loadProject(title, url));
        }
    },
    firstRun: function () {
        return new Promise(function (resolve, reject) {
            var el = $("<div class='modal-view'></div>");
            $("body").append(el);
            $.get("./firstrun.html", function (html) {
                el.html(html);
                $("#enable").change(function () {
                    config.setPreference("enableAnalytics", $("#enable").is(":checked"));
                });

                $("#menubar").change(function () {
                    config.setPreference("showMenus", $("#menubar").is(":checked"));
                });

                $("#done").click(function () {
                    el.remove();
                    resolve();
                });

                $("td").click(function (event) {
                    var target = $(event.target).parents("td");
                    $("td").removeClass("selected");
                    $(target).addClass("selected");
                    var mode = target.data("mode");
                    console.log("Mode selected", mode);
                    switch (mode) {
                        case "traditional":
                            config.setPreference("showMenus", true);
                            config.setPreference("persistentTree", true);
                            break;
                        case "chromeless":
                            config.setPreference("showMenus", $("#menubar").is(":checked"));
                            config.setPreference("persistentTree", false);
                            break;
                        default:
                            console.log("Unknown mode", mode);
                    }
                });

                setTimeout(function () {
                    config.setPreference("enableAnalytics", true);
                    config.setPreference("showMenus", false);
                    config.setPreference("persistentTree", false);
                }, 1000);
            });
        });
    },
    xedd: function () {
        return xedd.open();
    }
};

module.exports = api;
//# sourceMappingURL=open_ui.js.map