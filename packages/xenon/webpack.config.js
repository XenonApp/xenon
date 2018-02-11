const path = require('path');

module.exports = {
    entry: './js/boot.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'boot.js'
    }
};