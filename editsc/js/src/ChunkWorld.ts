import BlockType from './Block';
import * as Block from './Block';
import {WorkerMsg} from './ChunkWorker';
import * as THREE from 'three';
import {StreamHelper} from './WorldFile';


const LittleEndian = true;


export default class ChunkWorld {
	chunks: Array<Chunk>;
	//arrayBuffer: ArrayBuffer;


	getBlockAt(x: number, y: number, z: number): number | undefined {
		const coords = getChunkCoords(x, z);
		const chunk = this.getChunkAt(x, z);

		if (chunk) {
			return chunk.getBlock(getBlockIndex(
				coords.blockZ, y, coords.blockX
			));
		}

		return undefined;
	}


	setBlockAt(x: number, y: number, z: number, value: number) {
		const coords = getChunkCoords(x, z);
		const chunk = this.getChunkAt(x, z);

		if (chunk) {
			chunk.setBlock(getBlockIndex(
				coords.blockZ, y, coords.blockX
			), value);
		}
	}


	fillBlocks(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, value: number) {
		// Make point 1 corrdinates less than point 2
		let tmp = 0;
		if (x1 > x2) {
			tmp = x1;
			x1 = x2;
			x2 = tmp;
		}
		if (y1 > y2) {
			tmp = y1;
			y1 = y2;
			y2 = tmp;
		}
		if (z1 > z2) {
			tmp = z1;
			z1 = z2;
			z2 = tmp;
		}

		const height = y2 - y1;

		for (let x = x1; x <= x2; x++) {
		for (let z = z1; z <= z2; z++) {
			this.fillBlocksAtPoint(x, z, y1, height, value);
		}}
	}


	fillBlocksAtPoint(x: number, z: number, startY: number, amount: number, value: number) {
		const coords = getChunkCoords(x, z);
		const chunk = this.getChunkAt(x, z);

		chunk!.fillBlocksByIndex(
			getBlockIndex(coords.blockZ, startY, coords.blockX),
			amount, value
		);
	}


	getChunkAt(x: number, z: number): Chunk | undefined {
		const coords = getChunkCoords(x, z);

		for (let chunk of this.chunks) {
			const xIsCorrect = chunk.x == (x - coords.blockX)/16
			const zIsCorrect = chunk.z == (z - coords.blockZ)/16

			if (xIsCorrect && zIsCorrect) {
				return chunk;
			}
		}

		return undefined;
	}


	constructor() {
		this.chunks = [];
		//this.arrayBuffer = new ArrayBuffer(0);
	}


	async createBlob(): Promise<Blob> {
		const promises: Array<Promise<ArrayBuffer>> = [];
		promises.push(this.createDirectoryBuffer());
		for (const chunk of this.chunks) {
			promises.push(chunk.createArrayBuffer());
		}

		const buffers: Array<ArrayBuffer> = await Promise.all(promises);
		return new Blob(buffers);
	}


	async createDirectoryBuffer(): Promise<ArrayBuffer> {
		const buffer = new ArrayBuffer(65537 * 12);
		const view = new DataView(buffer);

		for (let i = 0; i < 65537; i++) {
			let x = 0;
			let z = 0;
			let index = -1;

			const chunk: Chunk | undefined = this.chunks[i];
			if (chunk) {
				x = chunk.x;
				z = chunk.z;
				index = i;
			}

			view.setInt32(i*12 + 0, x, LittleEndian);
			view.setInt32(i*12 + 4, z, LittleEndian);
			view.setInt32(i*12 + 8, index, LittleEndian);
		}

		return buffer;
	}


	async loadStreamHelper(streamHelper: StreamHelper): Promise<void> {
		const streamHelperHelper = new StreamHelperHelper(streamHelper);
		console.log('aa0');

		// Directory (ignored)
		await streamHelperHelper.read(786444);
		console.log('aa1');

		// Each chunk is 263184 bytes long
		while (true) {
			const header: ArrayBuffer = await streamHelperHelper.read(16);
			const blocks: ArrayBuffer = await streamHelperHelper.read(262144);
			const surface: ArrayBuffer = await streamHelperHelper.read(1024);
			if (streamHelperHelper.end) {
				break;
			}
			console.log('aa2');
			this.chunks.push(new Chunk(header, blocks, surface));
			console.log(this.chunks.length);
		}
		//await this.loadArrayBuffer(await streamHelperHelper.getAll());
	}
}


