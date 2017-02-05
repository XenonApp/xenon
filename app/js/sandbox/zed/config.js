'use strict';

module.exports = {
    getPreference: function(preference) {
        return Promise.resolve(require("./config").getPreference(preference, require("./editor").getActiveSession()));
    },
    getPreferences: function() {
        return Promise.resolve(require("./config").getPreferences());
    },
    setPreference: function(preference, value) {
        return Promise.resolve(require("./config").setPreference(preference, value));
    },
    getMode: function(modeName) {
        return Promise.resolve(require("./config").getModes()[modeName]);
    },
    togglePreference: function(preference) {
        return Promise.resolve(require("./config").togglePreference(preference, require("./editor").getActiveSession()));
    },
    incrementInteger: function(preference, amount) {
        return Promise.resolve(require("./config").incrementInteger(preference, amount, require("./editor").getActiveSession()));
    },
    get: function(name) {
        return Promise.resolve(require("./config").getConfiguration()[name]);
    },
    reload: function() {
        return require("./config").loadConfiguration();
    }
};
