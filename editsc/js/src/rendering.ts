import * as THREE from 'three';

import * as main from './main';
import * as world from './world';



// Set up rendering


export let scene = new THREE.Scene();

scene.background = new THREE.Color(0x000000);
scene.autoUpdate = true;
scene.frustumCulled = false;


let camera = new THREE.PerspectiveCamera(
	75, // field of view
	window.innerWidth / window.innerHeight, // aspect ratio
	0.1, // near clipping plane
	128, // far clipping plane
);


let renderer = new THREE.WebGLRenderer({
	canvas: document.getElementById('world-canvas') as HTMLCanvasElement,
	stencil: false,
});

renderer.setSize(window.innerWidth, window.innerHeight);



// Voxel geometry and meshes


// I tried doing this thing where I render the 6 sizes of voxels separately so
// that I can hide faces that are hidden to improve performance. But I an just
// going to stop doing this fancy thing and save it for later to prevent
// further loss of brain cells.

/*type VoxelFace =
	| 'posX'
	| 'posY'
	| 'posZ'
	| 'negX'
	| 'negY'
	| 'negZ'
	;


/*
These vertices are defined in this order:
2----3
|  / |
| /  |
0----1
* /
const vertices: Record<VoxelFace, Float32Array> = {
	posX: new Float32Array([
		0.5, -0.5,  0.5,
		0.5, -0.5, -0.5,
		0.5,  0.5,  0.5,
		0.5,  0.5, -0.5,
	]),
	posY: new Float32Array([
		-0.5,  0.5,  0.5,
		 0.5,  0.5,  0.5,
		-0.5,  0.5, -0.5,
		 0.5,  0.5, -0.5,
	]),
	posZ: new Float32Array([
		-0.5, -0.5,  0.5,
		 0.5, -0.5,  0.5,
		-0.5,  0.5,  0.5,
		 0.5,  0.5,  0.5,
	]),
	negX: new Float32Array([
		-0.5, -0.5, -0.5,
		-0.5, -0.5,  0.5,
		-0.5,  0.5, -0.5,
		-0.5,  0.5,  0.5,
	]),
	negY: new Float32Array([
		 0.5, -0.5,  0.5,
		-0.5, -0.5,  0.5,
		 0.5, -0.5, -0.5,
		-0.5, -0.5, -0.5,
	]),
	negZ: new Float32Array([
		 0.5, -0.5, -0.5,
		-0.5, -0.5, -0.5,
		 0.5,  0.5, -0.5,
		-0.5,  0.5, -0.5,
	]),
};


// Uses the same vertex indices for each side of the voxels
const triangles = [
	0, 1, 3,
	0, 3, 2,
]*/


//let voxelGeometry = new THREE.BoxBufferGeometry(1, 1, 1);


let material = new THREE.MeshNormalMaterial();


/*function newVoxelMesh(count: number): THREE.InstancedMesh {
	let mesh = new THREE.InstancedMesh(voxelGeometry, material, count);
	mesh.frustumCulled = false;
	scene.add(mesh);
	return mesh;
}*/




function addVoxel(
	transform: THREE.Object3D,
	index: number,
	mesh: THREE.InstancedMesh,
	x: number,
	y: number,
	z: number,
) {
	transform.position.set(x, y, z);
	transform.updateMatrix();
	mesh.setMatrixAt(index, transform.matrix);
}


//let totalBlockCount = 0;

export function renderChunk(chunk: world.Chunk) {
	// Used to hold the matrix that will be applied to objects
	let transform = new THREE.Object3D();

	const blockCount: number = world.countFullBlocks(chunk.blocks);
	//totalBlockCount += blockCount;
	let voxelGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
	let mesh = new THREE.InstancedMesh(voxelGeometry, material, blockCount);
	mesh.frustumCulled = false;

	let meshIndex = 0;
	for (let x = 0; x < 16; x++) {
	for (let y = 0; y < 256; y++) {
	for (let z = 0; z < 16; z++) {
		const block: number = chunk.blocks[world.getBlockIndex(x, y, z)]!;
		if (world.isFullBlock(block)) {
			// These 2 lines of code are a result of painful trial and error.
			const blockX = (chunk.z * 16) + ((x-1) % 16);
			const blockZ = (chunk.x * -16) - ((z-1) % 16);

			addVoxel(
				transform,
				meshIndex,
				mesh,
				blockX,
				y,
				blockZ,
			);
			meshIndex++;
		}
	}}}
	scene.add(mesh);
}


export function initCameraPosition() {
	const chunk = main.world.chunks[0];

	if (chunk) {
		const x = chunk.x * 16;
		const z = chunk.z * -16;
		camera.position.set(
			x,
			48,
			z,
		);
		camera.lookAt(
			x,
			48,
			z + 1,
		);
	}
}



// Rendering loop


const moveDist = 0.2;

function renderFrame() {
	if (currentKeys.w) {
		camera.translateZ(-moveDist);
	}
	if (currentKeys.s) {
		camera.translateZ(moveDist);
	}
	if (currentKeys.a) {
		camera.translateX(-moveDist);
	}
	if (currentKeys.d) {
		camera.translateX(moveDist);
	}
	if (currentKeys.i) {
		camera.translateY(moveDist);
	}
	if (currentKeys.k) {
		camera.translateY(-moveDist);
	}
	if (currentKeys.j) {
		camera.rotateY(moveDist / 4);
	}
	if (currentKeys.l) {
		camera.rotateY(moveDist / -4);
	}
	// Render frame only if a key is being pressed
	if ( Object.values(currentKeys).some((a: boolean) => a) ) {
		camera.updateProjectionMatrix();
		forceRenderFrame();
		main.app.ports.jsInfo.send(camera.position.x + ", "  + camera.position.z);
	}
}


export function forceRenderFrame() {
	renderer.render(scene, camera);
}


export function renderLoop() {
	requestAnimationFrame(renderLoop);
	renderFrame();
}



// Controls


// Maps keys to booleans telling if the keys are down
let currentKeys: any = {};


export function startKeyEvents() {
	document.body.onkeydown = function(event) {
		currentKeys[event.key] = true;
	};

	document.body.onkeyup = function(event) {
		currentKeys[event.key] = false;
	};
};
