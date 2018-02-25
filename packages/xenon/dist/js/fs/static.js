'use strict';

/**
 * This module implements the read-only file system, essentially a simple
 * way to serve files from folders from within the Zed application
 */

var http_cache = require("../lib/http_cache");
var fsUtil = require("./util");

module.exports = function (options) {
    var root = options.url;
    var readOnlyFn = options.readOnlyFn;

    var api = {
        listFiles: function () {
            return http_cache.fetchUrl(root + "/all", {}).then(function (res) {
                var items = res.split("\n");
                for (var i = 0; i < items.length; i++) {
                    if (!items[i]) {
                        items.splice(i, 1);
                        i--;
                    }
                }
                return items;
            });
        },
        readFile: function (path, binary) {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    type: "GET",
                    url: root + path,
                    error: function (xhr) {
                        reject(xhr.status);
                    },
                    success: function (res) {
                        if (!window.readOnlyFiles) {
                            window.readOnlyFiles = {};
                        }
                        if (readOnlyFn && readOnlyFn(path)) {
                            window.readOnlyFiles[path] = true;
                        }
                        if (binary) {
                            res = fsUtil.uint8ArrayToBinaryString(new Uint8Array(res));
                        }
                        resolve(res);
                    },
                    dataType: binary ? "arraybuffer" : "text"
                });
            });
        },
        writeFile: function (path, content, binary) {
            return Promise.reject(405); // Method not allowed
        },
        deleteFile: function (path) {
            return Promise.reject(405); // Method not allowed
        },
        watch: function () {
            // Nop
        },
        on: function () {
            // Nop
        },
        off: function () {
            // Nop
        },
        getCapabilities: function () {
            return {};
        }
    };

    return api;
};
//# sourceMappingURL=static.js.map