const JSZip = require('jszip');
const download = require('downloadjs');

import {World} from './world';
import * as rendering from './rendering';
import {blockTypes} from './blockType';
import * as blockType from './blockType';



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


app.ports.parseChunks.subscribe(function(): void {
	if (chunksFileEntry) {
		chunksFileEntry.async('arraybuffer').then(function(arrayBuffer: ArrayBuffer) {
			/*let fileReader = new FileReader();
			fileReader.readAsArrayBuffer(blob);
			fileReader.onload = function(event: Event) {
				let arrayBuffer: ArrayBuffer = (fileReader.result! as ArrayBuffer);
				let kaitaiStream: any = new KaitaiStream(arrayBuffer);
				let chunksStruct = (function(): any | undefined {
					try {
						return new Chunks32h(kaitaiStream);
					}
					catch (e) {
						console.error(e);
						return undefined;
					}
				})();*/
			/*let newWorld = (function(): World | undefined {
				try {
					return new World(arrayBuffer)
				}
				catch(e) {
					console.error(e);
					return undefined;
				}
			})();*/

			try {
				world = new World(arrayBuffer);
				initRender();
				app.ports.chunksReady.send(null);
			}
			catch (e) {
				app.ports.chunksError.send("Invalid data in chunks file; it might be corrupted");
				console.error(e);
			}
		});
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
	console.log(i);
	const chunk = world.getChunk(i);
	if (chunk) {
		rendering.renderChunk(chunk).then(function() {
			rendering.forceRenderFrame();
			//window.setTimeout(function() {
				app.ports.progress.send({
					soFar: i + 1,
					total: world.chunkLength,
					message: "Creating geometry",
				});
			//}, 1);
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
