export class World {
	chunks: Array<Chunk>;


	constructor(struct: any | null) {
		switch (struct) {
			case null:
				this.chunks = [];
				break;

			default:
				this.chunks = struct.chunks.map(
					function(chunkStruct: any, index: number) {
						return new Chunk(chunkStruct, index);
					}
				);
		}
	}
}



export class Chunk {
	index: number;
	x: number;
	z: number;
	surface: SurfacePoint[];
	blocks: Uint32Array;


	constructor(struct: any, index: number) {
		this.index = index;
		this.x = struct.header.xPosition;
		this.z = struct.header.zPosition;
		this.surface = struct.surface.map(
			function(surfacePoint: any, spIndex: number) {
				return new SurfacePoint(surfacePoint, spIndex);
			}
		);
		this.blocks = Uint32Array.from(struct.blocks);
	}
}



export class SurfacePoint {
	index: number;
	maxHeight: number;
	tempHumidity: number;


	constructor(struct: any, index: number) {
		this.index = index;
		this.maxHeight = struct.maxheight;
		this.tempHumidity = struct.tempHumidity;
	}
}



// Combines multiple Uint8Array objects to a single Uint8Array
function combineArrays(arrays: Uint8Array[]): Uint8Array {
	let totalLength = arrays.reduce(
		(acc: number, value: Uint8Array) => acc + value.length, 0
	);
	let result: Uint8Array = new Uint8Array(totalLength);

	let position = 0;
	for (let array of arrays) {
		result.set(array, position);
		position += array.length;
	}

	return result;
}


export function countFullBlocks(blocks: Uint32Array): number {
	return blocks.filter(
		(block: number, index: number, arr: Uint32Array) =>
			isFullBlock(block)
	).length;
}


export function isFullBlock(block: number): boolean {
	return getBlockType(block) != 0;
}


export function getBlockIndex(x: number, y: number, z: number): number {
	return y + x * 256 + z * 256 * 16;
}


function getBlockType(block: number): number {
	return block & 0b1111111111;
}
