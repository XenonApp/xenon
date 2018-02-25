"use strict";

var oop = global.ace.require("ace/lib/oop");
var TextMode = global.ace.require("ace/mode/text").Mode;
var CommitHighlightRules = require("./commit_highlight_rules").CommitHighlightRules;

var Mode = function () {
    this.HighlightRules = CommitHighlightRules;
};
oop.inherits(Mode, TextMode);

(function () {
    this.type = "text";

    this.getNextLineIndent = function (state, line) {
        return this.$getIndent(line);
    };
    this.$id = "mode/commit";
}).call(Mode.prototype);

module.exports.Mode = Mode;
//# sourceMappingURL=commit.js.map