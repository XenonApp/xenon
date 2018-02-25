'use strict';

// TODO: fix this fs
const axios = require('axios');
const io = require('socket.io-client');
const history = require('../history');

let socket;

module.exports = function plugin(options) {
    var fsUtil = require("./util");
    var niceName = require("../lib/url_extractor").niceName;

    var url = options.url;
    const auth = {
        username: options.user,
        password: options.pass
    };
    var keep = options.keep;

    socket = io(url);

    var mode = "directory"; // or: file
    var fileModeFilename; // if mode === "file"
    var watcher;
    var capabilities = {};

    if (keep) {
        history.pushProject(niceName(url), options.fullUrl);
    }

    axios.get(`${url}/capablities`, { auth })
        .then(response => capabilities = response.data);

    function listFiles() {
        return axios.get(`${url}/filelist`)
            .then(res => res.data.filter(item => !!item));
    }

    function readFile(path, binary) {
        if (mode === "file") {
            if (path === "/.zedstate") {
                return Promise.resolve(JSON.stringify({
                    "session.current": [fileModeFilename]
                }));
            }
            if (path !== fileModeFilename) {
                return Promise.reject(404);
            }
        }
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: "GET",
                url: url + path,
                username: user || undefined,
                password: pass || undefined,
                error: function(xhr) {
                    reject(xhr.status);
                },
                success: function(res, status, xhr) {
                    watcher.setCacheTag(path, xhr.getResponseHeader("ETag"));
                    if(binary) {
                        res = fsUtil.uint8ArrayToBinaryString(new Uint8Array(res));
                    }
                    resolve(res);
                },
                dataType: binary ? "arraybuffer" : "text"
            });
        });
    }

    function writeFile(path, content, binary) {
        if (mode === "file") {
            // Ignore state saves
            if (path === "/.zedstate") {
                return Promise.resolve();
            }
            if (path !== fileModeFilename) {
                return Promise.reject(500);
            }
        }
        watcher.lockFile(path);
        return new Promise(function(resolve, reject) {
            $.ajax(url + path, {
                type: 'PUT',
                data: binary ? fsUtil.binaryStringAsUint8Array(content) : content,
                // dataType: 'text',
                contentType: 'application/octet-stream',
                processData: false,
                username: user || undefined,
                password: pass || undefined,
                success: function(res, status, xhr) {
                    watcher.setCacheTag(path, xhr.getResponseHeader("ETag"));
                    watcher.unlockFile(path);
                    resolve(res);
                },
                error: function(xhr) {
                    watcher.unlockFile(path);
                    reject(xhr.status || xhr.statusText);
                }
            });
        });
    }

    function deleteFile(path) {
        return new Promise(function(resolve, reject) {
            $.ajax(url + path, {
                type: 'DELETE',
                dataType: 'text',
                success: reject,
                username: user || undefined,
                password: pass || undefined,
                error: function(xhr) {
                    resolve(xhr.status);
                }
            });
        });
    }

    function watchFile(path, callback) {
        watcher.watchFile(path, callback);
    }

    function unwatchFile(path, callback) {
        watcher.unwatchFile(path, callback);
    }

    function getCacheTag(path) {
        return new Promise(function(resolve, reject) {
            $.ajax(url + path, {
                type: 'HEAD',
                username: user || undefined,
                password: pass || undefined,
                success: function(data, status, xhr) {
                    var newEtag = xhr.getResponseHeader("ETag");
                    resolve(newEtag);
                },
                error: function(xhr) {
                    reject(xhr.status);
                }
            });
        });
    }

    function run(command, stdin) {
        return new Promise(function(resolve, reject) {
            $.ajax(url, {
                type: "POST",
                url: url,
                data: {
                    action: 'run',
                    command: JSON.stringify(command),
                    stdin: stdin
                },
                username: user || undefined,
                password: pass || undefined,
                success: function(res) {
                    resolve(res);
                },
                error: function(xhr) {
                    reject(xhr.status);
                },
                dataType: "text"
            });
        });
    }

    var api = {
        listFiles: listFiles,
        readFile: readFile,
        writeFile: writeFile,
        deleteFile: deleteFile,
        watchFile: watchFile,
        unwatchFile: unwatchFile,
        getCacheTag: getCacheTag,
        getCapabilities: function() {
            return capabilities;
        },
        run: run
    };

    return api;
};
