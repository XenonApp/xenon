var session = xenon.session;

module.exports = function(info) {
    var lines = info.inputs.selectionText.replace(/\n$/, "").split("\n").sort();
    return session.replaceRange(info.path, info.inputs.selectionRange, lines.join("\n"));
};
