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



// Lights & fog
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0);
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.1);
directionalLight.target = new THREE.Object3D();
scene.add(ambientLight, directionalLight.target, directionalLight);
scene.fog = new THREE.Fog(0xf5f5f5, 96, 128);



// chunkGroups[x][z] holds the geometry for that chunk
let chunkGroups: Record<
	number, Record<
		number, THREE.Group | undefined
	> | undefined
>
= {};


export async function renderChunk(chunk: world.Chunk/*, btype: BlockType*/) {
	let group: THREE.Group;
	if(!chunkGroups[chunk.x]) {
		chunkGroups[chunk.x] = {};
	}
	if(!(chunkGroups[chunk.x]![chunk.z])) {
		group = new THREE.Group();
		scene.add(group);
		chunkGroups[chunk.x]![chunk.z] = group;
	}
	else {
		group = chunkGroups[chunk.x]![chunk.z]!;
	}

	//blockTypes.forEach(function(btype: BlockType) {
	for (let btype of blockTypes) {
		console.log(btype);
		const condition = blockType.isType(btype);
		if ((await chunk.count(condition)) == 0) {
			continue;
		}
		const faceCount: number = await chunk.countFaces(condition);

		let mesh: THREE.InstancedMesh = geometry.voxelMesh(faceCount, btype);
		let meshIndex = 0;
		chunk.forEach(function(block, x, y, z) {
			chunk.blockFaces(condition, x, y, z).forEach(function(face: THREE.Vector3) {
				geometry.addFace(
					meshIndex,
					mesh,
					face,

					// x, y, z converted from left to right handed coordinates
					(chunk.z * 16) + ((x-1) % 16),
					//(chunk.z << 4) + ((x-1) % 16),
					y,
					(chunk.x * -16) - ((z-1) % 16),
					//-(chunk.x << 16) - ((z-1) % 16),
				);
				meshIndex++;
			});
		}, condition);
		group.add(mesh);
		//console.log({meshindex:meshIndex,faces:faceCount,blcoks:chunk.count(condition)});
	}
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
	camera.updateMatrix();
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
		updateLight();
	}
	if (currentKeys.has("l")) {
		rotate(0, 1, 0, -angle);
		updateLight();
	}
	// Render frame only if a key is being pressed
	if (currentKeys.size != 0) {
		camera.updateMatrix();
		camera.updateProjectionMatrix();
		forceRenderFrame();
	}
}


// FPS counter
let fps = 0;
let millisPerFrame = 0;
let lastRenderTime = Date.now(); // when the last frame was rendered


function updateLight() {
	directionalLight.position.copy(camera.position);
	directionalLight.target.position.copy(camera.position);
	directionalLight.target.quaternion.copy(camera.quaternion);

	directionalLight.target.rotateX(0.01); // look up
	directionalLight.target.translateZ(-1); // move forward

	directionalLight.updateMatrix();
}
//window.setInterval(updateLight, 100)


export function forceRenderFrame() {
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
	window.setTimeout(updateSize, 200);
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
				camera.updateMatrix();
				updateLight();
			}
			if (key == "o") {
				camera.rotateX(Math.PI/8);
				camera.updateMatrix();
				updateLight();
			}
		}
	};

	document.body.onkeyup = function(event) {
		currentKeys.delete(event.key.toLowerCase());
	};
};



forceRenderFrame();
updateSize();
