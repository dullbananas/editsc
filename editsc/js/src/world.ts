import {blockTypes} from './blockType';
import * as blockType from './blockType';
import * as geometry from './geometry';
import * as THREE from 'three';


const LittleEndian = true;


export class World {
	private chunks: Array<Chunk>;
	readonly chunkLength: number;
	arrayBuffer: ArrayBuffer;


	constructor(arrayBuffer: ArrayBuffer | null) {
		this.chunks = [];

		switch (arrayBuffer) {
			case null:
				this.arrayBuffer = new ArrayBuffer(0);
				this.chunkLength = 0;
				break;

			default:
				this.arrayBuffer = arrayBuffer;
				if ( ((arrayBuffer.byteLength - 786444) % 263184 ) != 0 ) {
					throw "Invalid world byte length: " + arrayBuffer.byteLength;
				}

				//const chunkCount = (arrayBuffer.byteLength - 786444) / 263184;
				this.chunkLength = (arrayBuffer.byteLength - 786444) / 263184;
				for (let i = 0; i < this.chunkLength; i++) {
					const offset = 786444 + (i * 263184);
					let newChunk = new Chunk(
						new DataView(this.arrayBuffer, offset, 263184)
					);
					this.chunks.push(newChunk);
				}
		}
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
		/*if (index < 0 || index > 65535) {
			throw "invalid block index: " + index
		}*/
		return this.view.getUint32(
			16 // <- Header size
			//+ (4 * index)
			+ (index << 2)
			//, LittleEndian
			, true
		);
	}


	blockFaces(
		condition: (block: number) => boolean,
		x: number, y: number, z: number
	): Array<THREE.Vector3> {
		let result: Array<THREE.Vector3> = [];

		geometry.allFaces.forEach((face) => {
			const ox = x + face.x;
			const oy = y + face.y;
			const oz = z + face.z;
			face.z *= -1;
			if (!inChunkBounds(ox, oy, oz)) {
				result.push(face);
				return;
			}
			const otherIndex: number = getBlockIndex(ox, oy, oz);
			const otherBlock: number = this.getBlock(otherIndex)!;
			if (!condition(otherBlock)) {
				result.push(face);
			}
		});

		return result;
	}


	// Count the number of blocks that satisfy a condition.
	count(condition: (block: number) => boolean): number {
		let result = 0;
		this.forEach(function() {
			result++;
		}, condition);
		return result;
	}


	// Like count() but counts the amount of visible block faces
	countFaces(condition: (block: number) => boolean): number {
		const faces: Array<[number, number, number]> = [
			[0, 0, -1],
			[0, 0, 1],
			[0, -1, 0],
			[0, 1, 0],
			[-1, 0, 0],
			[1, 0, 0],
		];
		let result = 0;

		this.forEach((block, x, y, z) => {
			faces.forEach((face) => {
				const ox = x + face[0];
				const oy = y + face[1];
				const oz = z + face[2];
				if (!inChunkBounds(ox, oy, oz)) {
					result++;
					return;
				}
				const blockIndex: number = getBlockIndex(ox, oy, oz);
				if (!condition(this.getBlock(blockIndex)!)) {
					result++;
				}
			});
		}, condition);

		return result;
	}


	forEach(
		callback: (value: number, x: number, y: number, z: number) => void,
		condition = (anyBlock: number) => true,
	) {
		//return y + (x << 8) + (z << 12);
		for (let x = 0; x < 16; x++) {
		for (let y = 0; y < 256; y++) {
		for (let z = 0; z < 16; z++) {
		/*for (let x = 0; x < (16<<8); x+=(1<<8)) {
		for (let y = 0; y < 256; y++) {
		for (let z = 0; z < (16<<12); z+=(1<<12)) {*/
			//const blockIndex: number = getBlockIndex(x, y, z);
			const block: number = this.getBlock(getBlockIndex(x, y, z))!;
			//const block: number = this.getBlock(x + y + z)!;
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



export function getBlockIndex(x: number, y: number, z: number): number {
	/*x = clamp(x, 0, 15);
	y = clamp(y, 0, 255);
	z = clamp(z, 0, 15);*/

	//return y + x * 256 + z * 256 * 16;
	//return y + x * 256 + z * 4096;
	/*if (!inChunkBounds(x, y, z)) {
		throw "invalid coordinates: " + x + ", " + y + ", " + z;
	}*/
	return y + (x << 8) + (z << 12);
}


export function inChunkBounds(x: number, y: number, z: number): boolean {
	return clamp(x, 0, 15) == x && clamp(y, 0, 255) == y && clamp(z, 0, 15) == z;
}


function clamp(num: number, min: number, max: number): number {
	if (num > max) {
		return max;
	}
	if (num < min) {
		return min;
	}
	return num;
}
