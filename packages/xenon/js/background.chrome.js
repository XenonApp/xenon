module.exports = new Promise(function(resolve) {
    chrome.runtime.getBackgroundPage(function(bg) {
        resolve(bg);
    });
});
