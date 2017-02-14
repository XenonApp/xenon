'use strict';
/**
 * This module manages the Zed sandbox, the sandbox is used to run user
 * provided code, either fetched from the Zed code base itself, or fetched
 * from remote URLs.
 *
 * Sandboxed code cannot crash Zed itself, but can call some Zed-specific APIs.
 * These APIs live in the xenon global in the sandbox, and are
 * essentially proxies proxying the request to Zed itself via postMessage
 * communication. The APIs interfaces are defined in sandbox/interface/zed/*
 * and the Zed side is implemented in sandbox/impl/zed/*.
 */
 
const {ipcRenderer, remote} = require('electron');
const BrowserWindow = remote.BrowserWindow;
const windowId = remote.getCurrentWindow().id;
const path = require('path');
const url = require('url');
 
var events = require("./lib/events");

var id = 0;
var waitingForReply = {};

function Sandbox(name) {
    this.name = name;
    this.sandboxWorker = null;
    events.EventEmitter.call(this, false);
    this.ready = this.reset();
}

Sandbox.prototype = new events.EventEmitter();

Sandbox.prototype.execCommand = function(name, spec, session) {
    return this.ready.then(() => {
        return new Promise((resolve, reject) => {
            if (session.$cmdInfo) {
                spec = _.extend({}, spec, session.$cmdInfo);
                session.$cmdInfo = null;
            }
            id++;
            waitingForReply[id] = (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            };
            var scriptUrl = spec.scriptUrl;
            if (scriptUrl[0] === "/") {
                // TODO: replace with actual config dir
                scriptUrl = scriptUrl;
            }
            // This data can be requested as input in commands.json
            var inputs = {};
            for (var input in (spec.inputs || {})) {
                inputs[input] = require("./sandboxes").getInputable(session, input);
            }
            console.log('send exec request in ' + this.name);
            this.sandboxWorker.webContents.send('exec', {
                configDir: '/home/kiteeatingtree/.config/xenon',
                url: scriptUrl,
                data: _.extend({}, spec, {
                    path: session.filename,
                    inputs: inputs
                }),
                id: id,
                winId: windowId,
                name: this.name
            });
        });
    });
};

Sandbox.prototype.reset = function() {
    return new Promise((resolve) => {
        this.destroy();
        console.log("Opening hidden browser window");
        this.sandboxWorker = new BrowserWindow({
            width: 400,
            height: 400,
            show: false
        });
        this.sandboxWorker.loadURL(url.format({
            pathname: path.join(__dirname, '..', 'worker', 'worker.html'),
            protocol: 'file:',
            slashes: true
        }));
        this.sandboxWorker.webContents.openDevTools();
        
        this.sandboxWorker.webContents.on('did-finish-load', () => {
            resolve();
        });
        
        ipcRenderer.removeAllListeners(`${this.name}-api-request`);
        ipcRenderer.on(`${this.name}-api-request`, (event, data) => {
            console.log('got api request for: ' + data.module + ' in ' + this.name);
            const mod = require("./sandbox/" + data.module);
            
            if (!mod[data.call]) {
                return this.sandboxWorker.webContents.send('api-response', {
                    replyTo: data.id,
                    err: "No such method: " + mod
                });
            }
            mod[data.call].apply(mod, data.args).then(result => {
                this.sandboxWorker.webContents.send('api-response', {
                    replyTo: data.id,
                    result: result
                });
            }).catch(err => {
                this.sandboxWorker.webContents.send('api-response', {
                    replyTo: data.id,
                    err: err
                });
            });
        });
        
        ipcRenderer.removeAllListeners(`${this.name}-log`);
        ipcRenderer.on(`${this.name}-log`, (event, data) => {
            console[data.level]("[Sandbox]", data.message);
        });
        
        ipcRenderer.removeAllListeners(`${this.name}-results`);
        ipcRenderer.on(`${this.name}-results`, (event, data) => {
            console.log('got results in ' + this.name);
            const replyTo = data.replyTo;
            if (!replyTo) {
                return;
            }
            var err = data.err;
            var result = data.result;

            if (waitingForReply[replyTo]) {
                waitingForReply[replyTo](err, result);
                delete waitingForReply[replyTo];
            } else {
                console.error("Got response to unknown message id:", replyTo);
            }
        });
    });
};

Sandbox.prototype.destroy = function() {
    console.log('destroy sandbox');
    if (this.sandboxWorker) {
        this.sandboxWorker.webContents.removeAllListeners();
        this.sandboxWorker.close();
    }
};

module.exports = Sandbox;

