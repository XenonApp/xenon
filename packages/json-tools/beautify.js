const beautify = xenon.lib.beautify;
const beautifier = require("js-beautify").js;

/**
 * Required inputs: text, preferences
 */
module.exports = function(info) {
    var preferences = info.inputs.preferences;
    return beautify(info.path, enhancedBeautifier);

    function enhancedBeautifier(text) {
        var indentChar = ' ';
        if (!preferences.useSoftTabs) {
            indentChar = '\t';
            preferences.tabSize = 1;
        }
        var options = {
            "indent_size": preferences.tabSize,
            "indent_char": indentChar
        };

        return beautifier(text, options);
    }
};
