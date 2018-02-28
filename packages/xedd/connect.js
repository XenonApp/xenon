const path = require('path');
const XFS = require('@xenonapp/xfs');

module.exports = function(io, config) {
    const root = path.resolve(config.get('root'));

    if (config.get('user') || config.get('pass')) {
        const user = config.get('user');
        const pass = config.get('pass');
        const base64 = new Buffer(`${user}:${pass}`).toString('base64');

        io.use((socket, next) => {
            if (socket.handshake.query.auth !== base64) {
                return next(new Error('Unauthorized'));
            }
            next();
        });
    }

    io.use((socket, next) => {
        try {
            const dir = socket.handshake.query.path;
            socket.xfs = new XFS(root + dir);
            socket.listeners = {
                add: null,
                change: null,
                unlink: null
            };
            next();
        } catch (err) {
            console.error(err);
            next(err);
        }
    });

    io.on('connect', (socket) => {
        console.log('A user connected');

        socket.on('filelist', cb => {
            socket.xfs.listFiles()
                .then(results => cb(null, results))
                .catch(err => cb(err));
        });

        socket.on('readFile', (file, binary, cb) => {
            socket.xfs.readFile(file, binary)
                .then(results => cb(null, results))
                .catch(err => cb(err));
        });

        socket.on('writeFile', (file, content, binary, cb) => {
            socket.xfs.writeFile(file, content, binary)
                .then(results => cb(null, results))
                .catch(err => cb(err));
        });

        socket.on('deleteFile', (file, cb) => {
            socket.xfs.deleteFile(file)
                .then(results => cb(null, results))
                .catch(err => cb(err));
        });

        socket.on('watch', (ignored) => {
            socket.xfs.watch(ignored);
        });

        socket.on('on', event => {
            if (!socket.listeners[event]) {
                socket.listeners[event] = function(path) {
                    socket.emit(event, path);
                };
                socket.xfs.on(event, socket.listeners[event]);
            }
            if (!socket.xfs.listeners[event].length) {
                socket.xfs.on(event, path => socket.emit(event, path));
            }
        });

        socket.on('off', event => {
            if (socket.listeners[event]) {
                socket.xfs.off(event, socket.listeners[event]);
                socket.listeners[event] = null;
            }
        });
    });
};
