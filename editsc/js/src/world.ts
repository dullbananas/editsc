export class World {
	chunks: any[];


	constructor(struct: any) {
		this.chunks = struct.chunks.map(
			function(chunkStruct: any, index: number) {
				return new Chunk(chunkStruct, index);
			}
		);
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
