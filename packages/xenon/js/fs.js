'use strict';

const options = require("./lib/options");
const url = options.get("url");

let api;

if (!url) {
    api = require('./fs/empty')();
} else if (url.indexOf("nwconfig:") === 0) {
    api = require("./fs/config")({watchSelf: false});
} else if (url.indexOf("manual:") === 0) {
    api = require('./fs/static')({
        url: 'manual',
        readOnlyFn: function() {
            return true;
        }
    });
} else if (!WEBPACK && url.indexOf("node:") === 0) {
    const path = url.substring("node:".length);
    if (path) {
        api = require('./fs/node')({
            dir: path
        });
    } else {
        // TODO: re-open project picker - maybe only if path doesn't exist
    }
} else {
    const parts = url.split('?');
    var webfsParts = parts[1] ? parts[1].split("&") : [];
    var webfsOpts = {};

    webfsParts.forEach(function(part) {
        var spl = part.split('=');
        webfsOpts[spl[0]] = decodeURIComponent(spl[1]);
    });
    api = require('./fs/web')({
        fullUrl: url,
        url: parts[0],
        user: webfsOpts.user,
        pass: webfsOpts.pass,
        keep: webfsOpts.keep
    });
}

api.isConfig = false;
if (url.indexOf("nwconfig:") === 0) {
    api.isConfig = true;
}

module.exports = api;
