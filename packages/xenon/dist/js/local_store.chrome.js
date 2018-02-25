'use strict';

module.exports = function () {
    var api = {
        set: function (key, value) {
            return new Promise(function (resolve) {
                var obj = {};
                obj[key] = value;
                chrome.storage.local.set(obj, function () {
                    resolve();
                });
            });
        },
        get: function (key) {
            return new Promise(function (resolve) {
                chrome.storage.local.get(key, function (results) {
                    resolve(results[key]);
                });
            });
        },
        delete: function (key) {
            return new Promise(function (resolve) {
                chrome.storage.local.remove(key, function () {
                    resolve();
                });
            });
        }
    };
    return api;
};
//# sourceMappingURL=local_store.chrome.js.map