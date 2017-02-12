'use strict';

const options = require("./lib/options");
const url = options.get("url");

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
    const path = url.substring("dropbox:".length);
    api = require('./dropbox')({
        rootPath: path
    });
} else if (url.indexOf("node:") === 0) {
    const path = url.substring("node:".length);
    if (path) {
        api = require('./fs/node')({
            dir: path
        });
    } else {
        // TODO: re-open project picker
    }
} else if(url.indexOf("gh:") === 0) {
    var repoBranch = url.substring("gh:".length);
    const parts = repoBranch.split(":");
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
    const parts = url.split('?');
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
