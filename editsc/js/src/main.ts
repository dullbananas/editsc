// Declare and set up libraries and other external stuff
declare var $: any;
const zip = require('zip-js/WebContent/zip').zip;
declare var ZIP_WORKER_SCRIPTS_PATH: string;
zip.workerScriptsPath = ZIP_WORKER_SCRIPTS_PATH;
const KaitaiStream: any = require('kaitai-struct/KaitaiStream');
const Chunks32h: any = require('./Chunks32h');
const THREE = require('three');
const Stats = require('stats.js');


// Holds imported stuff
namespace Imported {
	export var chunks: any;
}


// Holds stuff for three.js
namespace Three {
	export var scene: any;
	export var camera: any;
	export var renderer: any;
	export var stats: any;
	export var pointLight: any;
}


// Holds variables needed for movement keys
namespace Events {
	export var keys: any = {}; // Object mapping keys to booleans telling whether or not they're down
	export var intervals: any = {}; // Same thing but the values are the return value of winow.setInterval
	export var keyCount: number = 0; // Number of keys that are down
}


// Initializes Three.js
function initThree() {
	Three.scene = new THREE.Scene();
	Three.scene.background = new THREE.Color(0xbbddff);
	Three.scene.fog = new THREE.Fog(0xbbddff, 48, 64);
	Three.camera = new THREE.PerspectiveCamera(
		75, // Field of view
		window.innerWidth / window.innerHeight, // Aspect ratio
		0.1, // Near clipping plane
		64, // Far clipping plane
	);
	Three.renderer = new THREE.WebGLRenderer({
		antialias: false,
		canvas: $('#world-canvas')[0],
		stencil: false,
	});
	Three.renderer.setSize(window.innerWidth, window.innerHeight);
	$('body').append(Three.renderer.domElement);
	// FPS counter
	Three.stats = new Stats();
	Three.stats.setMode(0);
	$(Three.stats.domElement).css({
		'position': 'absolute',
		'bottom': '0',
		'left': '0',
	});
	$('body').append(Three.stats.domElement);
	function animate() {
		if (Events.keyCount > 0) {
			Three.renderer.render(Three.scene, Three.camera);
		}
		Three.stats.update();
		requestAnimationFrame(animate);
	}
	animate();
	Three.renderer.render(Three.scene, Three.camera);
}


// Decorator that caches function result
// Copied from https://dev.to/carlillo/understanding-javascripttypescript-memoization-o7k
function memoize(fn) {
	const cache = {};
	return function(...args) {
		const strArgs = JSON.stringify(args);
		const result = (
			cache[strArgs] =
			typeof cache[strArgs] === 'undefined'
			? fn(...args)
			: cache[strArgs]
		);
		return result;
	}
}

// Calculates block index
/*function _blockIndex(x: number, y: number, z: number) {
	return y + x * 256 + z * 256 * 16;
}
const blockIndex = memoize(_blockIndex);*/
// Maps x y and z values to block indexes in a multidimensional array
let blockIndex = [];
for (var x = 0; x < 16; x++) {
	blockIndex.push([]);
	for (var y = 0; y < 256; y++) {
		blockIndex[x].push([]);
		for (var z = 0; z < 16; z++) {
			blockIndex[x][y].push([]);
			blockIndex[x][y][z] = y + x * 256 + z * 256 * 16;
		}
	}
}
// Gets type of block
function _bType(data: number) {
	return 0b1111111111 & data;
}
const bType = memoize(_bType);


