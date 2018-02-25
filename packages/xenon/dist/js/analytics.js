"use strict";

const eventbus = require('./eventbus');
const tracker = require('./analytics_tracker');

var api = {
    hook: function () {
        eventbus.on("newsession", function (newSession) {
            tracker.then(tracker => tracker.trackEvent("Editor", "OpenWithMode", newSession.mode.language));
        });

        var loadedFileList = false;

        eventbus.on("loadedfilelist", function () {
            if (loadedFileList) {
                // Only interested in seeing if people reload
                // explicitly
                tracker.then(tracker => tracker.trackEvent("Editor", "LoadedFileList"));
            }
            loadedFileList = true;
        });

        var configLoaded = false;

        eventbus.on("configchanged", function () {
            if (configLoaded) {
                // Only interested in seeing that people actually
                // change their config
                tracker.then(tracker => tracker.trackEvent("Editor", "ConfigChanged"));
            }
            configLoaded = true;
        });

        eventbus.on("goto", function (phrase) {
            if (phrase[0] === "/") {
                tracker.then(tracker => tracker.trackEvent("Editor", "Goto", "FullPath"));
            } else if (phrase[0] === ":" && phrase[1] === "/") {
                tracker.then(tracker => tracker.trackEvent("Editor", "Goto", "FindInFile"));
            } else if (phrase[0] === ":" && phrase[1] === "@") {
                tracker.then(tracker => tracker.trackEvent("Editor", "Goto", "LocalSymbol"));
            } else if (phrase[0] === ":") {
                tracker.then(tracker => tracker.trackEvent("Editor", "Goto", "Line"));
            } else if (phrase[0] === "@") {
                tracker.then(tracker => tracker.trackEvent("Editor", "Goto", "ProjectSymbol"));
            } else {
                tracker.then(tracker => tracker.trackEvent("Editor", "Goto", "FilePattern"));
            }
        });

        eventbus.on("complete", function (edit) {
            tracker.then(tracker => tracker.trackEvent("Editor", "Complete", edit.session.mode.language));
        });

        eventbus.on("tree", function () {
            tracker.then(tracker => tracker.trackEvent("Editor", "Tree"));
        });

        eventbus.on("commandtree", function () {
            tracker.then(tracker => tracker.trackEvent("Editor", "CommandTree"));
        });

        eventbus.on("executedcommand", function (cmd) {
            tracker.then(tracker => tracker.trackEvent("Editor", "ExecuteCommand", cmd));
        });
    }
};

module.exports = api;
//# sourceMappingURL=analytics.js.map