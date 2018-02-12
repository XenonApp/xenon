const os = require('os');
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './js/boot.js',
    output: {
        path: path.resolve(os.homedir(), 'Downloads', 'xenon', 'build'),
        filename: 'boot.js'
    },
    module: {
        rules: [{
            test: /\.js$|\.jsx$/,
            exclude: /node_modules/,
            use: 'babel-loader'
        }, {
            test: /\.md$|\.html$/,
            use: 'raw-loader'
        }]
    },
    devtool: 'source-map',
    plugins: [
        new webpack.DefinePlugin({
            WEBPACK: true
        })
    ]
};
