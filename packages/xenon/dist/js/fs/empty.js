'use strict';

module.exports = function plugin() {
    var api = {
        isEmpty: true,
        listFiles: function () {
            return Promise.resolve([]);
        },
        readFile: function () {
            return Promise.reject(405); // Method not allowed
        },
        writeFile: function () {
            return Promise.resolve(405);
        },
        deleteFile: function () {
            return Promise.reject(405);
        },
        watch: function () {},
        on: function () {},
        off: function () {},
        getCapabilities: function () {
            return {};
        }
    };

    return api;
};
//# sourceMappingURL=empty.js.map