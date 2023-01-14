const path = require('path')

module.exports = {
	entry: './src/index.ts',
	mode: "development",
	module: {
    	rules: [
    	    {
    	        test: /\.css/,
    	        use: ['style-loader', 'css-loader']
    	    },
    	    {
    	        test: /\.tsx?$/,
    	        use: 'ts-loader',
    	        exclude: /node_modules/
    	    },
			{
				test: /\.json/,
				type: 'asset/source'
			}
    	]
  	},
  	resolve: {
  		extensions: ['.tsx', '.ts', '.js', '.css']
  	},
  	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	}
}