"use strict";

// Monkey patch vim mode
var vimKeyBindings = global.ace.require("ace/keyboard/vim");

function patchVimKeys() {
    var vimKeys = vimKeyBindings.handler.defaultKeymap;
    for (var i = 0; i < vimKeys.length; i++) {
        var key = vimKeys[i];
        if (key.keys.indexOf("<C-") === 0 || key.type == "keyToKey" && key.toKeys.indexOf("<C-") === 0) {
            vimKeys.splice(i, 1);
            i--;
        }
    }
}
patchVimKeys();
//# sourceMappingURL=vim_patch.js.map