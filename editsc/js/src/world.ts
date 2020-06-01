import {blockTypes} from './blockType';
import * as blockType from './blockType';


const LittleEndian = true;


export class World {
	private chunks: Array<Chunk>;
	arrayBuffer: ArrayBuffer;


	constructor(arrayBuffer: ArrayBuffer | null) {
		this.chunks = [];

		switch (arrayBuffer) {
			case null:
				this.arrayBuffer = new ArrayBuffer(0);
				break;

			default:
				this.arrayBuffer = arrayBuffer;
				if ( ((arrayBuffer.byteLength - 786444) % 263184 ) != 0 ) {
					throw "Invalid world byte length: " + arrayBuffer.byteLength;
				}

				const chunkCount = (arrayBuffer.byteLength - 786444) / 263184;
				for (let i = 0; i < chunkCount; i++) {
					const offset = 786444 + (i * 263184);
					let newChunk = new Chunk(
						new DataView(this.arrayBuffer, offset, 263184)
					);
					this.chunks.push(newChunk);
				}
		}
	}


	chunkCount(): number {
		return this.chunks.length;
	}


	getChunk(i: number): Chunk | undefined {
		return this.chunks[i];
	}
}



export class Chunk {
	x: number;
	z: number;
	view: DataView; // References part of the world's ArrayBuffer


	getBlock(index: number): number | undefined {
		return this.view.getUint32(
			16 // Header size
			+ (4 * index)

			, LittleEndian
		);
	}


	// Count the number of blocks that satisfy a condition.
	count(condition: (block: number) => boolean): number {
		let result = 0;
		/*for (let i = 0; i < 65536; i++) {
			if (condition(this.getBlock(i)!)) {
				result++;
			}
		}*/
		this.forEach(function() {
			result++;
		}, condition);
		return result;
	}


	forEach(
		callback: (value: number, x: number, y: number, z: number) => void,
		condition = (anyBlock: number) => true,
	) {
		for (let x = 0; x < 16; x++) {
		for (let y = 0; y < 256; y++) {
		for (let z = 0; z < 16; z++) {
			const blockIndex: number = getBlockIndex(x, y, z);
			const block: number = this.getBlock(blockIndex)!;
			if (condition(block)) {
				callback(block, x, y, z);
			}
		}}}
	}


	constructor(view: DataView) {
		this.view = view;

		// Magic numbers
		let magicNums = [
			this.view.getUint32(0, LittleEndian),
			this.view.getUint32(4, LittleEndian),
		];
		const correctNums = [0xDEADBEEF, 0xFFFFFFFE];
		if (magicNums[0] != correctNums[0] || magicNums[1] != correctNums[1]) {
			throw "These magic numbers are incorrect: "
			+ magicNums[0]
			+ ", "
			+ magicNums[1];
			+ "; Correct numbers: "
			+ correctNums[0]
			+ ", "
			+ correctNums[1]
		}

		// Coordinates
		this.x = view.getInt32(8, LittleEndian);
		this.z = view.getInt32(12, LittleEndian);
	}
}



/*export function countFullBlocks(chunk: Chunk): number {
	let result = 0;
	for (let i = 0; i < 65536; i++) {
		if (isFullBlock(chunk.getBlock(i)!)) {
			result++;
		}
	}
	return result;
}*/


/*export function isFullBlock(b: number): boolean {
	return !(
	typeIs(b, 0) // air
	|| typeIs(b, 18) // water
	);
}*/


/*function typeIs(block: number, id: number): boolean {
	return getBlockType(block) === id;
}*/


export function getBlockIndex(x: number, y: number, z: number): number {
	return y + x * 256 + z * 256 * 16;
}


/*export function getBlockType(block: number): number {
	return block & 0b1111111111;
}*/
