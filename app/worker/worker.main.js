'use strict';

const {ipcRenderer} = require('electron');
require('../config/api/zed');

const debug = false;

const queryVars = {};
const urlReq = global.location.search.substring(1);
const parts = urlReq.split("&");
parts.forEach(function(part) {
    var spl = part.split('=');
    queryVars[spl[0]] = decodeURIComponent(spl[1]);
});
const name = queryVars.name;

let id = 0;
let waitingForReply = {};

global.sandboxRequest = function(module, call, args) {
    return new Promise(function(resolve, reject) {
        id++;
        waitingForReply[id] = {
            resolve: resolve,
            reject: reject
        };
        
        ipcRenderer.send('sandbox-api-request', name, {
            id,
            module,
            call,
            args
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
        const message = {
            id,
            result
        };
        
        if (debug) {
            console.log(message);
        }
        
        ipcRenderer.send('sandbox-results', name, message);
    }).catch(err => {
        const message = {
            id,
            err
        };
        ipcRenderer.send('sandbox-results', name, message);
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