class StreamHelperHelper {
	streamHelper: StreamHelper;
	end: boolean;
	private collectedData: Array<Uint8Array>;
	private dataCallback: () => void;
	private endCallback: () => void;

	constructor(streamHelper: StreamHelper) {
		this.streamHelper = streamHelper;
		this.collectedData = [];
		this.end = false;
		this.dataCallback = () => {};
		this.endCallback = () => {};

		this.streamHelper.on('end', () => {
			this.end = true;
			this.endCallback();
		});
		this.streamHelper.on('data', (data: ArrayBuffer, meta: any) => {
			console.log(meta);
			this.streamHelper.pause();
			this.collectedData.push(new Uint8Array(data));
			this.dataCallback();
		});
	}

	async read(amount: number): Promise<ArrayBuffer> {
		//console.log('q0');
		await this.collectBytes(amount);
		//console.log('q1');
		if (this.end) {
			//console.log('q2');
			return new ArrayBuffer(0);
		}
		const result = new Uint8Array(amount);

		let offset = 0;
		let index = 0;
		for (const arr of this.collectedData) {
			//console.log('q3');
			//console.log(arr);
			if (offset + arr.length > amount) {
				break;
			}
			result.set(arr, offset);
			offset += arr.length;
			index++;
		}
		//console.log('q4');

		this.collectedData.splice(0, index);
		const arr: Uint8Array | undefined = this.collectedData[0];
		if (arr) {
			//console.log('q5');
			const remainingBytesNeeded: number = amount - offset;
			result.set(arr.subarray(0, remainingBytesNeeded), offset);
			this.collectedData[0]! = arr.subarray(remainingBytesNeeded);
		}

		//console.log('q6');
		//console.log(result);
		return result.buffer;
	}

	private get collectedBytes(): number {
		let result = 0;
		for (const arr of this.collectedData) {
			result += arr.length;
		}
		return result;
	}

	async collectBytes(amount: number) {
		while (this.collectedBytes < amount) {
			//console.log('ea0');
			const promise: Promise<void> = new Promise(resolve => {
				this.dataCallback = resolve;
				this.endCallback = resolve;
			});
			//console.log('ea1');
			this.streamHelper.resume();
			//console.log('ea2');
			if (this.end) {
				return;
			}
			//console.log('ea3');
			await promise;
			//console.log('ea4');
		}
	}
}


export class Chunk {
	x: number;
	z: number;
	blocks: DataView;
	surface: DataView; // Contains temp and humidity


	async createWorker(): Promise<Worker> {
		const worker = new Worker("../static/ChunkWorker.js");
		const message: WorkerMsg = {
			kind: 'init',
			blockData: this.blocks,
		};
		worker.postMessage(message);
		return worker;
	}


	getBlock(index: number): number | undefined {
		/*if (index < 0 || index > 65535) {
			throw "invalid block index: " + index
		}*/
		return this.blocks.getUint32(
			index << 2 // 4 * index
			, true // little endian
		);
	}


	setBlock(index: number, value: number) {
		this.blocks.setUint32(
			index << 2,
			value, true
		);
	}


	// coordinates 1 must be lower than coordinates 2
	fillBlocks(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, value: number) {
		const height = y2 - y1;
		for (let x = x1; x <= x2; x++) {
		for (let z = z1; z <= z2; z++) {
			const start = getBlockIndex(x, y1, z);
			this.fillBlocksByIndex(start, height, value);
		}}
	}


	fillBlocksByIndex(start: number, amount: number, value: number) {
		let index = start<<2;
		for (let n = 0; n < amount; n++) {
			this.blocks.setUint32(index, value, true);
			index += 4;
		}
	}


	/*
	blockFaces returns a bit mask with 1 << Block.Face. For example:
	0b111001
	has 0, 3, 4, and 5, or +x, -x, -y, and -z
	(see the enum Block.Face in Block.ts)
	*/
	blockFaces(
		condition: (block: number) => boolean,
		x: number, y: number, z: number
	): number {
		//return y + (x << 8) + (z << 12);
		let result = 0;

		for (let facei = 0; facei < 6; facei++) {
			//const face = facei as Block.Face;
			const vector: THREE.Vector3 = Block.faceVectors[facei as Block.Face];
			const ox = x + vector.x;
			const oy = y + vector.y;
			const oz = z + vector.z;
			//face.z *= -1;
			if (!inChunkBounds(ox, oy, oz)) {
				//result.push(face);
				result = result | (1<<facei);
				continue;
			}
			//const otherIndex: number = getBlockIndex(ox, oy, oz);
			//const otherBlock: number = this.getBlock(otherIndex)!;
			const otherBlock: number = this.getBlock(
				getBlockIndex(ox, oy, oz)
			)!;
			if (!condition(otherBlock)) {
				result = result | (1<<facei);
				//result.push(face);
			}
		}

		return result;
	}


