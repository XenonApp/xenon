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
 
const fork = require('child_process').fork;
const path = require('path');
 
var id = 0;
var waitingForReply = {};

class Sandbox {
    constructor(name) {
        this.name = name;
        this.lastUse = Date.now();
        this.fork();
    }
    
    destroy() {
        console.log('destroy sandbox');
        if (this.childProcess) {
            this.childProcess.kill();
        }
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
            
            var scriptUrl = spec.scriptUrl;
            if (scriptUrl[0] === "/") {
                scriptUrl = scriptUrl;
            }
            
            // This data can be requested as input in commands.json
            var inputs = {};
            for (var input in (spec.inputs || {})) {
                inputs[input] = require("./sandboxes").getInputable(session, input);
            }
            
            this.childProcess.send({
                command: 'exec',
                // TODO: replace with actual config dir
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
    
    fork() {
        this.childProcess = fork(path.join(__dirname, '..', 'sandbox', 'sandbox'), [], {
            silent: true
        });
        
        this.childProcess.stdout.setEncoding('utf-8');
        this.childProcess.stdout.on('data', data => {
            console.log(data);
        });
        
        this.childProcess.stderr.setEncoding('utf-8');
        this.childProcess.stderr.on('data', data => {
            console.error(data);
        });
        
        this.childProcess.on('message', message => {
            if (message.command === 'api-request') {
                this.handleApiRequest(message);
            } else if (message.command === 'results') {
                this.handleResponse(message);
            }
        });
        
        this.childProcess.on('error', (err) => {
            console.error(err);
        });
        
        this.childProcess.on('exit', () => {
            console.log(`sandbox: ${this.name} exited`);
            this.fork();
        });
    }
    
    handleApiRequest(data) {
        const mod = require("./sandbox/" + data.module);
        
        if (!mod[data.call]) {
            return this.childProcess.send({
                message: 'api-response',
                replyTo: data.id,
                err: "No such method: " + mod
            });
        }
        mod[data.call].apply(mod, data.args).then(result => {
            this.childProcess.send({
                command: 'api-response',
                replyTo: data.id,
                result: result
            });
        }).catch(err => {
            this.childProcess.send({
                command: 'api-response',
                replyTo: data.id,
                err: err
            });
        });
    }
    
    handleResponse(data) {
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
    }
    
    reset() {
        this.destroy();
        this.fork();
    }
}

module.exports = Sandbox;

