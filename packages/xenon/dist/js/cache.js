"use strict";

const cache = new Map();
module.exports = {
    get(key) {
        return cache.get(key);
    },
    set(key, value) {
        cache.set(key, value);
    }
};
//# sourceMappingURL=cache.js.map