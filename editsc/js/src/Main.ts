import ExtensionManager, {ActionType} from './Extension';
import ChunkWorld from './ChunkWorld';
import ChunkView, {SelectionMode, CameraAdjustment} from './ChunkView';
import WorldFile from './WorldFile'


const Elm = require('./Main.elm').Elm;

const elmApp = Elm.Main.init({
	node: document.getElementById('ui'),
});

Elm.Styles.init({
	node: document.getElementById('style'),
});


const chunkWorld = new ChunkWorld();

const chunkView = new ChunkView(
	document.getElementById('world-canvas') as HTMLCanvasElement,
	//sendToElm,
);

let worldFile: WorldFile | null = null;

const extensionManager = new ExtensionManager(sendToElm, chunkWorld, chunkView);


function sendToElm(msg: any) {
	elmApp.ports.toElmPort.send(msg);
}


elmApp.ports.fromElmPort.subscribe(function(msg: FromElm) {
	handleMsg(msg);
});


async function handleMsg(msg: FromElm) {
	if (msg.kind != 'adjustCamera') {
		console.log(msg);
	}
	//console.log(typeof msg.kind);
	switch (msg.kind) {
		case 'extractScworldFile':
			//console.log("a");
			worldFile = new WorldFile(
				document.getElementById('scworld-input') as HTMLInputElement
			);
			//console.log("b");
			await worldFile.init( (errMsg: string) => {
				console.error(errMsg);
				sendToElm({kind: 'importError', message: errMsg});
			});
			//console.log("c");
			sendToElm({
				kind: 'gotProjectFile',
				content: worldFile.project,
			});
			//console.log("extracted.");
			break;

		case 'loadChunksFile':
			try {
				await chunkWorld.loadArrayBuffer(worldFile!.chunks);
				sendToElm({kind: 'chunksFileLoaded'});
			}
			catch (err) {
				sendToElm({
					kind: 'importError',
					message: "Chunks file contains invalid data. It might be corrupted",
				});
				console.error(err);
			}
			break;

		case 'switchedToEditor':
			extensionManager.load("https://editsc.pythonanywhere.com/dulldevBasics.js");
			chunkView.initWorld(chunkWorld, (soFar: number, max: number) => {
				sendToElm({
					kind: 'progress',
					portion: soFar/max,
				});
			});
			break;

		case 'saveScworld':
			if (worldFile) {
				worldFile.chunks = chunkWorld.arrayBuffer;
				worldFile.project = msg.projectFileContent;
				worldFile.saveAs(msg.fileName);
			}
			break;

		case 'doAction':
			extensionManager.triggerAction(msg.workerUrl, msg.id, msg.actionType);
			console.log('did action');
			break;

		case 'triggerButton':
			extensionManager.triggerButton(msg.extensionUrl, msg.callbackId);
			break;

		case 'updateBlockInput':
			console.log("BRRRRRRRRRRRR DOING IT");
			console.log([msg.extensionUrl, msg.callbackId, msg.newValue]);
			extensionManager.updateBlockInput(msg.extensionUrl, msg.callbackId, msg.newValue);
			console.log("BRRRRR RRRRR DID IT");
			break;

		case 'setSelectionMode':
			chunkView.selectionMode = msg.mode;
			break;

		case 'adjustCamera':
			for (const adjustment of msg.adjustments) {
				chunkView.adjustCamera(adjustment);
			}
			break;

		default:
			throw "Invalid message kind from elm";
			console.log((msg as FromElm).kind);
	}
}


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
		kind: 'doAction',
		workerUrl: string,
		id: number,
		actionType: ActionType,
	}
	| {
		kind: 'triggerButton',
		extensionUrl: string,
		callbackId: number,
	}
	| {
		kind: 'updateBlockInput',
		extensionUrl: string,
		callbackId: number,
		newValue: number,
	}
	| {
		kind: 'setSelectionMode',
		mode: SelectionMode,
	}
	| {
		kind: 'adjustCamera',
		adjustments: Array<CameraAdjustment>,
	};
