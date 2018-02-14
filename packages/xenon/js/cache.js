const cache = new Map();
module.exports = {
    get(key) {
        return cache.get(key);
    },
    set(key, value) {
        cache.set(key, value);
    }
};