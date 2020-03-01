// Handles 3D rendering of the world


declare var $: any;
const THREE = require('three');
//const Stats = require('stats.js');
import * as controls from './controls';
import * as globals from './globals';
import * as utils from './utils';

const CUBE_SIZE = 1;


// Contains some of the objects for the scene
export namespace Objects {
	export var scene: any;
	export var camera: any;
	export var renderer: any;
	export var stats: any;
	export var pointLight: any;
}

// Gemometry and stuff
const blockGeometry = new THREE.BoxBufferGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
const blockMaterial = new THREE.MeshLambertMaterial({color: 0x00ff00});


// Renders a single frame
export function renderFrame() {
	console.log('frame rendered');
	Objects.pointLight.position.set(
		Objects.camera.position.x,
		Objects.camera.position.y,
		Objects.camera.position.z,
	);
	Objects.renderer.render(Objects.scene, Objects.camera);
}


// Initializes the renderer, scene, etc.
export function initialize() {
	// Configuration
	//THREE.Object3D.DefaultMatrixAutoUpdate = false;
	// Scene
	Objects.scene = new THREE.Scene();
	Objects.scene.background = new THREE.Color(0x0000ff);
	//Objects.scene.fog = new THREE.Fog(0xbbddff, 48, 64);
	// Light
	Objects.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
	Objects.pointLight = new THREE.PointLight(0xffffff, 1, 64);
	Objects.scene.add(Objects.pointLight);
	// Camera
	Objects.camera = new THREE.PerspectiveCamera(
		75, // Field of view
		window.innerWidth / window.innerHeight, // Aspect ratio
		0.1, // Near clipping plane
		256, // Far clipping plane
	);
	// Renderer
	Objects.renderer = new THREE.WebGLRenderer({
		antialias: false,
		canvas: $('#world-canvas')[0],
		//stencil: false,
	});
	Objects.renderer.setSize(window.innerWidth, window.innerHeight);
	$('body').append(Objects.renderer.domElement);
	// FPS counter
	/*Objects.stats = new Stats();
	Objects.stats.setMode(0);
	$(Objects.stats.domElement).css({
		'position': 'absolute',
		'bottom': '0',
		'left': '0',
	});
	$('body').append(Objects.stats.domElement);*/
	// Rendering loop
	function renderLoop() {
		if (controls.KeysState.keyCount > 0) {
			renderFrame();
		}
		Objects.stats.update();
		requestAnimationFrame(renderLoop);
	}
	renderLoop();
	// Render the first frame
	renderFrame();
}


// Creates the chunk in the scene
export function renderChunk(chunkIndex) {
	let geometry = new THREE.BoxBufferGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
	let material = new THREE.MeshLambertMaterial({color: 0x00ff00});
	THREE.Object3D.DefaultMatrixAutoUpdate = false;
	let chunk: any = globals.World.chunksFile.chunks[chunkIndex];
	let xOffset = chunk.header.xPosition * 16;
	let zOffset = chunk.header.zPosition * 16;
	let obj = new THREE.Mesh(geometry, material);
	obj.position.x = xOffset;
	obj.position.y = 80;
	obj.position.z = zOffset;
	console.log(['chunk thing', obj.position]);
	obj.updateMatrix();
	Objects.scene.add(obj);
	obj.updateMatrix();
	//return null;
	for (var x = 0; x < 16; x++) {
		for (var y = 0; y < 256; y++) {
			for (var z = 0; z < 16; z++) {
				let index: number = utils.blockIndex[x][y][z];
				// Determine if this block is covered up by other blocks and doesn't need to be rendered
				let needsRendering: boolean = false;
				if (utils.bType(chunk.blocks[index].data) == 0) {
					// Air
					needsRendering = false;
				}
				else if (x == 15 || x == 0 || y == 255 || y == 0 || z == 15 || z == 0) {
					// Block at edge of chunk
					needsRendering = true;
				}
				else {
					let outerCoords: any = [
						[x, y, z + 1],
						[x, y, z - 1],
						[x, y + 1, z],
						[x, y - 1, z],
						[x + 1, y, z],
						[x - 1, y, z],
					];
					for (var ci = 0; ci < 6; ci++) {
						let c = outerCoords[ci];
						var block = chunk.blocks[utils.blockIndex[c[0]][c[1]][c[2]]];
						if (utils.bType(block.data) === 0) {
							needsRendering = true;
							break;
						}
					}
				}
				if (needsRendering) {
					let cube = new THREE.Mesh(geometry, material);
					cube.position.x = x + xOffset;
					cube.position.y = y;
					cube.position.z = (15 - z) + zOffset;
					cube.updateMatrix();
					Objects.scene.add(cube);
				}
			}
		}
	}
	renderFrame();
}
