var config = xenon.config;

module.exports = function(info) {
    return config.setPreference(info.preference, info.value);
};
