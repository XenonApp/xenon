'use strict';

require('../config/api/zed');

var source;
var origin;
var id = 0;
var waitingForReply = {};

global.sandboxRequest = function(module, call, args) {
    return new Promise(function(resolve, reject) {
        id++;
        waitingForReply[id] = {
            resolve: resolve,
            reject: reject
        };
        source.postMessage({
            command: 'api-request',
            id: id,
            module: module,
            call: call,
            args: args
        }, origin);
    });
};

window.addEventListener('message', message => {
    source = message.source;
    origin = message.origin;
    if (message.data.command === 'exec') {
        exec(message);
    } else if (message.data.command === 'api-response') {
        apiResponse(message);
    }
});

function apiResponse(event) {
    const data = event.data;
    var p = waitingForReply[data.replyTo];

    if (undefined !== data.err && null !== data.err) {
        p.reject(data.err);
    } else {
        p.resolve(data.result);
    }
    delete waitingForReply[data.replyTo];
}

async function exec(event) {
    const data = event.data;
    const id = data.id;
    const url = data.url;

    if (!url) {
        return;
    }

    let fn;

    if (CHROME) {
        fn = require(`../config${url.slice(0, -3)}.js`);
    } else {
        try {
            fn = require(data.configDir + url);
        } catch (err) {
            fn = require('../config' + url);
        }
    }

    if (data.fn) {
        fn = fn[data.fn];
    }

    Promise.resolve(data.data).then(fn).then(result => {
        var message = {
            command: 'results',
            replyTo: id,
            result: result
        };
        event.source.postMessage(message, event.origin);
    }).catch(err => {
        console.error(err);
        var message = {
            command: 'results',
            replyTo: id,
            err: err.toString()
        };
        event.source.postMessage(message, event.origin);
    });
}
