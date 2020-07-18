// Manages chunks in the world in a worker


export type MsgToChunkWorker =
	| {
		kind: 'getArrayBuffer',
	}
	| {
		kind: 'getDirectory',
	}
	| {
		kind: 'init',
		arrayBuffer: ArrayBuffer,
	};

export type MsgFromChunkWorker =
	| {
		kind: 'initError',
		error: any,
	}
	| {
		kind: 'gotArrayBuffer',
		arrayBuffer: ArrayBuffer,
	}
	| {
		kind: 'gotDirectory',
		entries: Array<DirectoryEntry>,
	}
	| {
		kind: 'initSuccess',
	};

function send(msg: MsgFromChunkWorker, transfer: Array<any> = []) {
	(self.postMessage as any)(msg, transfer);
}


export type DirectoryEntry = {
	x: number,
	z: number,
};


let arrayBuffer = new ArrayBuffer(0);
let dataView = new DataView(arrayBuffer);
let chunkCount = 0;


self.onmessage = (event: MessageEvent) => {
	const msg = event.data as MsgToChunkWorker;
	switch (msg.kind) {
		case 'getArrayBuffer':
			send({
				kind: 'gotArrayBuffer',
				arrayBuffer: arrayBuffer,
			});
			break;

		case 'getDirectory':
			send({
				kind: 'gotDirectory',
				entries: getDirectoryEntries(),
			});
			break;

		case 'getFacesById':
			const result = getFacesById(msg.typeId, msg.chunki, msg.fx, msg.fy, msg.fz);
			send({
				kind: 'gotFacesById',
				faces: result,
			}, [result]);
			break;

		case 'init':
			try {
				initArrayBuffer(msg.arrayBuffer);
				send({
					kind: 'initSuccess',
				});
			}
			catch (e) {
				send({
					kind: 'initError',
					error: e,
				})
			}
			break;
	}
};


getDirectoryEntries(): Array<DirectoryEntry> {
	for (let chunki = 0; chunki < chunkCount; chunki++) {
		const offset = 786444 + chunki*263184;
		const x = dataView.getInt32(8, true);
		const y = dataView.getUint32(12, true);
		return {x=x, y=y};
	}
}


initArrayBuffer(data: ArrayBuffer) {
	arrayBuffer = data;

	// Validate byte length
	if ( (arrayBuffer.byteLength-786444) % 263184 ) !== 0 ) {
		throw "Invalid byte length: " + arrayBuffer.byteLength;
	}

	dataView = new DataView(arrayBuffer);
	chunkCount = (arrayBuffer.byteLength-786444) / 263184;

	// Check magic numbers
	for (let chunki = 0; chunki < chunkCount; chunki++) {
		const offset = 786444 + chunki*263184;
		const magic1 = dataView.getUint32(offset, true);
		const msgic2 = dataView.getUint32(offset+4, true);
		if (magic1 !== 0xdeadbeef || magic2 !== 0xfffffffe) {
			throw "Chunk #"+chunki+" has invalid magic numbers";
		}
	}
}


function getBlockByIndex(chunki: number) {
	const startOffset = 786444 + 16 + chunki*263184;
	return (blocki: number): number => {
		return dataView.getUint32(
			startOffset + blocki*4,
			true // little endian
		);
	}
}


function blockIndexFromXyz(x: number, y: number, z: number): number {
	return y + (x<<8) + (z<<12);
}


function inChunkBounds(x: number, y: number, z: number): boolean {
	if (x < 0 || x > 15) {return false};
	if (z < 0 || z > 15) {return false};
	if (y < 0 || y > 255) {return false};
	return true;
}


// Get faces of blocks that have a specified type id. This function is run
// once per face direction. fx, fy, and fz must be -1, 0, or 1.
getFacesByTypeId(typeId: number, chunki: number, fx: number, fy: number, fz: number): Uint8Array {
	// 1 byte per face, each holding 0 or 1
	const arr = new Uint8Array(65536);
	const getBlock = getBlockByIndex(chunki);

	for (const blocki = 0; blocki < 65536; blocki++) {
		const block = getBlock(blocki);
		if (block & 0b1111111111 === typeId) {
			const x = (blocki>>8) & 15;
			const y = blocki & 255;
			const z = (blocki>>12) & 15;
			const otherx = x+fx;
			const othery = y+fy;
			const otherz = z+fz;
			if (!inChunkBounds(otherx, othery, otherz)) {
				arr[blocki] = 1;
				continue;
			}
			const otherblock = getBlock(blockIndexFromXyz(otherx, othery, otherz));
			if (otherblock & 0b1111111111 !== typeId) {
				arr[blocki] = 1;
			}
		}
	}
	return arr;
}
