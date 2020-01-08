const path = require('path'); 
module.exports = { 
  entry: "C:\\Users\\jeffl\\OneDrive\\University\\Modules\\Programming\\D3\\main\\src\\index.js", 
  output: {
    path: path.resolve('dist'), 
    filename: 'index_bundle.js' 
  }, 
  module: {
    rules: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ }
     ]
 	}
 }  