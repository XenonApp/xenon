'use strict';

const history = require('../history');
const XFS = require('@xenonapp/xfs');

module.exports = function(options) {
    const api = new XFS(options.dir);
    
    if (!options.dontRegister) {
        history.pushProject(api.rootPath, "node:" + api.rootPath);
    }

    return api;
};
