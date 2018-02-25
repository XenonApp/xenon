'use strict';

module.exports.dirname = function (path) {
    if (typeof path === 'undefined') {
        return '';
    }

    if (path[path.length - 1] === '/') {
        path = path.substring(0, path.length - 1);
    }
    var parts = path.split("/");
    return parts.slice(0, parts.length - 1).join("/");
};

module.exports.filename = function (path) {
    if (path[path.length - 1] === '/') {
        path = path.substring(0, path.length - 1);
    }
    var parts = path.split("/");
    return parts[parts.length - 1];
};

module.exports.ext = function (path) {
    var filename = exports.filename(path);
    var parts = filename.split('.');
    if (parts.length === 1) {
        return null;
    }
    return parts.slice(1).join(".");
};
//# sourceMappingURL=path.js.map