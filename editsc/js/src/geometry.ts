import * as THREE from 'three';

import * as rendering from './rendering';
import {BlockType} from './blockType';
import * as blockType from './blockType';


// Holds matrix that will be applied to objects
let tmpObj = new THREE.Object3D();


let textureLoader = new THREE.TextureLoader();
//let texture = textureLoader.load("../static/blocks.png", rendering.forceRenderFrame);

function newTexture(btype: BlockType/*, onLoad: any*/): THREE.Texture {
	let result = textureLoader.load("../static/blocks.png", rendering.forceRenderFrame);
	//let result = texture.clone();
	//result.needsUpdate = true;

	result.repeat.x = result.repeat.y = 1/16;
	result.magFilter = THREE.NearestFilter; // pixelated appearane

	result.offset.x = btype.textureX / 16;
	result.offset.y = 15/16 - ( btype.textureY / 16 );

	//(result as any).updateM
	//result.needsUpdate = true;
	return result;
}


export const allFaces = [
	new THREE.Vector3(0, 0, -1),
	new THREE.Vector3(0, 0, 1),
	new THREE.Vector3(0, -1, 0),
	new THREE.Vector3(0, 1, 0),
	new THREE.Vector3(-1, 0, 0),
	new THREE.Vector3(1, 0, 0),
];


export function addFace(
	meshIndex: number,
	mesh: THREE.InstancedMesh,
	face: THREE.Vector3,
	x: number, y: number, z: number
) {
	tmpObj.position.set(
		x + face.x * 0.5,
		y + face.y * 0.5,
		z + face.z * 0.5,
	);
	//tmpObj.lookAt(face.x*2+x, face.y*2+y, face.z*2+z);
	tmpObj.lookAt(face.x+x, face.y+y, face.z+z);
	/*tmpObj.position.x += face.x * 0.5;
	tmpObj.position.y += face.y * 0.5;
	tmpObj.position.z += face.z * 0.5;*/
	tmpObj.updateMatrix();
	mesh.setMatrixAt(meshIndex, tmpObj.matrix);
}


export function voxelMesh(faceCount: number, btype: BlockType): THREE.InstancedMesh {
	const geometry = new THREE.PlaneBufferGeometry(1, 1);
	const material = new THREE.MeshLambertMaterial({
		map: newTexture(btype),
		color: btype.color,
		//side: THREE.DoubleSide,
	});
	let mesh = new THREE.InstancedMesh(geometry, material, faceCount);
	mesh.frustumCulled = false;
	return mesh;
}
