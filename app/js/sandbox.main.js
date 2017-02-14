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
 
const {ipcRenderer} = require('electron');
 
let id = 0;
let waitingForReply = {};

class Sandbox {
    constructor(name) {
        this.name = name;
        this.lastUse = Date.now();
        this.handleEvents();
    }
    
    destroy() {
        ipcRenderer.send('destroy-sandbox', this.name);
    }
    
    execCommand(name, spec, session) {
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
            
            let scriptUrl = spec.scriptUrl;
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
            ipcRenderer.send('exec-in-sandbox', this.name, {
                configDir: '/home/kiteeatingtree/.config/xenon',
                url: scriptUrl,
                data: _.extend({}, spec, {
                    path: session.filename,
                    inputs: inputs
                }),
                id: id
            });
        });
    }
    
    handleEvents() {
        ipcRenderer.on('sandbox-api-request', (event, data) => {
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
        
        ipcRenderer.on('sandbox-log', (event, data) => {
            console[data.level]("[Sandbox]", data.message);
        });
        
        ipcRenderer.on('sandbox-results', (event, name, data) => {
            if (this.name !== name) {
                return;
            }
            
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
    }
}

module.exports = Sandbox;

