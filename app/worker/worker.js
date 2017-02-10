'use strict';

const {ipcRenderer, remote} = require('electron');
const BrowserWindow = remote.BrowserWindow;

const JSON5 = require('json5');

const debug = false;

let fromWindow;

// define("configfs", [], {
//     load: function(name, req, onload, config) {
//         sandboxRequest("zed/configfs", "readFile", [name]).then(function(text) {
//             onload.fromText(amdTransformer(name, text));
//         }, function(err) {
//             return console.error("Error while loading file", name, err);
//         });
//     }
// });

function absPath(abs, rel) {
    var absParts = abs.split('/');
    var relParts = rel.split('/');
    absParts.pop(); // dir
    for(var i = 0; i < relParts.length; i++) {
        if(relParts[i] === '.') {
            continue;
        }
        if(relParts[i] === '..') {
            absParts.pop();
            continue;
        }
        absParts = absParts.concat(relParts.slice(i));
        break;
    }
    return absParts.join('/');
}

/**
 * This rewrites extension code in two minor ways:
 * - requires are rewritten to all point to configfs!
 * - AMD wrappers are added if they're not already there'
 */
function amdTransformer(moduleAbsPath, source) {
    // If this source file is not doing funky stuff like overriding require
    if (!/require\s*=/.exec(source)) {
        source = source.replace(/require\s*\((["'])(.+)["']\)/g, function(all, q, mod) {
            var newMod = mod;
            if (mod.indexOf("zed/") === 0) {
                newMod = "configfs!/api/" + mod;
            } else if (mod.indexOf(".") === 0) {
                newMod = "configfs!" + absPath(moduleAbsPath, mod);
            } else {
                return all;
            }
            return "require(" + q + newMod + (/\.js$/.exec(newMod) ? "" : ".js") + q + ")";
        });
    }
    // If no AMD wrapper is there yet, add it
    if (source.indexOf("define(function(") === -1) {
        source = "define(function(require, exports, module) {" + source + "\n});";
    }
    return source;
}

var id = 0;
var waitingForReply = {};

self.sandboxRequest = function(module, call, args) {
    return new Promise(function(resolve, reject) {
        id++;
        waitingForReply[id] = {
            resolve: resolve,
            reject: reject
        };
        fromWindow.webContents.send('api-request', {
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
    fromWindow = BrowserWindow.fromId(data.winId);
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
        fromWindow.webContents.send('results', message);
    }).catch(err => {
        var message = {
            replyTo: id,
            err: err
        };
        console.log(message);
        fromWindow.webContents.send('results', message);
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
