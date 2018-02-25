const os = require('os');
const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin')

const outputPath = path.resolve(os.homedir(), 'Downloads', 'xenon', 'build');

module.exports = {
    entry: {
        boot: './src/js/boot.js',
        sandbox: './src/sandbox/sandbox.chrome.js'
    },
    output: {
        path: outputPath,
        filename: '[name].js'
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
    resolve: {
        extensions: ['.js', '.jsx', '.json']
    },
    devtool: 'source-map',
    plugins: [
        new webpack.DefinePlugin({
            CHROME: true
        }),
        new CleanWebpackPlugin(outputPath, { allowExternal: true })
    ]
};
