const JSZip = require('jszip');
const Chunks32h = require('./Chunks32h');
const KaitaiStream = require('kaitai-struct/KaitaiStream');
const download = require('downloadjs');
import {World} from './world';
import * as rendering from './rendering';

//zip.workerScriptsPath = '/zipjs/';



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
		chunksFileEntry.async('blob').then(function(blob: Blob): void {
			let fileReader = new FileReader();
			fileReader.readAsArrayBuffer(blob);
			fileReader.onload = function(event: Event) {
				let arrayBuffer: ArrayBuffer = (fileReader.result! as ArrayBuffer);
				let kaitaiStream: any = new KaitaiStream(arrayBuffer);
				let chunksStruct = (function(): any | undefined {
					try {
						return new Chunks32h(kaitaiStream);
					}
					catch (e) {
						return undefined;
					}
				})();

				switch (typeof chunksStruct) {
					case 'undefined':
						app.ports.chunksError.send("Invalid data in chunks file; it might be corrupted");
						break;

					default:
						world = new World(chunksStruct);
						app.ports.chunksReady.send(null);
						// Editor is now ready to start; importing is done.
						// Start 3D rendering
						rendering.updateSize();
						rendering.renderLoop();
						rendering.startKeyEvents();
						rendering.initCameraPosition();
						rendering.currentKeys.add("updating");
						for (let chunk of world.chunks) {
							rendering.renderChunk(chunk);
						}
						rendering.currentKeys.delete("updating");
						rendering.forceRenderFrame();
				}
			};
		});
	}
});


app.ports.saveWorld.subscribe(function(arg: {fileName: string, xml: string}): void {
	let zip = new JSZip();
	const rootDir: string = arg.fileName.split(".")[0] + "/";

	zip.file(rootDir+"Project.xml", arg.xml);

	zip.generateAsync({type:'blob'}).then(function(blob: Blob) {
		download(blob, arg.fileName, "application/zip");
	});
});