	// Return true if any blocks satisfies the condition
	async any(condition: (block: number) => boolean): Promise<boolean> {
		for (let i = 0; i < 65536; i++) {
			if (condition(this.getBlock(i)!)) {
				return true;
			}
		}
		return false;
	}


	// Count the number of blocks that satisfy a condition.
	async count(condition: (block: number) => boolean): Promise<number> {
		let result = 0;
		for (let i = 0; i < 65536; i++) {
			if (condition(this.getBlock(i)!)) {
				result++;
			}
		}
		return result;
	}


	// Like count() but counts the amount of visible block faces
	async countFaces(condition: (block: number) => boolean): Promise<number> {
		let result = 0;

		for (let facei = 0; facei < 6; facei++) {
			const vector = Block.faceVectors[facei as Block.Face];
			await this.iterBlocks((block, x, y, z) => {
				const ox = x + vector.x;
				const oy = y + vector.y;
				const oz = z + vector.z;
				if (!inChunkBounds(ox, oy, oz)) {
					result++;
					return;
				}
				const blockIndex: number = getBlockIndex(ox, oy, oz);
				if (!condition(this.getBlock(blockIndex)!)) {
					result++;
				}
			}, condition);
		}

		return result;
	}


	async iterBlocks(
		callback: (value: number, x: number, y: number, z: number) => void,
		condition = (anyBlock: number) => true,
	) {
		/*for (let x = 0; x < 4096; x+=256) {
		for (let y = 0; y < 256; y++) {
		for (let z = 0; z < 65536; z+=4096) {
			const block: number = this.getBlock(x + y + z)!;
			if (condition(block)) {
				callback(block, x>>8, y, z>>12);
			}
		}}}*/
		for (let i = 0; i < 65536; i++) {
			const block: number = this.getBlock(i)!;
			if (condition(block)) {
				// Coordinates are extracted from block index
				callback(block, (i>>8)&15, i&255, (i>>12)&15);
			}
		}
	}


	constructor(header: ArrayBuffer, blocks: ArrayBuffer, surface: ArrayBuffer) {
		// Magic numbers
		const headerView = new DataView(header);
		let magicNums = [
			headerView.getUint32(0, LittleEndian),
			headerView.getUint32(4, LittleEndian),
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
		this.x = headerView.getInt32(8, LittleEndian);
		this.z = headerView.getInt32(12, LittleEndian);

		// Blocks
		this.blocks = new DataView(blocks);

		// Surface
		this.surface = new DataView(surface);
	}


	async createArrayBuffer(): Promise<ArrayBuffer> {
		const buffer = new ArrayBuffer(263184);
		const arr = new Uint8Array(buffer);
		const view = new DataView(buffer);

		// Header
		view.setUint32(0, 0xDEADBEEF, LittleEndian);
		view.setUint32(4, 0xFFFFFFFE, LittleEndian);
		view.setInt32(8, this.x, LittleEndian);
		view.setInt32(12, this.z, LittleEndian);

		// Blocks
		const blockArr = new Uint8Array(this.blocks.buffer);
		arr.set(blockArr, 16);

		// Surface
		const surfaceArr = new Uint8Array(this.surface.buffer);
		arr.set(surfaceArr, 262160);

		return buffer;
	}
}



function getBlockIndex(x: number, y: number, z: number): number {
	// y + x*256 + z*256*16
	return (y) + (x <<8) + (z <<12);
}


function inChunkBounds(x: number, y: number, z: number): boolean {
	if (x < 0) { return false; }
	if (z < 0) { return false; }
	if (x > 15) { return false; }
	if (z > 15) { return false; }
	if (y < 0) { return false; }
	if (y > 255) { return false; }
	return true;
}


function getChunkCoords(x: number, z: number): {
	blockX: number, // 0 to 15
	blockZ: number, // 0 to 15
} {
	while (x < 0) {
		x += 16;
	}
	while (z < 0) {
		z += 16;
	}
	return {
		blockX: (x) % 16,
		blockZ: (z) % 16,
	};
}
