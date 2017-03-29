var Markdown = require("./pagedown.js")
var preview = xenon.preview;

/**
 * Required inputs: text
 */
module.exports = function(info) {
    var text = info.inputs.text;
    var converter = new Markdown.Converter();
    var html = converter.makeHtml(text);
    return preview.showPreview(html);
};
