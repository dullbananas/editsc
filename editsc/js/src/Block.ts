import * as THREE from 'three';


export enum Face {
	PosX = 0,
	PosY = 1,
	PosZ = 2,
	NegX = 3,
	NegY = 4,
	NegZ = 5,
}

//export const faces = [PosX, PosY, PosZ, NegX, NegY, NegZ];


export const faceVectors: Record<Face, THREE.Vector3> = [
	new THREE.Vector3(0, 0, 1),
	new THREE.Vector3(0, 1, 0),
	new THREE.Vector3(1, 0, 0),
	new THREE.Vector3(0, 0, -1),
	new THREE.Vector3(0, -1, 0),
	new THREE.Vector3(-1, 0, 0),
];

const halfVectors: Record<Face, THREE.Vector3> = [
	new THREE.Vector3(0, 0, 0.5),
	new THREE.Vector3(0, 0.5, 0),
	new THREE.Vector3(0.5, 0, 0),
	new THREE.Vector3(0, 0, -0.5),
	new THREE.Vector3(0, -0.5, 0),
	new THREE.Vector3(-0.5, 0, 0),
];


const tmpObj = new THREE.Object3D();


const rotations: Array<THREE.Euler> = [];


for (let facei = 0; facei < 6; facei++) {
	const face = facei as Face;
	const vec = faceVectors[face];
	const hvec = halfVectors[face];
	//tmpObj.position.set(hvec.x, hvec.y, -hvec.z);
	tmpObj.position.set(0, 0, 0);
	tmpObj.lookAt(vec.x, vec.y, -vec.z);
	tmpObj.updateMatrix();
	rotations.push(tmpObj.rotation.clone());
	console.log(tmpObj.rotation);
}
console.log(rotations);


export function addFace(
	meshIndex: number,
	mesh: THREE.InstancedMesh,
	face: Face,
	x: number, y: number, z: number
) {
	const hvec = halfVectors[face];
	tmpObj.position.set(
		/*x + vec.x*0.5,
		y + vec.y*0.5,
		z - vec.z*0.5,*/
		x + hvec.x,
		y + hvec.y,
		z - hvec.z,
	);
	//const vec = faceVectors[face];
	//tmpObj.lookAt(vec.x+x, vec.y+y, -vec.z+z);
	tmpObj.rotation.copy(rotations[face]!);
	tmpObj.updateMatrix();
	mesh.setMatrixAt(meshIndex, tmpObj.matrix);
}


export default class BlockType {
	id: number;
	x: number;
	y: number;
	_color: number;
	texture: THREE.Texture;
	//matchesBlockValue: (block: number) => boolean;
	static all: Array<BlockType> = [];
	static textureLoader = new THREE.TextureLoader();

	constructor(id: number, x: number, y: number) {
		this.id = id;
		//this.matchesBlockValue = (block: number) => (block & 0b1111111111) === id;
		this.x = x;
		this.y = y;
		this._color = 0xffffff;
		BlockType.all.push(this);

		this.texture = BlockType.textureLoader.load("../static/blocks.png");
		this.texture.repeat.x = 1/16;
		this.texture.repeat.y = 1/16;
		this.texture.magFilter = THREE.NearestFilter;
		this.texture.offset.x = x/16;
		this.texture.offset.y = (15-y) / 16;
	}

	async chunkMesh(faceCount: number): Promise<THREE.InstancedMesh> {
		const geometry = new THREE.PlaneBufferGeometry(1, 1);
		const material = new THREE.MeshLambertMaterial({
			map: this.texture,
			color: new THREE.Color(this._color),
		});
		const mesh = new THREE.InstancedMesh(geometry, material, faceCount);
		mesh.frustumCulled = false;
		return mesh;
	}

	/*matchesBlockValue(block: number): boolean {
		/*console.log('maching');
		const id = (block & 0b1111111111);
		console.log('got id');
		const thisid = this.id;
		console.log('thisid');
		const result = id == thisid;
		console.log('mached');
		return result;* /
		return (block & 0b1111111111) == this.id;
	}*/

	color(color: number) {
		this._color = color;
		return this;
	}
}


function v(id: number, x: number, y: number) {
	return new BlockType(id, x,y);
}


const blockTypes: Record<string, BlockType|undefined> = {
	bedrock: v(1, 1,1),
	dirt: v(2, 2,0),
	granite: v(3, 1,0),
	grass: v(8, 0, 0).color(0x44dd44),
};
	/*v(9, 4, 1), // Oak wood
	v(10, 5, 7), // Bitch wood
	v(11, 4, 7), // Spruce wood
	v(12, 4, 3, 0x22dd22), // Oak leaves
	v(13, 4, 3, 0x44ff00), // Birch leaves
	v(14, 4, 8, 0x22cc22), // Spruce leaves
	v(15, 3, 4), // Glass
	v(16, 2, 2), // Coal ore
	*/
