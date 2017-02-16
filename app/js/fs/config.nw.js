'use strict';
const fs = require("fs");

module.exports = function(options) {
    var watchSelf = options.watchSelf;
    
    const staticFs = require('./static')({
        url: "config",
        readOnlyFn: function(path) {
            return path !== "/.zedstate" && path !== "/user.json" && path !== "/user.css";
        }
    });
    
    // TODO: get this to use actual userData path (app.get('userData'))
    const configHome = localStorage.configDir || '/home/kiteeatingtree/.config/xenon';
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

