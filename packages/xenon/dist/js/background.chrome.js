"use strict";

module.exports = new Promise(function (resolve) {
    chrome.runtime.getBackgroundPage(function (bg) {
        resolve(bg);
    });
});
//# sourceMappingURL=background.chrome.js.map