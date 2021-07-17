const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    // devtool: false,
    devtool: 'inline-cheap-source-map',
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
    ],
    devServer: {
        contentBase: './dist',
    },
};
