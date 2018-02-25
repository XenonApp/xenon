'use strict';

/**
 * This module implements a union fs, it will do fall-through for various operations
 * such as reads and writes, attempting them one by one until one succeeds.
 */
module.exports = function(options) {
    var fileSystems = options.fileSystems;
    
    function attempt(fnName, args) {
        var index = 0;
    
        function attemptOne() {
            return fileSystems[index][fnName].apply(fileSystems[index], args).catch(function(err) {
                index++;
                if (index >= fileSystems.length) {
                    return Promise.reject(err);
                } else {
                    return attemptOne();
                }
            });
        }
        return attemptOne();
    }
    
    
    var api = {
        listFiles: function() {
            var files = [];
            return Promise.all(fileSystems.map(function(fs) {
                return fs.listFiles().then(function(files_) {
                    files_.forEach(function(filename) {
                        if (files.indexOf(filename) === -1) {
                            files.push(filename);
                        }
                    });
                }, function(err) {
                    console.error("Got error from filesystem", fs, err);
                });
            })).then(function() {
                return files;
            });
        },
        on: function(event, listener) {
            fileSystems.forEach(fs => fs.on(event, listener));
        },
        off: function(event, listener) {
            fileSystems.forEach(fs => fs.off(event, listener));
        },
        readFile: function(path, binary) {
            return attempt("readFile", [path, binary]).then(function(d) {
                return d;
            });
        },
        watch: function(ignored) {
            fileSystems.forEach(fs => fs.watch(ignored));
        },
        writeFile: function(path, content, binary) {
            return attempt("writeFile", [path, content, binary]);
        },
        deleteFile: function(path) {
            return attempt("deleteFile", [path]);
        },
        getCapabilities: function() {
            return {};
        }
    };
    
    return api;
};
