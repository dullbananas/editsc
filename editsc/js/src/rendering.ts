import * as THREE from 'three';

import * as main from './main';
import * as world from './world';
import * as geometry from './geometry';
import {BlockType, blockTypes} from './blockType';
import * as blockType from './blockType';



// Set up rendering


export let scene = new THREE.Scene();

scene.background = new THREE.Color(0xf5f5f5);
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
	antialias: true,
	powerPreference: 'low-power',
});
const pixelDensity: number = Math.trunc(window.devicePixelRatio);



// Voxel geometry and meshes


/*let textureLoader = new THREE.TextureLoader();
let texture = textureLoader.load("../static/blocks.png");
texture.repeat.x = 1/16;
texture.repeat.y = 1/16;
texture.offset.x = 2/16;
texture.offset.y = 14/16;
texture.magFilter = THREE.NearestFilter; // Give textures pixelated appearance

let material = new THREE.MeshLambertMaterial({
	map: texture,
});*/


// Lights & fog
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0);
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.1);
directionalLight.target = new THREE.Object3D();
scene.add(ambientLight, directionalLight.target, directionalLight);
scene.fog = new THREE.Fog(0xf5f5f5, 96, 128);


/*function addVoxel(
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
}*/


// chunkGroups[x][z] holds the geometry for that chunk
let chunkGroups: Record<
	number, Record<
		number, THREE.Group | undefined
	> | undefined
>
= {};


export function renderChunk(chunk: world.Chunk, btype: BlockType) {
	const condition = blockType.isType(btype);
	const blockCount: number = chunk.count(condition);
	if (blockCount == 0) {
		return;
	}
	let mesh: THREE.InstancedMesh = geometry.voxelMesh(blockCount, btype);

	let meshIndex = 0;

	chunk.forEach(function(block, x, y, z) {
		geometry.addVoxel(
			//transform,
			meshIndex,
			mesh,
			// x, y, z converted from left to right handed coordinates
			(chunk.z * 16) + ((x-1) % 16),
			y,
			(chunk.x * -16) - ((z-1) % 16),
		);
		meshIndex++;
	}, condition);

	let group = new THREE.Group();
	group.add(mesh);
	scene.add(group);

	if(!chunkGroups[chunk.x]) {
		chunkGroups[chunk.x] = {};
	}
	chunkGroups[chunk.x]![chunk.z] = group;
}


export function initCameraPosition() {
	const chunk = main.world.getChunk(0);

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


function rotate(x: number, y: number, z: number, angle: number) {
	camera.rotateOnWorldAxis(new THREE.Vector3(x, y, z), angle);
}


function renderFrame() {
	if (fps == 0) {
		return;
	}

	let moveDist: number = 24 / fps;
	let angle: number = Math.PI / 2 / fps;

	if (currentKeys.has("shift")) {
		moveDist /= 2;
		angle /= 2;
	}

	if (currentKeys.has("i")) {
		camera.translateZ(-moveDist);
	}
	if (currentKeys.has("k")) {
		camera.translateZ(moveDist);
	}
	if (currentKeys.has("a")) {
		camera.translateX(-moveDist);
	}
	if (currentKeys.has("d")) {
		camera.translateX(moveDist);
	}
	if (currentKeys.has("w")) {
		camera.translateY(moveDist);
	}
	if (currentKeys.has("s")) {
		camera.translateY(-moveDist);
	}
	if (currentKeys.has("j")) {
		rotate(0, 1, 0, angle);
	}
	if (currentKeys.has("l")) {
		rotate(0, 1, 0, -angle);
	}
	// Render frame only if a key is being pressed
	if (currentKeys.size != 0) {
		camera.updateProjectionMatrix();
		forceRenderFrame();
	}
}


// FPS counter
//let frames = 0;
let fps = 0;
let millisPerFrame = 0;
let lastRenderTime = Date.now(); // when the last frame was rendered
/*window.setInterval(function() {
	fps = frames * 10;
	frames = 0;
}, 100);*/


export function forceRenderFrame() {
	directionalLight.position.copy(camera.position);
	directionalLight.target.position.copy(camera.position);
	directionalLight.target.quaternion.copy(camera.quaternion);

	directionalLight.target.rotateX(0.01); // look up
	directionalLight.target.translateZ(-1); // move forward
	//directionalLight.target.translateX(1); // move right

	renderer.render(scene, camera);
}


export function renderLoop() {
	requestAnimationFrame(renderLoop);
	renderFrame();
	millisPerFrame = Date.now() - lastRenderTime;
	lastRenderTime = Date.now();
	fps = 1000 / millisPerFrame;
}


export function updateSize() {
	const PreventStyleChange = false;

	const width: number = window.innerWidth * pixelDensity;
	const height: number = window.innerHeight * pixelDensity;
	renderer.setSize(width, height, PreventStyleChange);
	camera.aspect = window.innerWidth / window.innerHeight;

	camera.updateProjectionMatrix();
	forceRenderFrame();
	window.scrollTo(0, 0);
	document.body.style.height = window.innerHeight + "px";
}

window.onresize = function() {
	updateSize();

	// This is needed to make sure the size is correct
	window.setTimeout(updateSize, 100);
};



// Controls


// Holds the keys that are currently being pressed
export let currentKeys: Set<String> = new Set();


export function startKeyEvents() {
	document.body.onkeydown = function(event) {
		const key: string = event.key.toLowerCase();
		if (!currentKeys.has(key)) {
			currentKeys.add(key);

			if (key == "u") {
				camera.rotateX(Math.PI/-8);
			}
			if (key == "o") {
				camera.rotateX(Math.PI/8);
			}
		}
	};

	document.body.onkeyup = function(event) {
		currentKeys.delete(event.key.toLowerCase());
	};
};



forceRenderFrame();
updateSize();
