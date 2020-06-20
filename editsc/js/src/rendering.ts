import * as THREE from 'three';

import * as main from './main';
import * as world from './world';
import * as geometry from './geometry';
import {BlockType, blockTypes} from './blockType';
import * as blockType from './blockType';
import * as extension from './extension';


/*

Layers
	0: Almost everything
	1: Single block selection box

nevermind

*/



// Set up rendering


export let scene = new THREE.Scene();

scene.background = new THREE.Color(0xf5f5f5);
scene.autoUpdate = true;
scene.frustumCulled = false;


let camera = new THREE.PerspectiveCamera(
	70, // field of view
	window.innerWidth / window.innerHeight, // aspect ratio
	0.1, // near clipping plane
	128, // far clipping plane
);
camera.matrixAutoUpdate = false;


let renderer = new THREE.WebGLRenderer({
	canvas: document.getElementById('world-canvas') as HTMLCanvasElement,
	stencil: false,
	antialias: true,
	powerPreference: 'low-power',
});
renderer.physicallyCorrectLights = false;

const pixelDensity: number = Math.trunc(window.devicePixelRatio);



// Lights & fog


const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.2);
directionalLight.matrixAutoUpdate = false;

directionalLight.target = new THREE.Object3D();
directionalLight.target.matrixAutoUpdate = false;

scene.add(ambientLight, directionalLight.target, directionalLight);

scene.fog = new THREE.Fog(0xf5f5f5, 96, 128);



// chunkGroups[x][z] holds the geometry for that chunk
export let chunkGroups: Record<
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
	if(chunkGroups[chunk.x]![chunk.z]) {
		scene.remove(chunkGroups[chunk.x]![chunk.z]!);
	}
	group = new THREE.Group();
	scene.add(group);
	chunkGroups[chunk.x]![chunk.z] = group;
	/*if(!(chunkGroups[chunk.x]![chunk.z])) {
		group = new THREE.Group();
		scene.add(group);
		chunkGroups[chunk.x]![chunk.z] = group;
	}
	else {
		group = chunkGroups[chunk.x]![chunk.z]!;
	}*/

	//blockTypes.forEach(function(btype: BlockType) {
	for (let btype of blockTypes) {
		const condition = blockType.isType(btype);
		if ((await chunk.count(condition)) == 0) {
			continue;
		}

		switch (btype.kind) {
			case 'voxel':
				const faceCount: number = await chunk.countFaces(condition);

				let mesh: THREE.InstancedMesh = await geometry.voxelMesh(faceCount, btype);
				mesh.position.set(chunk.z << 4, 0, -(chunk.x << 4))
				let meshIndex = 0;

				await chunk.forEach(async function(block, x, y, z) {
					if (meshIndex == faceCount) {
						return;
					}
					const faces = await chunk.blockFaces(condition, x, y, z);
					faces.forEach(function(face: geometry.Face) {
						geometry.addFace(
							meshIndex,
							mesh,
							geometry.faceVectors[face],

							// x, y, z converted from left to right handed coordinates

							//(chunk.z * 16) + ((x-1) % 16),
							//(chunk.z << 4) + ((x-1) % 16),
							//(chunk.z << 4) + x - 1,
							//x - 1,
							x,
							y,
							//(chunk.x * -16) - ((z-1) % 16),
							//-(chunk.x << 4) - ((z-1) % 16),
							//-z + 1,
							-z,
						);
						meshIndex++;
					});
				}, condition);

				mesh.updateMatrix();
				mesh.instanceMatrix.needsUpdate = true;
				group.add(mesh);
				break;
		}
	}
	console.log(chunkGroups);
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
		camera.updateMatrix();
		camera.lookAt(
			x + 1,
			48,
			z + 1,
		);
	}
	camera.updateMatrix();
	camera.updateMatrixWorld(true);
	camera.matrixWorldNeedsUpdate = true;
}



// Rendering loop


let rotationVector = new THREE.Vector3(0, 0, 0);
function rotate(x: number, y: number, z: number, angle: number) {
	rotationVector.set(x, y, z);
	camera.rotateOnWorldAxis(rotationVector, angle);
	camera.matrixWorldNeedsUpdate = true;
}


