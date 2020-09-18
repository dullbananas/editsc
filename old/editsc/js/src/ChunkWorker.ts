// This script runs in a worker


// To worker
export type WorkerMsg =
	| {
		kind: 'countFaces',
		condition: BlockCondition,
	}
	| {
		kind: 'any',
		condition: BlockCondition,
	}
	| {
		kind: 'getBlockFaces',
		condition: BlockCondition,
	}
	| {
		kind: 'init',
		blockData: DataView,
	};


function send(msg: any) {
	(self.postMessage as any)(msg);
}

function sendt(msg: any, transfer: Array<any>) {
	(self.postMessage as any)(msg, transfer);
}


const checkCondition = (condition: BlockCondition) => (block: number) => {
	return condition.blockId === (block & 0b1111111111);
}


export type BlockCondition = {
	blockId: number,
};


let view = new DataView(new ArrayBuffer(0));


self.onmessage = function(event: MessageEvent) {
	const msg = event.data as WorkerMsg;
	switch (msg.kind) {
		case 'countFaces':
			countFaces(msg.condition);
			break;

		case 'any':
			anyBlocks(msg.condition);
			break;

		case 'getBlockFaces':
			getBlockFaces(msg.condition);
			break;

		case 'init':
			view = msg.blockData;
			break;
	}
};


function getBlock(index: number): number | undefined {
	return view.getUint32(index<<2, true);
}


function iterBlocks(
	callback: (value: number, x: number, y: number, z: number) => void,
	condition: (block: number) => boolean,
) {
	for (let i = 0; i < 65536; i++) {
		const block: number = getBlock(i)!;
		if(condition(block)) {
			// Coordinates are extracted from block index
			callback(block, (i>>8)&15, i&255, (i>>12)&15);
		}
	}
}


type Vector = { x: number, y: number, z: number };


const faceVectors: Array<Vector> = [
	{ x: 0, y: 0, z: 1 },
	{ x: 0, y: 1, z: 0 },
	{ x: 1, y: 0, z: 0 },
	{ x: 0, y: 0, z: -1 },
	{ x: 0, y: -1, z: 0 },
	{ x: -1, y: 0, z: 0 },
];


function countFaces(condition: BlockCondition) {
	let result = 0;
	const isCorrectBlock = checkCondition(condition);
	for (const vector of faceVectors) {
		iterBlocks((block, x, y, z) => {
			const ox = x + vector.x;
			const oy = y + vector.y;
			const oz = z + vector.z;
			if (!inChunkBounds(ox, oy, oz)) {
				result++;
				return;
			}
			const blockIndex: number = getBlockIndex(ox, oy, oz);
			if (!isCorrectBlock(getBlock(blockIndex)!)) {
				result++;
			}
		}, isCorrectBlock);
	}
	send(result);
}


function getBlockFaces(condition: BlockCondition) {
	const arr = new Uint8Array(65536);
	//let i = 0;
	const isCorrectBlock = checkCondition(condition);
	iterBlocks((block, x, y, z) => {
		let faces = 0b000000;
		for (let facei = 0; facei < 6; facei++) {
			const vector = faceVectors[facei]!;
			const ox = x + vector.x;
			const oy = y + vector.y;
			const oz = z + vector.z;
			if (!inChunkBounds(ox, oy, oz)) {
				faces = faces | (1<<facei);
				continue;
			}
			const otherBlock: number = getBlock(
				getBlockIndex(ox, oy, oz)
			)!;
			if (!isCorrectBlock(otherBlock)) {
				faces = faces | (1<<facei);
			}
		}
		arr[getBlockIndex(x, y, z)] = faces;
		//i++;
	}, isCorrectBlock);
	sendt(arr.buffer, [arr.buffer])
}


// Check if any blocks satisfy the condition
function anyBlocks(condition: BlockCondition) {
	const isCorrectBlock = checkCondition(condition);
	for (let i = 0; i < 65536; i++) {
		if (isCorrectBlock(getBlock(i)!)) {
			send(true);
			return;
		}
	}
	send(false);
}


function getBlockIndex(x: number, y: number, z: number): number {
	return (y) + (x<<8) + (z<<12);
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
