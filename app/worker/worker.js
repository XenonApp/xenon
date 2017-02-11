'use strict';

const {ipcRenderer, remote} = require('electron');
const BrowserWindow = remote.BrowserWindow;
require('../config/api/zed');

const debug = false;

let fromWindow;
let name;

var id = 0;
var waitingForReply = {};

global.sandboxRequest = function(module, call, args) {
    console.log('send sandbox request');
    return new Promise(function(resolve, reject) {
        id++;
        waitingForReply[id] = {
            resolve: resolve,
            reject: reject
        };
        fromWindow.webContents.send(`${name}-api-request`, {
            id: id,
            module: module,
            call: call,
            args: args
        });
    });
};

ipcRenderer.on('api-response', (event, data) => {
    var p = waitingForReply[data.replyTo];

    if (undefined !== data.err && null !== data.err) {
        p.reject(data.err);
    } else {
        p.resolve(data.result);
    }
    delete waitingForReply[data.replyTo];
});

ipcRenderer.on('exec', (event, data) => {
    console.log('exec received');
    name = data.name;
    fromWindow = BrowserWindow.fromId(data.winId);
    const id = data.id;
    const url = data.url;
    
    if (!url) {
        return;
    }

    let fn;
    
    console.log(url);
    try {
        fn = require(data.configDir + url);
    } catch (err) {
        fn = require('../config' + url);
    }
    
    console.log(fn);
    
    Promise.resolve(data.data).then(fn).then(result => {
        var message = {
            replyTo: id,
            result: result
        };
        if (debug) {
            console.log(message);
        }
        console.log(message);
        fromWindow.webContents.send(`${name}-results`, message);
    }).catch(err => {
        var message = {
            replyTo: id,
            err: err
        };
        console.log(message);
        fromWindow.webContents.send(`${name}-results`, message);
    });
});

// Override console.log etc
// var oldLog = console.log;
// var oldWarn = console.warn;
// var oldError = console.info;
// var oldInfo = console.info;
// var noop = function() {};
// console.log = log("log", oldLog);
// console.warn = log("warn", oldWarn);
// console.error = log("error", oldError);
// console.info = log("info", oldInfo);

// onerror = function(err) {
//     log("error", noop)(err.message, err.filename, err.lineno, err.stack);
// };

// function log(level, oldFn) {
//     function toLogEntry(args) {
//         var s = '';
//         _.each(args, function(arg) {
//             if (_.isString(arg)) {
//                 s += arg;
//             } else {
//                 s += JSON5.stringify(arg, null, 2);
//             }
//             s += ' ';
//         });
//         return s;
//     }
//     return function() {
//         const focusedWin = BrowserWindow.getFocusedWindow();
//         if (focusedWin) {
//             BrowserWindow.getFocusedWindow().webContents.send('log', {
//                 level: level,
//                 message: toLogEntry(arguments)
//             });
//         } else {
//             oldFn(toLogEntry(arguments));
//         }
//     };
// }