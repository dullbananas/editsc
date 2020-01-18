// Decorator that caches function result
// Copied from https://dev.to/carlillo/understanding-javascripttypescript-memoization-o7k
export function memoize(fn) {
	const cache = {};
	return function(...args) {
		const strArgs = JSON.stringify(args);
		const result = (
			cache[strArgs] =
			typeof cache[strArgs] === 'undefined'
			? fn(...args)
			: cache[strArgs]
		);
		return result;
	}
}


// Maps x y and z values to block indexes in a multidimensional array
export var blockIndex = [];
for (var x = 0; x < 16; x++) {
	blockIndex.push([]);
	for (var y = 0; y < 256; y++) {
		blockIndex[x].push([]);
		for (var z = 0; z < 16; z++) {
			blockIndex[x][y].push([]);
			blockIndex[x][y][z] = y + x * 256 + z * 256 * 16;
		}
	}
}


// Gets type of block
function _bType(data: number) {
	return 0b1111111111 & data;
}
export const bType = memoize(_bType);
