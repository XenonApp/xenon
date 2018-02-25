"use strict";

var config = xenon.config;

module.exports = function (info) {
    return config.incrementInteger(info.preference, info.amount);
};
//# sourceMappingURL=config_int.js.map