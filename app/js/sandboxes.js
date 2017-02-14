'use strict';

const {ipcRenderer} = require('electron');

const Sandbox = require('./sandbox');
const command = require('./command');

var inputables = {};
var sandboxes = {};


function get(name) {
    if(!sandboxes[name]) {
        console.log("Creating sandbox", name);
        sandboxes[name] = new Sandbox(name);
    }
    return sandboxes[name];
}

function cleanup() {
    _.each(sandboxes, function(sandbox, name) {
        if(sandbox.lastUse < Date.now() - 120 * 1000) {
            console.log("Destroying sandbox", name);
            sandbox.destroy();
            delete sandboxes[name];
        }
    });
}

setInterval(cleanup, 20000);

var api = {
    hook: function() {
        ipcRenderer.on('destroy-sandboxes', () => {
            this.destroy();
            ipcRenderer.send('did-destroy-sandboxes');
        });
    },
    defineInputable: function(name, fn) {
        inputables[name] = fn;
    },
    getInputable: function(session, name) {
        return inputables[name] && inputables[name](session);
    },
    execCommand: function(name, spec, session) {
        var sandbox = get(spec.sandbox || "default");
        sandbox.lastUse = Date.now();
        return sandbox.execCommand(name, spec, session);
    },
    destroy: function() {
        for (let name in sandboxes) {
            console.log("Destroying sandbox", name);
            sandboxes[name].destroy();
            delete sandboxes[name];
        }
    }
};

command.define("Sandbox:Reset", {
    doc: "Reload all sandbox code. If you've made changes to a Zed " + "extension in your sandbox, you must run this for those changes " + "to take effect.",
    exec: function() {
        _.each(sandboxes, function(sandbox) {
            sandbox.reset();
        });
    },
    readOnly: true
});

module.exports = api;
