'use strict';
const options = {};

const urlReq = global.location.search.substring(1);
const parts = urlReq.split("&");

parts.forEach(function(part) {
    var spl = part.split('=');
    options[spl[0]] = decodeURIComponent(spl[1]);
});

module.exports.get = function(name) {
    return options[name];
};

module.exports.set = function(name, value) {
    options[name] = value;
};
