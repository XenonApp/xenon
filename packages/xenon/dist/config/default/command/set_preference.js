"use strict";

var config = xenon.config;

module.exports = function (info) {
    return config.setPreference(info.preference, info.value);
};
//# sourceMappingURL=set_preference.js.map