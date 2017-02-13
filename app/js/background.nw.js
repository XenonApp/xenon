'use strict';

// TODO: fix this to handle ipc with main

module.exports = function() {
    // var gui = require("./nw.gui");

    // var exp = Object.create(process.mainModule.exports);
    // exp.openProject = function(title, url) {
    //     var shouldOpen = process.mainModule.exports.openProject(title, url);
    //     if(shouldOpen) {
    //         var w = gui.Window.open('editor.html?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title), {
    //             position: 'center',
    //             width: 1024,
    //             height: 768,
    //             frame: true,
    //             toolbar: false,
    //             icon: "Icon.png"
    //         });

    //         w.once("loaded", function() {
    //             w.focus();
    //         });
    //     }
    // };

    return {
        registerWindow() {
            return null;
        }
    };
};
