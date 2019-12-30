// Declare and set up libraries and other external stuff
declare var $: any;
declare var zip: any;
declare var KaitaiStream: any;
declare var Chunks32h: any;
declare var THREE: any;


// Holds imported stuff
namespace Imported {
	export var chunks: any;
}


// Holds stuff for three.js
namespace Three {
	export var scene: any;
	export var camera: any;
	export var renderer: any;
}


// Holds variables needed for movement keys
namespace Events {
	export var keys: any = {}; // Object mapping keys to booleans telling whether or not they're down
	export var intervals: any = {}; // Same thing but the values are the return value of winow.setInterval
}


// Initializes Three.js
function initThree() {
	Three.scene = new THREE.Scene();
	Three.scene.background = new THREE.Color(0xbbddff);
	Three.camera = new THREE.PerspectiveCamera(
		75, // Field of view
		window.innerWidth / window.innerHeight, // Aspect ratio
		0.1, // Near clipping plane
		32, // Far clipping plane
	);
	Three.renderer = new THREE.WebGLRenderer({
		antialias: true,
		canvas: $('#world-canvas')[0],
	});
	Three.renderer.setSize(window.innerWidth, window.innerHeight);
	$('body').append(Three.renderer.domElement);
}


// Calculates block index
function blockIndex(x: number, y: number, z: number) {
	return y + x * 256 + z * 256 * 16;
}
// Gets type of block
function bType(data: number) {
	return 0b1111111111 & data;
}


// Called after Chunks32h.dat file is successfully parsed
function loadChunks() {
	initThree();

	// Cube
	/*let geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
	let material = new THREE.MeshLambertMaterial({color: 0x00ff00});
	let cube = new THREE.Mesh(geometry, material);
	cube.position.y = 64;
	Three.scene.add(cube);*/
	//console.log(cube);
	// Light
	let light = new THREE.DirectionalLight(0xffffff, 1);
	//light.position.y = 1;
	Three.scene.add(light);
	let lightTarget = new THREE.Object3D();
	lightTarget.position.x = 0.1;
	lightTarget.position.y = 0;
	lightTarget.position.z = 0.2;
	Three.scene.add(lightTarget);
	light.target = lightTarget;
	let ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
	Three.scene.add(ambientLight);
	//console.log(light);
	// Camera
	Three.camera.position.x = Imported.chunks.chunks[0].header.xPosition * 4;
	Three.camera.position.y = 64;
	Three.camera.position.z = Imported.chunks.chunks[0].header.zPosition * 4;
	// World blocks
	let geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
	let material = new THREE.MeshLambertMaterial({color: 0x00ff00});
	for (var i = 0; i < Imported.chunks.chunks.length; i++) {
		let chunk: any = Imported.chunks.chunks[i];
		let xOffset = chunk.header.xPosition * 16;
		let zOffset = chunk.header.zPosition * 16;
		for (var x = 0; x < 16; x++) {
			for (var y = 0; y < 256; y++) {
				for (var z = 0; z < 16; z++) {
					if (bType(chunk.blocks[blockIndex(x, y, z)].data) != 0) {
						let cube = new THREE.Mesh(geometry, material);
						cube.position.x = (x + xOffset) / 4;
						cube.position.y = y / 4;
						cube.position.z = (z + zOffset) / 4;
						Three.scene.add(cube);
					}
				}
			}
		}
	}
	//console.log(Three.camera);
	function animate() {
		requestAnimationFrame(animate);
		Three.renderer.render(Three.scene, Three.camera);
	}
	animate();
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
					if (entries[i].filename.endsWith('/Chunks32h.dat')) {
						// Convert to ArrayBuffer
						entries[i].getData(new zip.BlobWriter, function(blob) {
							let fileReader = new FileReader()
							fileReader.readAsArrayBuffer(blob);
							fileReader.onload = function(event) {
								// Initialize Kaitai struct object
								let arrayBuffer = fileReader.result;
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


// Set events
$(document).ready(function() {
	$('body').keydown(function(event) {
		if (!Events.keys[event.key]) {
			Events.intervals[event.key] = window.setInterval(function() {
				let n = 0.5;
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
				}
			}, 50);
			Events.keys[event.key] = true;
		}
	});

	$('body').keyup(function(event) {
		Events.keys[event.key] = false;
		window.clearInterval(Events.intervals[event.key]);
	});
});


// Do stuff on load
$('#upload-modal').modal('show');
