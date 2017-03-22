'use strict';

module.exports = function(config) {
    var request = require("request");
    if(!localStorage.analyticsId) {
        localStorage.analyticsId = "" + Date.now();
    }

    return new Promise(function(resolve) {
        let version = getCurrentVersion();
        var api = {
            trackEvent: function(category, name, label) {
                if (config.getPreference("enableAnalytics") !== false) {
                    request({
                        uri: "https://www.google-analytics.com/collect",
                        method: 'POST',
                        body: "t=event&_v=ca3&v=1&an=zed&av=" + version + "&tid=UA-58112-11&ul=en-US&ec=" + encodeURIComponent(category) + "&ea=" + encodeURIComponent(name) + "&el=" + encodeURIComponent(label) + "&cid=" + localStorage.analyticsId
                    }, function(err) {
                        if(err) {
                            console.error("GA error", err);
                        }
                    });
                }
            }
        };
        resolve(api);
    });
};

function getCurrentVersion() {
    let json = require("../../package.json");
    return json.version + "-nw";
}
