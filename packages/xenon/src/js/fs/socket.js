'use strict';

// TODO: fix this fs
const axios = require('axios');
const io = require('socket.io-client');
const history = require('../history');

module.exports = function plugin(options) {
    const url = options.url;
    const path = options.path;
    const user = options.user;
    const password = options.password;
    const keep = options.keep;

    const auth = {
        username: user,
        password: password
    };

    let capabilities = {};

    const listeners = {
        add: [],
        change: [],
        unlink: []
    };

    const socket = io(url, {
        query: {
            path,
            auth: new Buffer(`${user}:${password}`).toString('base64')
        }
    });


    if (keep) {
        history.pushProject(`${url}${path}`, options.fullUrl);
    }

    axios.get(`${url}/capabilities`, { auth })
        .then(response => capabilities = response.data);

    socket.on('add', path => {
        listeners.add.forEach(listener => listener(path));
    });

    socket.on('change', path => {
        listeners.change.forEach(listener => listener(path));
    });

    socket.on('unlinke', path => {
        listeners.unlinke.forEach(listener => listener(path));
    });

    function promiseEmit(...args) {
        return new Promise((resolve, reject) => {
            args.push(function(err, data) {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
            socket.emit.apply(socket, args);
        });
    }

    function listFiles() {
        return promiseEmit('filelist');
    }

    function readFile(path, binary) {
        return promiseEmit('readFile', path, binary);
    }

    function writeFile(path, content, binary) {
        return promiseEmit('writeFile', path, content, binary);
    }

    function deleteFile(path) {
        return promiseEmit('deleteFile', path);
    }

    function run(command, stdin) {
        return promiseEmit('run', command, stdin);
    }

    function watch(ignored) {
        socket.emit('watch', ignored);
    }

    function on(event, listener) {
        if (listeners[event]) {
            listeners[event].push(listener);
            socket.emit('on', event);
        }
    }

    function off(event, listener) {
        if (listeners[event]) {
            const i = listeners[event].indexOf(listener);
            if (i > -1) {
                listeners[event].splice(i, 1);
            }
            if (listeners[event].length === 0) {
                socket.emit('off', event);
            }
        }
    }


    var api = {
        on,
        off,
        watch,
        listFiles,
        readFile,
        writeFile,
        deleteFile,
        getCapabilities: function() {
            return capabilities;
        },
        run
    };

    return api;
};
