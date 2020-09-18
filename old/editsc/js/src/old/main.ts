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


type FromElm =
	| {
		kind: 'extractScworldFile',
	}
	| {
		kind: 'loadChunksFile',
	}
	| {
		kind: 'switchedToEditor',
	}
	| {
		kind: 'saveScworld',
		fileName: string,
		projectFileContent: string,
	}
	| {
		kind: 'doSingleBlockAction',
		workerUrl: string,
		id: number,
	}
	| {
		kind: 'setSelectionMode',
		mode: rendering.SelectionMode,
	}
	| {
		kind: 'adjustCamera',
		adjustments: Array<rendering.CameraAdjustment>,
	};


app.ports.fromElmPort.subscribe(function(msg: FromElm) {
	switch (msg.kind) {
		case 'extractScworldFile':
			extractScworldFile();
			break;

		case 'loadChunksFile':
			loadChunksFile();
			break;

		case 'switchedToEditor':
			loadExtensions();
			startRendering();
			break;

		case 'saveScworld':
			saveScworld(msg.fileName, msg.projectFileContent);
			break;

		case 'doSingleBlockAction':
			extension.doSingleBlockAction(msg.workerUrl, msg.id);
			break;

		case 'setSelectionMode':
			rendering.setSelectionMode(msg.mode);
			break;

		case 'adjustCamera':
			rendering.adjustCamera(msg.adjustments);
			break;
	}
});


function extractScworldFile() {
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
}


function loadChunksFile() {
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


		// Importing is done
		initRender();
		app.ports.chunksReady.send(null);
	}
}


app.ports.startRendering.subscribe(function() {
	// Elm app is now in the Editor page
	extension.load(
		"https://editsc.pythonanywhere.com/dulldevBasics.js", app
	);

	rendering.initTouchControls(app);

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
			}, 50);
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
	zip.file(rootDir+"Chunks32h.dat", world.arrayBuffer);

	zip.generateAsync({type:'blob'}).then(function(blob: Blob) {
		download(blob, arg.fileName, "application/zip");
	});
});


app.ports.selectionState.subscribe(rendering.updateSelectMode);


app.ports.doSingleBlockAction.subscribe(function(action: any) {
	const pos = rendering.selector.position;
	const block = world.getBlockAt(-pos.z, pos.y, pos.x);

	if (block == undefined) {
		window.alert("Block is out of bounds");
		return;
	}

	/*rendering.scene.remove(rendering.chunkGroups[block.x]![block.z]!);
	rendering.forceRenderFrame();
	return;*/

	extension.extensions[action.url]!.worker.postMessage({
		kind: 'singleBlockAction',
		actionId: action.id,
		x: -pos.z,
		y: pos.y,
		z: pos.x,
		blockValue: block,
	});
});
