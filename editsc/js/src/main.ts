const JSZip = require('jszip');
const download = require('downloadjs');

import {World} from './world';
import * as rendering from './rendering';
import {blockTypes} from './blockType';
import * as blockType from './blockType';
import * as extension from './extension';



// State


let chunksFileEntry: any | undefined = undefined;

export let world: World = new World(null);



// Initialize Elm


let Elm = require('./Main.elm').Elm;


export let app = Elm.Main.init({
	node: document.getElementById('ui'),
});


let cssApp = Elm.Styles.init({
	node: document.getElementById('style'),
});



// Ports


app.ports.extractZip.subscribe(function(): void {
	function zipErr(err: string) {
		app.ports.extractionError.send(err);
	}

	let fileInput = (<HTMLInputElement>document.getElementById('scworld-input'));

	switch (fileInput.files!.length) {
		case 1:
			let file: File = fileInput.files![0];

			JSZip.loadAsync(file).then(function(zip: any/*: JSZip*/) {
				const chunksObj = zip.file(/Chunks32h\.dat$/)[0];
				const projectObj = zip.file(/Project\.xml$/)[0];

				if ( chunksObj && projectObj ) {
					chunksFileEntry = chunksObj; // save chunks file for later

					projectObj.async('string').then(function(content: String) {
						// Send Project.xml to Elm
						app.ports.gotProjectFile.send(content);
					});
				}
				else {
					zipErr("The scworld file doesn't contain the right files. It might be in an unsupported Survivalcraft version.");
				}
			});
			break;

		default:
			zipErr("You must upload exactly one file.");
			break;
	}
});


app.ports.parseChunks.subscribe(async function() {
	if (chunksFileEntry) {
		let arrayBuffer: ArrayBuffer = await chunksFileEntry.async('arraybuffer');
		try {
			world = new World(arrayBuffer);
		}

		catch (e) {
			app.ports.chunksError.send("Invalid data in chunks file; it might be corrupted");
			console.error({chunkLoadError: e});
			return;
		}

		await extension.load("https://editsc.pythonanywhere.com/dulldevBasics.js");

		// Importing is done
		initRender();
		app.ports.chunksReady.send(null);
	}
});


app.ports.startRendering.subscribe(function() {
	app.ports.progress.send({
		soFar: 0,
		total: world.chunkLength,
		message: "Creating geometry",
	});
});


app.ports['continue'].subscribe(function(i: number) {
	//console.log(i);
	const chunk = world.getChunk(i);
	if (chunk) {
		rendering.renderChunk(chunk).then(async function() {
			await rendering.forceRenderFrame();
			window.setTimeout(function() {
				app.ports.progress.send({
					soFar: i + 1,
					total: world.chunkLength,
					message: "Creating geometry",
				});
			}, 3);
		});
	}
});


function initRender() {
	rendering.startKeyEvents();
	rendering.updateSize();
	rendering.renderLoop();
	rendering.initCameraPosition();
	/*for (let i = 0; i < world.chunkCount(); i++) {
		rendering.renderChunk(world.getChunk(i)!);
		rendering.forceRenderFrame();
	}
	rendering.startKeyEvents();*/
}


app.ports.saveWorld.subscribe(function(arg: {fileName: string, xml: string}): void {
	let zip = new JSZip();
	const rootDir: string = arg.fileName.split(".")[0] + "/";

	zip.file(rootDir+"Project.xml", arg.xml);
	//zip.file(rootDir+"Chunks32h.dat", world.makeArrayBuffer());
	zip.file(rootDir+"Chunks32h.dat", world.arrayBuffer);

	zip.generateAsync({type:'blob'}).then(function(blob: Blob) {
		download(blob, arg.fileName, "application/zip");
	});
});


app.ports.selectionState.subscribe(rendering.updateSelectMode);
