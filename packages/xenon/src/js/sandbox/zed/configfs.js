'use strict';

module.exports = {
    listFiles: function() {
        return Promise.resolve(require("../../configfs").listFiles());
    },
    readFile: function(path, binary) {
        return require("../../configfs").readFile(path, binary);
    },
    writeFile: function(path, content, binary) {
        return require("../../configfs").writeFile(path, content, binary);
    },
    deleteFile: function(path) {
        return require("../../configfs").deleteFile(path);
    }
};