async function renderFrame() {
	if (
		currentKeys.size == 0
		&& touchMovement1.x == 0
		&& touchMovement1.y == 0
		&& touchMovement2.x == 0
		&& touchMovement2.y == 0
	) {
		return;
	}
	if (millisPerFrame == 0) {
		return;
	}

	let moveDist: number = 0.024 * millisPerFrame;
	let angle: number = 0.0024 * millisPerFrame;

	camera.translateX(touchMovement1.x * 0.05);
	camera.translateZ(touchMovement1.y * 0.05);

	if (touchMovement2.x != 0) {
		rotate(0, 1, 0, touchMovement2.x * -0.005);
		updateLight();
	}

	if (touchMovement2.y > 80) {
		camera.rotateX(Math.PI/-8);
		updateLight();
		touchMovement2.y = 0;
	}

	if (touchMovement2.y < -80) {
		camera.rotateX(Math.PI/8);
		updateLight();
		touchMovement2.y = 0;
	}
	//rotate(1, 0, 0, touchMovement2.y * -0.005);
	//camera.rotateX(touchMovement2.y * -0.005);

	if (currentKeys.has("shift")) {
		moveDist *= 0.35;
		angle *= 0.35;
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

	if (selectMode == SelectMode.SingleBlock) {
		await updateSelector();
	}

	camera.updateMatrix();
	camera.matrixWorldNeedsUpdate = true;
	//camera.updateProjectionMatrix();
	await forceRenderFrame();

	touchMovement1.x = 0;
	touchMovement1.y = 0;
	touchMovement2.x = 0;
}


// Resets every frame
let touchMovement1 = {x: 0, y: 0}; // 1 finger
let touchMovement2 = {x: 0, y: 0}; // 2 fingers


export function initTouchControls(app: any) {
	app.ports.moveCamera.subscribe(function(vec: {x: number, y: number}) {
		touchMovement1.x += vec.x;
		touchMovement1.y += vec.y;
	});
	app.ports.rotateCamera.subscribe(function(vec: {x: number, y: number}) {
		touchMovement2.x += vec.x;
		touchMovement2.y += vec.y;
		console.log(touchMovement2);
	});
}


// FPS counter
//let fps = 0;
let millisPerFrame = 0;
let lastRenderTime = Date.now(); // when the last frame was rendered


async function updateLight() {
	directionalLight.position.copy(camera.position);
	directionalLight.target.position.copy(camera.position);
	directionalLight.target.quaternion.copy(camera.quaternion);

	directionalLight.target.rotateX(0.01); // look up
	directionalLight.target.translateZ(-1); // move forward

	directionalLight.target.updateMatrix();
	directionalLight.updateMatrix();
}
//window.setInterval(updateLight, 100)


export async function forceRenderFrame() {
	renderer.render(scene, camera);
}


export function renderLoop() {
	renderFrame().then(function() {
		millisPerFrame = Date.now() - lastRenderTime;
		lastRenderTime = Date.now();
		requestAnimationFrame(renderLoop);
	});
	//fps = 1000 / millisPerFrame;
}


export async function updateSize() {
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
				camera.matrixWorldNeedsUpdate = true;
				updateLight();
			}
			if (key == "o") {
				camera.rotateX(Math.PI/8);
				camera.updateMatrix();
				camera.matrixWorldNeedsUpdate = true;
				updateLight();
			}
		}
	};

	document.body.onkeyup = function(event) {
		currentKeys.delete(event.key.toLowerCase());
	};
};



// Block selection


enum SelectMode {
	None = 0,
	SingleBlock = 1,
};


let selectMode = SelectMode.None;


export function updateSelectMode(mode: SelectMode) {
	selectMode = mode;
	switch (mode) {
		case SelectMode.None:
			selector.visible = false;
			break;

		case SelectMode.SingleBlock:
			updateSelector();
			selector.visible = true;
			break;
	}
	forceRenderFrame();
}


const selectorSize =
	1.05;

const selectorGeometry =
	new THREE.BoxBufferGeometry(selectorSize, selectorSize, selectorSize);

const selectorMaterial =
	new THREE.MeshLambertMaterial({
		color: new THREE.Color(0x888888),
		transparent: true,
		opacity: 0.85,
	});

export let selector =
	new THREE.Mesh(selectorGeometry, selectorMaterial);

selector.matrixAutoUpdate = false;
selector.visible = false;

scene.add(selector);


async function updateSelector() {
	selector.position.copy(camera.position);
	selector.quaternion.copy(camera.quaternion);
	selector.translateZ(-5);
	selector.position.set(
		Math.round(selector.position.x),
		Math.round(selector.position.y - 1.5),
		Math.round(selector.position.z),
	);
	selector.rotation.set(0, 0, 0);
	selector.updateMatrix();
	//console.log(selector.position);
}
//window.setInterval(updateSelector, 1000);



// Initialize some stuff


forceRenderFrame();
updateSize();
