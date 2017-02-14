'use strict';

const {ipcRenderer} = require('electron');

const Sandbox = require('./sandbox.main');
const command = require('./command');

var inputables = {};
var sandboxes = {};


function get(name) {
    if (sandboxes[name]) {
        return Promise.resolve(sandboxes[name]);
    }
    
    return new Promise(resolve => {
        console.log("Creating sandbox", name);
        ipcRenderer.once('did-create-sandbox', () => {
            sandboxes[name] = new Sandbox(name);
            resolve(sandboxes[name]);
        });
        ipcRenderer.send('create-sandbox', name);
    });
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
        return get(spec.sandbox || "default").then(sandbox => {
            sandbox.lastUse = Date.now();
            return sandbox.execCommand(name, spec, session);
        });
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
        for (let name in sandboxes) {
            ipcRenderer.send('reset-sandbox', name);
        }
    },
    readOnly: true
});

module.exports = api;
