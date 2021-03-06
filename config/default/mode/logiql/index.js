var symbol = xenon.symbol;

var PRED_REGEX = /([a-zA-Z0-9_\-\$]+)\s*[\(\[]([a-zA-Z0-9_\-\$]+(,\s*)?)*[\)\]].*\->/g;
var indexToLine = xenon.util.indexToLine;

/**
 * inputs: text
 */
module.exports = function(info) {
    var match;
    var tags = [];
    var path = info.path;
    var text = info.inputs.text;
    // Regular old functions
    while (match = PRED_REGEX.exec(text)) {
        tags.push({
            path: path,
            symbol: match[1],
            locator: indexToLine(text, match.index)
        });
    }
    return symbol.updateSymbols(path, tags);
};
