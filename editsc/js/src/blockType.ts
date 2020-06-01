export type BlockType =
	| {
		kind: 'voxel',
		id: number,
		textureX: number,
		textureY: number,
		color: number,
	};


export function isType(blockType: BlockType): (block: number) => boolean {
	return function(block: number) {
		return fromBlock(block) == blockType.id;
	}
}


export function fromBlock(block: number): number {
	return block & 0b1111111111;
}


function v(id: number, x: number, y: number, color = 0xffffff): BlockType {
	return {
		kind: 'voxel',
		id: id,
		textureX: x,
		textureY: y,
		color: color,
	};
}


export const blockTypes: Array<BlockType> = [
	v(1, 1, 1), // Bedrock
	v(2, 2, 0), // Dirt
	v(3, 1, 0), // Granite
	v(8, 0, 0, 0x44dd44), // Grass
	v(9, 4, 1), // Oak wood
	v(10, 5, 7), // Bitch wood
	v(11, 4, 7), // Spruce wood
	v(12, 4, 3, 0x22dd22), // Oak leaves
	v(13, 4, 3, 0x44ff00), // Birch leaves
	v(14, 4, 8, 0x22cc22), // Spruce leaves
	v(15, 3, 4), // Glass
	v(16, 2, 2), // Coal ore
];
