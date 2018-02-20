'use strict';
const cache = require('../cache');

let app, fs;
if (!WEBPACK) {
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
    if (WEBPACK)    {
        const configHome = cache.get('configDir');
        const url = cache.get('url');
        if (!configHome || !url) {
            throw new Error('Config directory should be configured already');
        }
        
        mainFs = require('./web')({
            url: `${url}/${configHome}`,
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

