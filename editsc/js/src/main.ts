const zip = require('zip-js/WebContent/zip').zip;
const Chunks32h = require('./Chunks32h');
const KaitaiStream = require('kaitai-struct/KaitaiStream');
import {World} from './world';

zip.workerScriptsPath = '/zipjs/';



// State


let chunksFileEntry: zip.Entry | undefined = undefined;

let world: World | undefined = undefined;



// Initialize Elm


var Elm = require('./Main.elm').Elm;


let app = Elm.Main.init({
	node: document.getElementById('ui'),
});



// Ports


app.ports.extractZip.subscribe(function(): void {
	function zipErr(err: string): void {
		app.ports.extractionError.send(err);
	}

	let fileInput = (<HTMLInputElement>document.getElementById('scworld-input'));

	switch (fileInput.files!.length) {
		case 1:
			let file: File = fileInput.files![0];
			let blobReader = new zip.BlobReader(file);

			zip.createReader(blobReader, function(reader: zip.ZipReader): void {
				let projectEntry: zip.Entry | undefined = undefined;

				reader.getEntries(function(entries: zip.Entry[]): void {
					entries.forEach(function(entry: zip.Entry): void {
						if (entry.filename.endsWith('Project.xml')) {
							projectEntry = entry;
						}
						else if (entry.filename.endsWith('Chunks32h.dat')) {
							chunksFileEntry = entry;
						}
					});

					if (projectEntry && chunksFileEntry) {
						projectEntry.getData(new zip.TextWriter(), function(content) {
							app.ports.gotProjectFile.send(content);
						});
					}
					else {
						zipErr('The scworld file doesn\'t contain the right files. The world might be in an unsupported Survivalcraft version.');
					}
				});
			}, zipErr);
			break;

		default:
			zipErr('You must upload exactly one file.');
			break;
	}
});


app.ports.parseChunks.subscribe(function(): void {
	if (chunksFileEntry) {
		chunksFileEntry.getData(new zip.BlobWriter(), function(blob: Blob): void {
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
						app.ports.chunksError.send('Invalid data in chunks file; it might be corrupted');
						break;

					default:
						world = new World(chunksStruct);
						app.ports.chunksReady.send(null);
				}
			};
		});
	}
});



// Make this file a module


export {};
