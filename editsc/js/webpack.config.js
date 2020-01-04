const path = require('path');

module.exports = {
	entry: './src/main.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				include: path.resolve(__dirname, 'src'),
				exclude: path.resolve(__dirname, 'node_modules'),
			},
		],
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, '../static'),
	},
};
