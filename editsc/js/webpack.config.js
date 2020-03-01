const path = require('path');

module.exports = {
	entry: './src/main.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				include: path.resolve(__dirname, 'src'),
				exclude: [
					path.resolve(__dirname, 'node_modules'),
					path.resolve(__dirname, 'src/old'),
				],
			},
			{
				test: /\.elm?$/,
				include: path.resolve(__dirname, 'src'),
				exclude: path.resolve(__dirname, 'node_modules'),
				use: {
					loader: 'elm-webpack-loader',
				},
			}
		],
	},
	resolve: {
		extensions: [ /*'.tsx',*/ '.ts', '.js', '.elm' ],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, '../static'),
	},
};
