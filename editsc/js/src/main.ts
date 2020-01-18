// Declare and set up libraries and other external stuff
declare var $: any;
const zip = require('zip-js/WebContent/zip').zip;
declare var ZIP_WORKER_SCRIPTS_PATH: string;
zip.workerScriptsPath = ZIP_WORKER_SCRIPTS_PATH;
const KaitaiStream: any = require('kaitai-struct/KaitaiStream');
const Chunks32h: any = require('./Chunks32h');

// Import stuff from other files here
import * as controls from './controls';
import * as rendering from './rendering';
import * as globals from './globals';


// Called after Chunks32h.dat file is successfully parsed
const CUBE_SIZE = 1;
function loadChunks() {
	rendering.initialize();
	// Camera
	rendering.Objects.camera.position.x = globals.World.chunksFile.chunks[0].header.xPosition * 16 / CUBE_SIZE;
	rendering.Objects.camera.position.y = 80 * CUBE_SIZE;
	rendering.Objects.camera.position.z = globals.World.chunksFile.chunks[0].header.zPosition * 16 / CUBE_SIZE;
	rendering.renderFrame();
	console.log([
		rendering.Objects.camera.position.x,
		rendering.Objects.camera.position.y,
		rendering.Objects.camera.position.z,
	]);
	// World blocks
	for (var i = 0; i < globals.World.chunksFile.chunks.length; i++) {
		console.log(['rendering chunk', i]);
		rendering.renderChunk(i);
		console.log([rendering.Objects.scene.children.length, 'children of scene']);
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
								globals.World.chunksFile = new Chunks32h(new KaitaiStream(arrayBuffer));
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
	$('body').keydown(controls.handleKeyDown);
	$('body').keyup(controls.handleKeyUp);
});


// Set events for other stuff
$('#import-world-btn').click(loadWorld);


// Do stuff on load
$('#upload-modal').modal('show');


window.setInterval(function() {
	$('#info-box').text(JSON.stringify(rendering.Objects.camera.position));
}, 100);


// Make this file a module
export {};
