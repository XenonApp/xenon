'use strict';

var session = xenon.session;

module.exports = function (info) {
    return session.getPreceedingIdentifier(info.path).then(function (prefix) {
        if (!prefix) {
            return [];
        }
        var snippets = info.snippets;

        const results = [];
        Object.keys(snippets).forEach(name => {
            const snippet = snippets[name];
            results.push({
                name: name,
                value: name,
                snippet: snippet,
                score: Infinity,
                icon: "snippet"
            });
        });

        return results;
    });
};
//# sourceMappingURL=snippet_completer.js.map