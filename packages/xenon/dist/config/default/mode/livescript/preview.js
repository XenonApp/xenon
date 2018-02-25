"use strict";

var lsc = require("./livescript.js").LiveScript;
var preview = xenon.preview;

/**
 * Required inputs: text
 */
module.exports = function (info) {
   var text, html;
   text = info.inputs.text;
   try {
      javascript = lsc.compile(text);
   } catch (e) {
      javascript = e.message;
   }
   return preview.showPreview("<pre>" + javascript.replace(/</g, "&lt;") + "</pre>");
};
//# sourceMappingURL=preview.js.map