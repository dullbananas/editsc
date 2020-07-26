import * as THREE from 'three';

import {BlockCondition} from './ChunkWorker';


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
const tmpObjs: Array<THREE.Object3D> = [];


for (let facei = 0; facei < 6; facei++) {
	const face = facei as Face;
	const vec = faceVectors[face];
	const hvec = halfVectors[face];
	tmpObj.position.set(0, 0, 0);
	tmpObj.lookAt(vec.x, vec.y, -vec.z);
	tmpObj.updateMatrix();
	const newRotation = tmpObj.rotation.clone();
	rotations.push(newRotation);
	const newObj = new THREE.Object3D();
	newObj.rotation.copy(newRotation);
	newObj.updateMatrix();
	tmpObjs.push(newObj);
}
console.log(rotations);


export function addFace(
	meshIndex: number,
	mesh: THREE.InstancedMesh,
	face: Face,
	x: number, y: number, z: number
) {
	//const hvec = halfVectors[face];
	const obj = tmpObjs[face]!;
	obj.position.set(
		x,// + hvec.x,
		y,// + hvec.y,
		z,// - hvec.z,
	);
	obj.updateMatrix();
	mesh.setMatrixAt(meshIndex, obj.matrix);
}


const faceVertices = new THREE.BufferAttribute(
	new Float32Array([
		0.5, -0.5, 0.5,
		-0.5, -0.5, 0.5,
		0.5, 0.5, 0.5,
		-0.5, 0.5, 0.5,
	]), 3
);
const faceNormals = new THREE.BufferAttribute(
	new Float32Array([
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
	]), 3
);
const faceUvs = new THREE.BufferAttribute(
	new Float32Array([
		0, 1,
		1, 1,
		0, 0,
		1, 0,
	]), 2
);
const faceTriangles = [
	0, 2, 1,
	2, 3, 1,
];
function faceGeometry(): THREE.BufferGeometry {
	/*
	vertex indexes:
	3----2
	|    |
	|    |
	1----0
	+z is forward
	*/
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', faceVertices);
	geometry.setAttribute('normal', faceNormals);
	geometry.setAttribute('uv', faceUvs);
	geometry.setIndex(faceTriangles);
	return geometry;
}


export default class BlockType {
	id: number;
	condition: BlockCondition;
	x: number;
	y: number;
	_color: THREE.Color;
	texture: THREE.Texture;
	_transparent: boolean;
	//matchesBlockValue: (block: number) => boolean;
	static all: Array<BlockType> = [];
	static textureLoader = new THREE.TextureLoader();

	constructor(id: number, x: number, y: number) {
		this.id = id;
		this.condition = { blockId: id };
		//this.matchesBlockValue = (block: number) => (block & 0b1111111111) === id;
		this.x = x;
		this.y = y;
		this._color = new THREE.Color(0xffffff);
		this._transparent = false;
		BlockType.all.push(this);

		this.texture = BlockType.textureLoader.load("../static/blocks.png");
		this.texture.repeat.x = 1/16;
		this.texture.repeat.y = 1/16;
		this.texture.magFilter = THREE.NearestFilter;
		this.texture.offset.x = x/16;
		this.texture.offset.y = (15-y) / 16;
	}

	async chunkMesh(faceCount: number): Promise<THREE.InstancedMesh> {
		const geometry: THREE.BufferGeometry = faceGeometry();
		const material = new THREE.MeshLambertMaterial({
			map: this.texture,
			color: this._color,
			transparent: this._transparent,
		});
		const mesh = new THREE.InstancedMesh(geometry, material, faceCount);
		mesh.frustumCulled = false;
		return mesh;
	}

	transparent() {
		this._transparent = true;
		return this;
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
		this._color = new THREE.Color(color);
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
	sandstone: v(4, 0,11),
	cobblestone: v(5, 0,1),
	gravel: v(6, 3,1),
	sand: v(7, 2,1),
	grass: v(8, 0,0).color(0x44dd44),
	//oakWood: v(9, 4,1),
	//bitchWood: v(10, 5,7),
	//spruceWood: v(11, 4,7),
	oakLeaves: v(12, 4,3).color(0x22dd22),
	birtchLeaves: v(13, 4,3).color(0x44ff00),
	spruceLeaves: v(14, 4,8).color(0x22cc22),
	glass: v(15, 3,4).transparent(),
	coalOre: v(16, 2,2),
	wickerLamp: v(17, 4,13).transparent(),
	planks: v(21, 4,0),
	basalt: v(67, 6,0),
	marble: v(68, 7,0),
	clay: v(72, 8,0),
	brickWall: v(73, 6,4),
};
