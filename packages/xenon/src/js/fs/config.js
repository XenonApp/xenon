'use strict';
const cache = require('../cache');

let app, fs;
if (!CHROME) {
    app = require('electron').remote.app;
    fs = require("fs");
}
const path = require('path');

module.exports = function(options) {
    var watchSelf = options.watchSelf;

    const staticFs = require('./static')({
        url: path.join(__dirname, '..', '..', "config"),
        readOnlyFn: function(path) {
            return path !== "/.zedstate" && path !== "/user.json" && path !== "/user.css";
        }
    });

    let mainFs;
    if (CHROME)    {
        const configHome = cache.get('configDir');
        const xeddConfig = cache.get('xeddConfig');
        console.log(xeddConfig);
        if (!configHome || !xeddConfig.url) {
            throw new Error('Config directory should be configured already');
        }

        mainFs = require('./socket')({
            url: xeddConfig.url,
            path: xeddConfig.path,
            user: xeddConfig.user,
            password: xeddConfig.password,
            keep: false
        });
    } else {
        const configHome = localStorage.configDir || path.join(app.getPath('userData'), 'config');
        console.log("Config home", configHome);
        if (!fs.existsSync(configHome)) {
            fs.mkdirSync(configHome);
        }
        mainFs = require('./node')({
            dir: configHome,
            dontRegister: true
        });
    }

    return require('./union')({
        fileSystems: [mainFs, staticFs],
        watchSelf: watchSelf,
    });
};
