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
} else if (!CHROME && url.indexOf("node:") === 0) {
    const path = url.substring("node:".length);
    if (path) {
        api = require('./fs/node')({
            dir: path
        });
    } else {
        // TODO: re-open project picker - maybe only if path doesn't exist
    }
} else if (url.indexOf('xedd:') === 0) {
    const parts = url.split('?');
    var webfsParts = parts[1] ? parts[1].split("&") : [];
    var webfsOpts = {};

    webfsParts.forEach(function(part) {
        var spl = part.split('=');
        webfsOpts[spl[0]] = decodeURIComponent(spl[1]);
    });
    const hostUrl = parts[0].substring('xedd:'.length);
    api = require('./fs/socket')({
        fullUrl: url,
        url: hostUrl,
        path: webfsOpts.path,
        user: webfsOpts.user,
        password: webfsOpts.password,
        keep: webfsOpts.keep
    });
} else {
    // TODO: re-open project picker
}

api.isConfig = false;
if (url.indexOf("nwconfig:") === 0) {
    api.isConfig = true;
}

module.exports = api;
