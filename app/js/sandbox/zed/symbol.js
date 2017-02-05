'use strict';

module.exports = {
    updateSymbols: function(path, tags) {
        require("./symbol").updateSymbols(path, tags);
        return Promise.resolve();
    },
    getSymbols: function(opts) {
        return require("./symbol").getSymbols(opts);
    }
};
