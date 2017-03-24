"use strict";

var oop = global.ace.require("ace/lib/oop");
var MarkdownHighlightRules = global.ace.require("ace/mode/markdown_highlight_rules").MarkdownHighlightRules;

var CommitHighlightRules = function() {
    MarkdownHighlightRules.call(this);

    this.$rules.start.unshift({
        token: "comment",
        regex: /#/,
        next: "line_comment"
    });
    this.$rules.line_comment = [{
        token: "comment",
        regex: "$|^",
        next: "start"
    }, {
        defaultToken: "comment"
    }];
};
oop.inherits(CommitHighlightRules, MarkdownHighlightRules);

module.exports.CommitHighlightRules = CommitHighlightRules;
