'use strict';

// EVEN NEWER fuzzy find implementation
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function fuzzyFilter(pattern, files) {
    var closeMatchRegex = escapeRegExp(pattern);
    closeMatchRegex = closeMatchRegex.split(/\s+/).join(".*?");
    closeMatchRegex = closeMatchRegex.replace(/\\\//g, ".*?\\/.*?");
    var distantMatchRegex = escapeRegExp(pattern).split('').join(".*?");
    var r1 = new RegExp(closeMatchRegex, "i");
    var r2 = new RegExp(distantMatchRegex, "i");
    var matches = [];
    if(!pattern) {
        return files.map(function(f) {
            return {
                name: f,
                path: f,
                score: 1000
            };
        });
    }
    for(var i = 0; i < files.length; i++) {
        var file = files[i];
        var m = r1.exec(file);
        if(m) {
            matches.push({
                name: file,
                path: file,
                score: 100000 - (file.length - m[0].length - m.index)
            });
        } else {
            // Let's try the distant matcher
            var m2 = r2.exec(file);
            if(m2) {
                matches.push({
                    name: file,
                    path: file,
                    score: 10000 - (file.length - m2[0].length - m2.index)
                });
            }
        }
    }
    return matches;
}

module.exports = function(files, pattern) {
    return fuzzyFilter(pattern, files);
};
