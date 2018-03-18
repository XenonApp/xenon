#!/usr/bin/env node

const http = require('http');
const socketIO = require('socket.io');
const https = require("https");
const pathlib = require("path");
const fs = require("fs");
const nconf = require("nconf");
const packageVersion = require('./package.json').version;
const connect = require('./socket');

let io;

/**
 * Options:
 * - user
 * - pass
 * - port
 * - remote
 * - enable-run
 * - root
 * - tls-key
 * - tls-cert
 */

var config = nconf.argv().env().file(process.env.HOME + "/.xeddrc").defaults({
    port: 7337,
    ip: "0.0.0.0",
    root: process.env.HOME || "/"
});

if (!config.get("user") && config.get("ip") === "0.0.0.0") {
    config.set("ip", "127.0.0.1");
}

var ROOT = pathlib.resolve(config.get("root"));
var enableRun = !config.get("remote") || config.get("enable-run");

const app = require('./express')(config);

switch (process.argv[2]) {
    case "--help":
        help();
        break;
    case "--version":
        version();
        break;
    default:
        start();
}

function help() {
    console.log(`
Xedd is the Xenon daemon used to edit files either locally or remotely using Xenon.
Options can be passed in either as environment variables, JSON config in
~/.xeddrc or as command line arguments prefixed with '--':

   user:       username to use for authentication (default: none)
   pass:       password to use for authentication (default: none)
   remote:     bind to 0.0.0.0, requires auth, and disables
               enable-run by default
   port:       port to bind to (default: 7337)
   root:       root directory to expose (default: $HOME)
   enable-run: enable running of external programs in remote mode
   tls-key:    path to TLS key file (enables https)
   tls-cert:   path to TLS certificate file (enables https)
    `);
}

function version() {
    console.log(`Xedd version ${packageVersion}`);
}

function start() {
    var server, isSecure;
    var bindIp = config.get("remote") ? "0.0.0.0" : "127.0.0.1";
    var bindPort = config.get("port");
    if (config.get("remote") && !config.get("user")) {
        console.error("In remote mode, --user and --pass need to be specified.");
        process.exit(1);
    }
    if (config.get("tls-key") && config.get("tls-cert")) {
        server = https.createServer({
            key: fs.readFileSync(config.get("tls-key")),
            cert: fs.readFileSync(config.get("tls-cert"))
        }, app);
        isSecure = true;
    } else {
        server = http.createServer(app);
        isSecure = false;
    }

    io = socketIO(server);
    connect(io, config);

    server.listen(bindPort, bindIp);
    server.on('error', function() {
        console.error('ERROR: Could not listen on port', bindPort, 'is xedd already running?');
        process.exit(2);
    });

    console.log(`
Xedd is now listening on ${isSecure ? 'https' : 'http'} ://${bindIp}:${bindPort}
Exposed filesystem : ${ROOT},
Mode               : ${config.get('remote') ? 'remote (externally accessible)' : 'local'}
Command execution  : ${enableRun ? 'enabled' : 'disabled'}
Authentication     : ${config.get('user') ? 'enabled' : 'disabled'}
    `);
}
