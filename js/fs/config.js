'use strict';

const app = require('electron').remote.app;
const fs = require("fs");
const path = require('path');

module.exports = function(options) {
    var watchSelf = options.watchSelf;
    
    const staticFs = require('./static')({
        url: path.join(__dirname, '..', '..', "config"),
        readOnlyFn: function(path) {
            return path !== "/.zedstate" && path !== "/user.json" && path !== "/user.css";
        }
    });
    
    const configHome = localStorage.configDir || path.join(app.getPath('userData'), 'config');
    console.log("Config home", configHome);
    if (!fs.existsSync(configHome)) {
        fs.mkdirSync(configHome);
    }
    
    const nodeFs = require('./node')({
        dir: configHome,
        dontRegister: true
    });
    
    return require('./union')({
        fileSystems: [nodeFs, staticFs],
        watchSelf: watchSelf,
    });
};

