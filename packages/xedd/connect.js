module.exports = function(socket) {
    console.log('A user connected');

    socket.on('join', (path) => {
        socket.join(path);
    });
};
