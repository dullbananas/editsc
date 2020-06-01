import * as THREE from 'three';

import * as rendering from './rendering';
import {BlockType} from './blockType';
import * as blockType from './blockType';


// Holds matrix that will be applied to objects
let tmpObj = new THREE.Object3D();


let textureLoader = new THREE.TextureLoader();
/*let texture = textureLoader.load("../static/blocks.png");
texture.repeat.x = texture.repeat.y = 1/16;
texture.magFilter = THREE.NearestFilter; // pixelated appearane*/

function newTexture(btype: BlockType, onLoad: any): THREE.Texture {
	//let result = texture.clone();
	let result = textureLoader.load("../static/blocks.png", onLoad);
	result.repeat.x = result.repeat.y = 1/16;
	result.magFilter = THREE.NearestFilter; // pixelated appearane

	result.offset.x = btype.textureX / 16;
	result.offset.y = 15/16 - ( btype.textureY / 16 );
	return result;
}


export function addVoxel(
	meshIndex: number,
	mesh: THREE.InstancedMesh,
	x: number, y: number, z: number
) {
	tmpObj.position.set(x, y, z);
	tmpObj.updateMatrix();
	mesh.setMatrixAt(meshIndex, tmpObj.matrix);
}


export function voxelMesh(count: number, btype: BlockType): THREE.InstancedMesh {
	const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
	const material = new THREE.MeshLambertMaterial({
		map: newTexture(btype, rendering.forceRenderFrame),
		color: new THREE.Color(btype.color),
	});
	let mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.frustumCulled = false;
	return mesh;
}


/*export function faceGeometry(direction: THREE.Vector3): THREE.PlaneBufferGeometry {
}*/
