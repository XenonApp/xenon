"use strict";

var config = xenon.config;

module.exports = function (info) {
    return config.togglePreference(info.preference);
};
//# sourceMappingURL=toggle.js.map