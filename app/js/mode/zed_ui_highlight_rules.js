"use strict";

var oop = global.ace.require("ace/lib/oop");
var lang = global.ace.require("ace/lib/lang");
var MarkdownHighlightRules = global.ace.require("ace/mode/markdown_highlight_rules").MarkdownHighlightRules;

var ZedUiHighlightRules = function() {
    MarkdownHighlightRules.call(this);

    this.$rules.start.unshift({
        token: "ui_button",
        regex: /\[[^\]]+\]/
    });
    this.$rules.listblock.unshift({
        token: "ui_button",
        regex: /\[[^\]]+\]/
    });

};
oop.inherits(ZedUiHighlightRules, MarkdownHighlightRules);

module.exports.ZedUiHighlightRules = ZedUiHighlightRules;
