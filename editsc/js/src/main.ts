const JSZip = require('jszip');
const Chunks32h = require('./Chunks32h');
const KaitaiStream = require('kaitai-struct/KaitaiStream');
const download = require('downloadjs');
import {World} from './world';

//zip.workerScriptsPath = '/zipjs/';



// State


let chunksFileEntry: any | undefined = undefined;

let world: World | undefined = undefined;



// Initialize Elm


var M = require('./Main.elm');
var C = require('./Css.elm');


let app = M.Elm.Main.init({
	node: document.getElementById('ui'),
});


let cssApp = C.Elm.Css.init({
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
			console.log(0);

			JSZip.loadAsync(file).then(function(zip: any/*: JSZip*/) {
				console.log(1);
				const chunksObj = zip.file(/Chunks32h\.dat$/)[0];
				console.log(2);
				const projectObj = zip.file(/Project\.xml$/)[0];
				console.log([chunksObj,projectObj]);

				if ( chunksObj && projectObj ) {
					chunksFileEntry = chunksObj; // save chunks file for later
					console.log(3);

					projectObj.async('string').then(function(content: String) {
						console.log(3);
						app.ports.gotProjectFile.send(content);
						console.log(4);
					});
				}
				else {
					zipErr("The scworld file doesn't contain the right files. It might be in an unsupported Survivalcraft version.");
				}
			});
			/*let blobReader = new zip.BlobReader(file);

			zip.createReader(blobReader, function(reader: zip.ZipReader): void {
				let projectEntry: zip.Entry | undefined = undefined;

				reader.getEntries(function(entries: zip.Entry[]): void {
					entries.forEach(function(entry: zip.Entry): void {
						if (entry.filename.endsWith("Project.xml")) {
							projectEntry = entry;
						}
						else if (entry.filename.endsWith("Chunks32h.dat")) {
							chunksFileEntry = entry;
						}
					});

					if (projectEntry && chunksFileEntry) {
						projectEntry.getData(new zip.TextWriter(), function(content) {
							app.ports.gotProjectFile.send(content);
						});
					}
					else {
						zipErr("The scworld file doesn't contain the right files. The world might be in an unsupported Survivalcraft version.");
					}
				});
			}, zipErr);*/
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
				}
			};
		});
	}
});


app.ports.saveWorld.subscribe(function(arg: {fileName: string, xml: string}): void {
	/*zip.createWriter(new zip.BlobWriter(), function(writer: any): void {
		// Write Project.xml
		writer.add('Project.xml', new zip.TextReader(arg.xml), function(): void {
			// Download
			writer.close(function(blob: Blob): void {
				download(blob, arg.fileName, 'application/zip');
			}); // So
		}); // Many
	}); // Stupid*/
	let zip = new JSZip();
	const rootDir: string = arg.fileName.split(".")[0] + "/";

	zip.file(rootDir+"Project.xml", arg.xml);

	zip.generateAsync({type:'blob'}).then(function(blob: Blob) {
		download(blob, arg.fileName, "application/zip");
	});
});



// Make this file a module


export {};
