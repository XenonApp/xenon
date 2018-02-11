'use strict';

module.exports.isMacOS = function() {
    return process.platform === 'darwin';
};