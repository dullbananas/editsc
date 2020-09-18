// This script runs in a worker
function send(msg) {
    self.postMessage(msg);
}
function sendt(msg, transfer) {
    self.postMessage(msg, transfer);
}
const checkCondition = (condition) => (block) => {
    return condition.blockId === (block & 0b1111111111);
};
let view = new DataView(new ArrayBuffer(0));
self.onmessage = function (event) {
    const msg = event.data;
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
function getBlock(index) {
    return view.getUint32(index << 2, true);
}
function iterBlocks(callback, condition) {
    for (let i = 0; i < 65536; i++) {
        const block = getBlock(i);
        if (condition(block)) {
            // Coordinates are extracted from block index
            callback(block, (i >> 8) & 15, i & 255, (i >> 12) & 15);
        }
    }
}
const faceVectors = [
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: -1 },
    { x: 0, y: -1, z: 0 },
    { x: -1, y: 0, z: 0 },
];
function countFaces(condition) {
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
            const blockIndex = getBlockIndex(ox, oy, oz);
            if (!isCorrectBlock(getBlock(blockIndex))) {
                result++;
            }
        }, isCorrectBlock);
    }
    send(result);
}
function getBlockFaces(condition) {
    const arr = new Uint8Array(65536);
    //let i = 0;
    const isCorrectBlock = checkCondition(condition);
    iterBlocks((block, x, y, z) => {
        let faces = 0b000000;
        for (let facei = 0; facei < 6; facei++) {
            const vector = faceVectors[facei];
            const ox = x + vector.x;
            const oy = y + vector.y;
            const oz = z + vector.z;
            if (!inChunkBounds(ox, oy, oz)) {
                faces = faces | (1 << facei);
                continue;
            }
            const otherBlock = getBlock(getBlockIndex(ox, oy, oz));
            if (!isCorrectBlock(otherBlock)) {
                faces = faces | (1 << facei);
            }
        }
        arr[getBlockIndex(x, y, z)] = faces;
        //i++;
    }, isCorrectBlock);
    sendt(arr.buffer, [arr.buffer]);
}
// Check if any blocks satisfy the condition
function anyBlocks(condition) {
    const isCorrectBlock = checkCondition(condition);
    for (let i = 0; i < 65536; i++) {
        if (isCorrectBlock(getBlock(i))) {
            send(true);
            return;
        }
    }
    send(false);
}
function getBlockIndex(x, y, z) {
    return (y) + (x << 8) + (z << 12);
}
function inChunkBounds(x, y, z) {
    if (x < 0) {
        return false;
    }
    if (z < 0) {
        return false;
    }
    if (x > 15) {
        return false;
    }
    if (z > 15) {
        return false;
    }
    if (y < 0) {
        return false;
    }
    if (y > 255) {
        return false;
    }
    return true;
}
