/* global _ */
var session = xenon.session;

module.exports = function(info) {
    var path = info.path;
    var builtins = info.builtins;
    return session.getPreceedingIdentifier(path).then(function(prefix) {
        var matches = [];
        builtins.forEach(builtin => {
            if (builtin.indexOf(prefix) === 0) {
                matches.push({
                    name: builtin,
                    value: builtin,
                    meta: "builtin",
                    score: 0
                });
            }
        });
        return matches;
    });
};