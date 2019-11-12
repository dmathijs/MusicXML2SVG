const path = require('path');

module.exports = {
  entry: './index.js',
  watch: true,
  mode:'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'musicxml2svg.js'
  }
};