const CUBE_SIZE = 1;
// Called after Chunks32h.dat file is successfully parsed
function loadChunks() {
	initThree();
	// Light
	/*let light = new THREE.DirectionalLight(0xffffff, 1);
	//light.position.y = 1;
	Three.scene.add(light);
	let lightTarget = new THREE.Object3D();
	lightTarget.position.x = 0.1;
	lightTarget.position.y = 0;
	lightTarget.position.z = 0.2;
	Three.scene.add(lightTarget);
	light.target = lightTarget;*/
	let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
	Three.scene.add(ambientLight);
	Three.pointLight = new THREE.PointLight(0xffffff, 1, 64);
	Three.scene.add(Three.pointLight);
	// Camera
	Three.camera.position.x = Imported.chunks.chunks[0].header.xPosition * 16 / CUBE_SIZE;
	Three.camera.position.y = 80 * CUBE_SIZE;
	Three.camera.position.z = Imported.chunks.chunks[0].header.zPosition * 16 / CUBE_SIZE;
	console.log(Three.camera.position)
	Three.pointLight.position.set(
		Three.camera.position.x,
		Three.camera.position.y,
		Three.camera.position.z,
	);
	// World blocks
	let geometry = new THREE.BoxBufferGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
	let material = new THREE.MeshLambertMaterial({color: 0x00ff00});
	THREE.Object3D.DefaultMatrixAutoUpdate = false;
	for (var i = 0; i < Imported.chunks.chunks.length; i++) {
		//console.log([i+1, Imported.chunks.chunks.length])
		let transform = new THREE.Object3D();
		let chunk: any = Imported.chunks.chunks[i];
		let xOffset = chunk.header.xPosition * 16;
		let zOffset = chunk.header.zPosition * 16;
		for (var x = 0; x < 16; x++) {
			for (var y = 0; y < 256; y++) {
				for (var z = 0; z < 16; z++) {
					let index: number = blockIndex[x][y][z];
					// Determine if this block is covered up by other blocks and doesn't need to be rendered
					let needsRendering: boolean = false;
					if (bType(chunk.blocks[index].data) == 0) {
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
							var block = chunk.blocks[blockIndex[c[0]][c[1]][c[2]]];
							if (bType(block.data) === 0) {
							//if (bType(chunk.blocks[blockIndex(c[0], c[1], c[2])].data) == 0) {
								needsRendering = true;
								break;
							}
						}
						/*	catch (err) {
								// If the block is at the edge
								needsRendering = true;
								break;
							}
						}*/
					}
					if (needsRendering) {
						let cube = new THREE.Mesh(geometry, material);
						cube.position.x = (x + xOffset) * CUBE_SIZE;
						cube.position.y = y * CUBE_SIZE;
						cube.position.z = (z + zOffset) * CUBE_SIZE;
						Three.scene.add(cube);
						cube.updateMatrix();
						/*transform.position.set(
							(x + xOffset) / 4,
							y / 4,
							(z + zOffset) / 4,
						);
						transform.updateMatrix();
						cube.setMatrixAt(index, transform.matrix);*/
						if (x == 0 && y == 0) {
							console.log(cube.position);
						}
					}
				}
			}
		}
		Three.renderer.render(Three.scene, Three.camera);
	}
	//console.log(Three.camera);
	// Do first render
	//Three.renderer.render(Three.scene, Three.camera);
}


// Called when the file upload form is submitted
function loadWorld() {
	$('.upload-error').hide()

	var files = $('#scworld-input')[0].files;
	if (files.length != 1) {
		$('#upload-count-error').show();
		return;
	}

	zip.createReader(new zip.BlobReader(files[0]), function(reader) {
		reader.getEntries(function(entries) {
			try {
				var kaitai_success = false;
				for (var i = 0; i < entries.length; i++) {
					console.log('Processing ' + entries[i].filename)
					if (entries[i].filename.endsWith('Chunks32h.dat')) {
						// Convert to ArrayBuffer
						console.log('Getting zip entry data');
						entries[i].getData(new zip.BlobWriter, function(blob) {
							console.log('Creating FileReader');
							let fileReader = new FileReader();
							console.log('Reading blob as ArrayBuffer');
							fileReader.readAsArrayBuffer(blob);
							fileReader.onload = function(event) {
								// Initialize Kaitai struct object
								console.log('Creating ArrayBuffer');
								let arrayBuffer: any = fileReader.result;
								console.log('ArrayBuffer created');
								console.log(['array buffer size', arrayBuffer.byteLength])
								Imported.chunks = new Chunks32h(new KaitaiStream(arrayBuffer));
								loadChunks();
							}
						});
						kaitai_success = true;
					}
				}
				if (!kaitai_success) {
					throw new Error('');
				}
				$('#upload-modal').modal('hide');
			}
			catch (err) {
				$('#upload-general-error').show();
			}
		});
	}, function(error) {
		$('#upload-extract-error').text('Could not extract scworld contents: ' + error);
		$('#upload-extract-error').show();
	});

}


// Set keyboard events
$(document).ready(function() {
	$('body').keydown(function(event) {
		if (!Events.keys[event.key]) {
			let n = 1;
			Events.intervals[event.key] = window.setInterval(function() {
				switch (event.key) {
					case 'w':
						Three.camera.translateZ(-n);
						break;
					case 's':
						Three.camera.translateZ(n);
						break;
					case 'a':
						Three.camera.translateX(-n);
						break;
					case 'd':
						Three.camera.translateX(n);
						break;
					case 'q':
						Three.camera.translateY(-n);
						break;
					case 'e':
						Three.camera.translateY(n);
						break;
				}
				Three.pointLight.position.set(
					Three.camera.position.x,
					Three.camera.position.y,
					Three.camera.position.z,
				);
			}, 1000/60);
			Events.keys[event.key] = true;
			Events.keyCount += 1;
		}
	});

	$('body').keyup(function(event) {
		Events.keys[event.key] = false;
		window.clearInterval(Events.intervals[event.key]);
		Events.keyCount -= 1;
	});
});


// Set events for other stuff
$('#import-world-btn').click(loadWorld);


// Do stuff on load
$('#upload-modal').modal('show');


// Make this file a module
export {};
