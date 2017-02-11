'use strict';

module.exports = {
    log: function(level, args) {
        console[level].apply(console, ["[Sandbox]"].concat(args));
        return Promise.resolve();
    }
};
