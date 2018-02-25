'use strict';

const history = require('../history');
const tokenStore = require('../local_store');

const poll_watcher = require("./poll_watcher");
const AWS = require("../lib/aws-sdk.min");
const fsUtil = require("./util");
const mimeTypes = require("../lib/mime_types");
const pathUtil = require("../lib/path");

module.exports = function plugin(options) {
    var bucket = options.bucket;

    var s3;

    var api = {
        listFiles: function () {
            return new Promise(function (resolve, reject) {
                s3.listObjects({
                    Bucket: bucket
                }, function (err, result) {
                    if (err) {
                        return reject(err);
                    }
                    var filenames = [];
                    result.Contents.forEach(function (file) {
                        filenames.push("/" + file.Key);
                    });
                    resolve(filenames);
                });
            });
        },
        readFile: function (path) {
            return new Promise(function (resolve, reject) {
                s3.getObject({
                    Bucket: bucket,
                    Key: path.substring(1)
                }, function (err, data) {
                    if (err) {
                        return reject(err.statusCode);
                    }
                    watcher.setCacheTag(path, data.ETag);
                    resolve(fsUtil.uint8ArrayToBinaryString(data.Body));
                });
            });
        },
        writeFile: function (path, content, binary) {
            return new Promise(function (resolve, reject) {
                var body;
                var ext = pathUtil.ext(path);
                var contentType = mimeTypes[ext] || "application/octet-stream";
                if (binary) {
                    body = fsUtil.binaryStringAsUint8Array(content);
                } else {
                    body = content;
                }
                s3.putObject({
                    Bucket: bucket,
                    ContentType: contentType,
                    Key: path.substring(1),
                    Body: body
                }, function (err, result) {
                    if (err) {
                        return reject(err);
                    }
                    watcher.setCacheTag(path, result.ETag);
                    resolve();
                });
            });
        },
        deleteFile: function (path) {
            return new Promise(function (resolve, reject) {
                s3.deleteObject({
                    Bucket: bucket,
                    Key: path.substring(1)
                }, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        },
        watchFile: function (path, callback) {
            watcher.watchFile(path, callback);
        },
        unwatchFile: function (path, callback) {
            watcher.unwatchFile(path, callback);
        },
        getCacheTag: function (path) {
            return new Promise(function (resolve, reject) {
                s3.headObject({
                    Bucket: bucket,
                    Key: path.substring(1)
                }, function (err, result) {
                    if (err) {
                        return reject(err.statusCode);
                    }
                    resolve(result.ETag);
                });
            });
        },
        getCapabilities: function () {
            return {};
        }
    };

    var watcher = poll_watcher(api, 5000);
    history.pushProject("S3 [" + bucket + "]", "s3:" + bucket);

    return Promise.all([tokenStore.get("awsAccessKey"), tokenStore.get("awsSecretKey")]).then(function (keys) {
        if (!keys[0] || !keys[1]) {
            console.error("Tokens not set: awsAccessKey and awsSecretKey");
            throw new Error("Tokens not set");
        }

        AWS.config.update({
            accessKeyId: keys[0],
            secretAccessKey: keys[1]
        });

        s3 = new AWS.S3();

        // TODO: fs would have to resolve a promise before being used.
        return api;
    });
};
//# sourceMappingURL=s3.js.map