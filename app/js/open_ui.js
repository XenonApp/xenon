'use strict';

const eventbus = require('./eventbus');
const history = require('./history');
const localStore = require('./local_store');
const fs = require('./fs');
const editor = require('./editor');
const config = require('./config');
const background = require('./background');
const menu = require('./menu');
const win = require('./window');

const icons = require("./lib/icons");
const filterList = require("./lib/filter_list");
// const dropbox = require("./lib/dropbox");
const githubUi = require("./open/github");
const niceName = require("./lib/url_extractor").niceName;
const zedb = require("../dep/zedb");

var version = require("../../package.json").version;

eventbus.declare("urlchanged");

const builtinProjects = [{
    name: "Local Folder",
    url: "node:",
    key: "L"
}, {
    name: "Zedd Folder",
    url: "zedd:",
    key: "Z"
}, {
    name: "Github Repository",
    url: "gh:"
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
    boot: function() {
        config.loadConfiguration().then(function() {
            if (closed) {
                return;
            }
            api.showOpenUi();
            var enable = config.getPreference("enableAnalytics");
            var showMenus = config.getPreference("showMenus");
            if (enable === undefined || showMenus === undefined) {
                api.firstRun();
            }
        }).
        catch (function(err) {
            console.error("Error booting", err);
        });
    },
    showOpenUi: function() {
        menu.disabled = true;
        viewEl = $("<div class='modal-view'><img src='./img/zed-small.png' class='logo'><h1><span class='title'></span><span class='version'>v" + version + "</span></h1><input type='text' id='phrase' placeholder='Filter list'><div id='item-list'></div></div>");
        $("body").append(viewEl);
        headerEl = viewEl.find("h1 > span.title");
        phraseEl = viewEl.find("#phrase");
        listEl = viewEl.find("#item-list");
        api.fadeOutBackground();
        eventbus.once("editorloaded", function() {
            api.fadeOutBackground();
        });
        api.projectList();
        zedb.garbageCollect();
    },
    close: function() {
        menu.disabled = false;
        closed = true;
        api.fadeInBackground();
        viewEl && viewEl.remove();
    },
    fadeOutBackground: function() {
        $(".ace_editor").css("opacity", 0.3);
        $(".pathbar").css("opacity", 0.3);
    },
    fadeInBackground: function() {
        $(".ace_editor").css("opacity", "");
        $(".pathbar").css("opacity", "");
    },
    projectList: function() {
        headerEl.text("Zed");
        history.getProjects().then(function(projects) {
            if (projects.length > 0) {
                projects.splice(0, 0, {
                    section: "Recently Opened"
                });
            }
            projects.push({
                section: "Open"
            });
            projects = projects.concat(builtinProjects);

            var items = projects.map(function(project) {
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
                onSelect: function(b) {
                    if (b === "set-config-dir") {
                        api.close();
                        require("./configfs").storeLocalFolder().then(function() {
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
                            background.selectDirectory().then(dir => {
                                api.open(dir, `node:${dir}`);
                                api.close();
                            }).catch(() => {
                                api.projectList();
                            });
                            return; // Don't close the UI
                        case "gh:":
                            api.github().then(function(repo) {
                                if (repo) {
                                    api.open(repo.repo + " [" + repo.branch + "]", "gh:" + repo.repo + ":" + repo.branch);
                                    api.close();
                                } else {
                                    api.showOpenUi();
                                }
                            });
                            return; // Don't close the UI
                        case "zedd:":
                            api.zedd().then(function(url) {
                                if (url) {
                                    api.open(niceName(url), url);
                                } else {
                                    api.showOpenUi();
                                }
                            });
                            break;
                        case "manual:":
                            background.openProject("Manual", "manual:");
                            // Using return instead of break to avoid closing
                            return api.projectList();
                        default:
                            api.open(b.name, b.url);
                    }
                    api.close();
                },
                onCancel: function() {
                    if (!fs.isEmpty) {
                        viewEl.remove();
                        api.fadeInBackground();
                        editor.getActiveEditor().focus();
                    } else {
                        // Otherwise: cancel not allowed!
                        api.projectList();
                    }
                },
                onDelete: function(b) {
                    items.splice(items.indexOf(b), 1);
                    history.removeProject(b.url);
                }
            });
        }).
        catch (function(err) {
            console.error("Error", err);
        });
    },
    open: function(title, url) {
        if (api.openInNewWindow) {
            background.openProject(title, url);
        } else {
            background.loadProject(title, url);
        }
    },
    firstRun: function() {
        return new Promise(function(resolve, reject) {
            var el = $("<div class='modal-view'></div>");
            $("body").append(el);
            $.get("./firstrun.html", function(html) {
                el.html(html);
                $("#enable").change(function() {
                    config.setPreference("enableAnalytics", $("#enable").is(":checked"));
                });

                $("#menubar").change(function() {
                    config.setPreference("showMenus", $("#menubar").is(":checked"));
                });

                $("#done").click(function() {
                    el.remove();
                    resolve();
                });

                $("td").click(function(event) {
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

                setTimeout(function() {
                    config.setPreference("enableAnalytics", true);
                    config.setPreference("showMenus", false);
                    config.setPreference("persistentTree", false);
                }, 1000);
            });
        });
    },
    githubAuth: function(githubToken) {
        return new Promise(function(resolve, reject) {
            var el = $("<div class='modal-view'></div>");
            $("body").append(el);
            $.get("/open/github_token.html", function(html) {
                el.html(html);
                $("#token-form").submit(function(event) {
                    event.preventDefault();
                    verifyToken($("#token").val());
                });
                $("#cancel").click(function() {
                    close();
                });

                $("#token").val(githubToken);

                function close() {
                    el.remove();
                    resolve();
                }

                function verifyToken(token) {
                    $.ajax({
                        type: "GET",
                        url: "https://api.github.com/user?access_token=" + token,
                        dataType: "json",
                        processData: false,
                        success: function() {
                            localStore.set("githubToken", token);
                            resolve(token);
                            close();
                        },
                        error: function() {
                            $("#hint").text("Invalid token");
                        }
                    });
                }
            });

        });
    },
    github: function() {
        return localStore.get("githubToken").then(function(githubToken) {
            if (!githubToken) {
                return api.githubAuth().then(function(githubToken) {
                    if (githubToken) {
                        return pick(githubToken);
                    } else {
                        console.log("Shoing project list again");
                        api.projectList();
                        return;
                    }
                });
            } else {
                return pick(githubToken);
            }
        });

        function pick(githubToken) {
            return githubUi(githubToken)(headerEl, phraseEl, listEl);
        }
    },
    // dropbox: function() {
    //     return new Promise(function(resolve) {
    //         var el = $("<div class='modal-view'><img src='/img/zed-small.png' class='logo'><h1>Pick a Dropbox Folder</h1><div id='dropbox-tree'>Authenticating... <img src='../img/loader.gif'/></div><button id='logout'>Logout</button></div>");
    //         $("body").append(el);

    //         dropbox.authenticate(function(err, dropbox) {
    //             if (err) {
    //                 close();
    //                 return api.projectList();
    //             }

    //             var treeEl = $("#dropbox-tree");
    //             treeEl.focus();
    //             $("#logout").click(function() {
    //                 dropbox.signOut(close);
    //             });

    //             function open(path) {
    //                 resolve("dropbox:" + path);
    //             }

    //             function readDir(path, callback) {
    //                 dropbox.readdir(path, function(err, resultStrings, dirState, entries) {
    //                     if (err) {
    //                         return callback(err);
    //                     }
    //                     var dirs = [];
    //                     entries.forEach(function(entry) {
    //                         if (entry.isFolder) {
    //                             dirs.push({
    //                                 title: entry.name,
    //                                 key: entry.path,
    //                                 isFolder: true,
    //                                 isLazy: true
    //                             });
    //                         }
    //                     });
    //                     callback(null, dirs);
    //                 });
    //             }

    //             function renderInitialTree(err, children) {
    //                 treeEl.dynatree({
    //                     onActivate: function(node) {
    //                         open(node.data.key);
    //                         close();
    //                     },
    //                     onLazyRead: function(node) {
    //                         readDir(node.data.key, function(err, dirs) {
    //                             if (err) {
    //                                 return console.error(err);
    //                             }
    //                             dirs.forEach(function(dir) {
    //                                 node.addChild(dir);
    //                             });
    //                             node.setLazyNodeStatus(DTNodeStatus_Ok);
    //                         });
    //                     },
    //                     onKeydown: function(node, event) {
    //                         if (event.keyCode === 27) {
    //                             close();
    //                         }
    //                     },
    //                     keyboard: true,
    //                     autoFocus: true,
    //                     debugLevel: 0,
    //                     children: children
    //                 });
    //             }

    //             readDir("/", renderInitialTree);
    //         });

    //         function close() {
    //             el.remove();
    //         }
    //     });
    // },
    zedd: function() {
        return new Promise(function(resolve) {
            var el = $("<div class='modal-view'></div>");
            $("body").append(el);
            $.get("./open/zedd.html", function(html) {
                el.html(html);
                localStore.get("zedd").then(function(defaultValues) {
                    if (defaultValues) {
                        $("#zedd-url").val(defaultValues.url);
                        $("#zedd-user").val(defaultValues.user);
                        $("#zedd-pass").val(defaultValues.pass);
                        $("#zedd-form").submit();
                    }
                });
                $("#zedd-url").focus();
                $("#cancel").click(function() {
                    close();
                    resolve();
                });
                $("#help").click(function() {
                    window.open("http://zedapp.org/zedd");
                });

                $("#zedd-form").submit(function(event) {
                    var url = $("#zedd-url").val();
                    var user = $("#zedd-user").val();
                    var pass = $("#zedd-pass").val();
                    check(url, user, pass).then(function() {
                        $("#hint").text("");
                        localStore.set("zedd", {
                            url: url,
                            user: user,
                            pass: pass
                        });
                        updateTree();
                    }, function(err) {
                        $("#hint").text("Couldn't connect: " + (err || "connection error"));
                    });
                    event.preventDefault();
                });
            });

            function close() {
                el.remove();
            }

            function check(url, user, pass) {
                return new Promise(function(resolve, reject) {
                    // Only check http(s) links
                    if (url.indexOf("http") !== 0) {
                        return reject();
                    }
                    $.ajax({
                        type: "POST",
                        url: url,
                        data: {
                            action: 'version'
                        },
                        username: user || undefined,
                        password: pass || undefined,
                        success: function() {
                            resolve();
                        },
                        error: function(err) {
                            reject(err.statusText);
                        },
                        dataType: "text"
                    });
                });
            }

            function updateTree() {
                $("#zedd-tree").replaceWith('<div id="zedd-tree">');
                var treeEl = $("#zedd-tree");
                var rootUrl = $("#zedd-url").val();
                var user = $("#zedd-user").val();
                var pass = $("#zedd-pass").val();

                function readDir(path) {
                    return new Promise(function(resolve, reject) {
                        $.ajax({
                            type: "GET",
                            url: rootUrl + path,
                            username: user || undefined,
                            password: pass || undefined,
                            success: function(text) {
                                var entries = text.split("\n");
                                var dirs = [];
                                entries.forEach(function(entry) {
                                    if (entry[entry.length - 1] === '/') {
                                        dirs.push({
                                            title: entry.slice(0, -1),
                                            key: entry.slice(0, -1),
                                            path: path + "/" + entry.slice(0, -1),
                                            isFolder: true,
                                            isLazy: true
                                        });
                                    }
                                });
                                resolve(dirs);
                            },
                            error: function(err) {
                                reject(err.statusText);
                            },
                            dataType: "text"
                        });
                    });
                }

                function renderInitialTree(children) {
                    var activatingPath = null;
                    treeEl.dynatree({
                        onActivate: function(node) {
                            localStore.set("zeddLastPath", node.data.path);
                            var path = node.data.path.slice(1); // Cut off first /
                            var url = rootUrl + path + "?keep=1";
                            if (user) {
                                url += "&user=" + user + "&pass=" + pass;
                            }
                            resolve(url);
                            close();
                        },
                        onLazyRead: function(node) {
                            readDir(node.data.path).then(function(dirs) {
                                dirs.forEach(function(dir) {
                                    var child = node.addChild(dir);
                                    if (activatingPath && activatingPath[0] === dir.key) {
                                        activatingPath = activatingPath.slice(1);
                                        if (activatingPath.length === 0) {
                                            child.focus();
                                            setTimeout(function() {
                                                child.span.scrollIntoViewIfNeeded();
                                                child.focus();
                                            });
                                        } else {
                                            child.expand();
                                        }
                                    }
                                });
                                node.setLazyNodeStatus(DTNodeStatus_Ok);
                            }, function(err) {
                                console.error("Error loading node", err, node);
                            });
                        },
                        onKeydown: function(node, event) {
                            if (event.keyCode === 27) {
                                close();
                                resolve();
                            }
                        },
                        keyboard: true,
                        autoFocus: true,
                        activeVisible: true,
                        debugLevel: 0,
                        children: children,
                        minExpandLevel: 1
                    });
                    setTimeout(function() {
                        localStore.get("zeddLastPath").then(function(path) {
                            var tree = treeEl.dynatree("getTree");
                            if (path && path.length > 1) {
                                activatingPath = path.slice(2).split('/');
                                var node = tree.getNodeByKey("root");
                                node.expand();
                            } else {
                                var node = tree.getNodeByKey("root");
                                node.expand();
                            }
                        });
                    }, 100);
                }

                renderInitialTree([{
                    title: niceName(rootUrl),
                    key: "root",
                    path: "/",
                    isFolder: true,
                    isLazy: true
                }]);

            }

        });
    },
    localChrome: function() {
        return new Promise(function(resolve) {
            chrome.fileSystem.chooseEntry({
                type: "openDirectory"
            }, function(dir) {
                if (!dir) {
                    return resolve();
                }
                var id = chrome.fileSystem.retainEntry(dir);
                var title = dir.fullPath.slice(1);
                resolve({
                    title: title,
                    url: "local:" + id
                });
            });
        });
    }
};

module.exports = api;
