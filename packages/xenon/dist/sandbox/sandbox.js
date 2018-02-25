'use strict';

require('../config/api/zed');

var id = 0;
var waitingForReply = {};

global.sandboxRequest = function (module, call, args) {
    return new Promise(function (resolve, reject) {
        id++;
        waitingForReply[id] = {
            resolve: resolve,
            reject: reject
        };
        process.send({
            command: 'api-request',
            id: id,
            module: module,
            call: call,
            args: args
        });
    });
};

process.on('message', message => {
    if (message.command === 'exec') {
        exec(message);
    } else if (message.command === 'api-response') {
        apiResponse(message);
    }
});

function apiResponse(data) {
    var p = waitingForReply[data.replyTo];

    if (undefined !== data.err && null !== data.err) {
        p.reject(data.err);
    } else {
        p.resolve(data.result);
    }
    delete waitingForReply[data.replyTo];
}

async function exec(data) {
    const id = data.id;
    const url = data.url;

    if (!url) {
        return;
    }

    let fn;

    try {
        fn = require(data.configDir + url);
    } catch (err) {
        fn = require('../config' + url);
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
        process.send(message);
    }).catch(err => {
        console.error(err);
        var message = {
            command: 'results',
            replyTo: id,
            err: err.toString()
        };
        process.send(message);
    });
}
//# sourceMappingURL=sandbox.js.map