var config = xenon.config;

module.exports = function(info) {
    return config.incrementInteger(info.preference, info.amount);
};
