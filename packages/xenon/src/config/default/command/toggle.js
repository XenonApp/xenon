var config = xenon.config;

module.exports = function(info) {
    return config.togglePreference(info.preference);
};
