/*global chrome */
const url = require("./lib/options").get("url");

let api;

// TODO: Generalize this
if (!url) {
    api = require('./fs/empty')();
} else if (url.indexOf("nwconfig:") === 0) {
    api = require("./fs/config.nw")({watchSelf: false});
} else if (url.indexOf("manual:") === 0) {
    api = require('./fs/static')({
        url: 'manual',
        readOnlyFn: function() {
            return true;
        }
    });
} else if (url.indexOf("dropbox:") === 0) {
    var path = url.substring("dropbox:".length);
    api = require('./dropbox')({
        rootPath: path
    });
} else if (url.indexOf("node:") === 0) {
    var path = url.substring("node:".length);
    if (path) {
        api = require('./node')({
            dir: path
        });
    } else {
        // TODO: fix folderPicker
        return new Promise(function(resolve, reject) {
            require(["./lib/folderpicker.nw"], function(folderPicker) {
                folderPicker().then(function(path) {
                    options.set("title", path);
                    options.set("url", "node:" + path);
                    resolve({
                        packagePath: "./fs/node",
                        dir: path
                    });
                    setTimeout(function() {
                        var openProjects = zed.getService("windows").openProjects;
                        delete openProjects["node:"];
                        openProjects["node:" + path] = nodeRequire("nw.gui").Window.get();
                    }, 2000);
                });
            });
        })
    }
} else if(url.indexOf("gh:") === 0) {
    var repoBranch = url.substring("gh:".length);
    var parts = repoBranch.split(":");
    var repo = parts[0];
    var branch = parts[1] || "master";
    api = require('./github', {
        repo: repo,
        branch: branch
    });
} else if(url.indexOf("s3:") === 0) {
    var bucket = url.substring("s3:".length);
    api = require('./s3', {
        bucket: bucket
    });
} else {
    var parts = url.split('?');
    var webfsParts = parts[1] ? parts[1].split("&") : [];
    var webfsOpts = {};

    webfsParts.forEach(function(part) {
        var spl = part.split('=');
        webfsOpts[spl[0]] = decodeURIComponent(spl[1]);
    });
    api = require('./web', {
        fullUrl: url,
        url: parts[0],
        user: webfsOpts.user,
        pass: webfsOpts.pass,
        keep: webfsOpts.keep
    });
}

module.exports = api;
