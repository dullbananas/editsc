import ChunkWorld from './ChunkWorld';
import ChunkView from './ChunkView';
import {MsgToExtension, MsgFromExtension} from './ExtensionWorker';


export default class ExtensionManager {
	private workers: Record<string, Worker>;
	private sendToElm: any;
	private chunkWorld: ChunkWorld;
	private chunkView: ChunkView;

	constructor(sendToElm: any, chunkWorld: ChunkWorld, chunkView: ChunkView) {
		this.workers = {};
		this.sendToElm = sendToElm;
		this.chunkWorld = chunkWorld;
		this.chunkView = chunkView;
	}

	// for type safety
	private sendMsg(worker: Worker, msg: MsgToExtension) {
		console.log("Sending msg brb");
		console.log(msg);
		worker.postMessage(msg);
	}

	async load(url: string) {
		const worker = new Worker("../static/ExtensionWorker.js");

		worker.onmessage = (event) => {
			this.handleMsg(event.data, url);
		};
		worker.onerror = (event) => {
			alert("An error occured in this extension: " + url);
			console.error({extensionUrl: url, errorEvent: event});
		};

		this.sendMsg(worker, {
			kind: 'init',
			url: url,
		});

		this.workers[url] = worker;
	}

	triggerAction(workerUrl: string, id: number, actionType: ActionType) {
		switch (actionType) {
			case 'block':
				const pos = this.chunkView.singleBlockSelectorPosition;
				const block = this.chunkWorld.getBlockAt(pos.x, pos.y, pos.z);
				if (block == undefined) {
					window.alert("Block is out of bounds");
					return;
				}
				this.sendMsg(this.workers[workerUrl]!, {
					kind: 'doSingleBlockAction',
					actionId: id,
					x: pos.x,
					y: pos.y,
					z: pos.z,
					blockValue: block,
				});
				break;

			case 'blockArray':
				const p1 = this.chunkView.arrayCorner1;
				const p2 = this.chunkView.arrayCorner2;
				this.sendMsg(this.workers[workerUrl]!, {
					kind: 'doBlockArrayAction',
					actionId: id,
					x1: p1.x,
					y1: p1.y,
					z1: p1.z,
					x2: p2.x,
					y2: p2.y,
					z2: p2.z,
				});
				break;
		}
	}

	triggerButton(url: string, id: number) {
		this.sendMsg(this.workers[url]!, {
			kind: 'buttonClicked',
			callbackId: id,
		});
	}

	updateBlockInput(url: string, id: number, newValue: number) {
		console.log("()()()()()()()()()()()()");
		this.sendMsg(this.workers[url]!, {
			kind: 'blockInputChanged',
			callbackId: id,
			newValue: newValue,
		});
	}

	async handleMsg(m: MsgFromExtension, url: string) {
		console.log(m);
		switch (m.kind) {
			case 'alert':
				alert(m.content + " (from " + url + ")");
				break;

			case 'newAction':
				console.log('block action');
				this.sendToElm({
					kind: 'newAction',
					id: m.id,
					name: m.name,
					icon: m.icon,
					workerUrl: url,
					actionType: m.actionType,
				});
				break;

			case 'showUi':
				this.sendToElm({
					kind: 'showUi',
					url: url,
					title: m.title,
					components: m.components,
				});
				break;

			case 'setBlock':
				this.chunkWorld.setBlockAt(m.x, m.y, m.z, m.newValue);
				const chunk = this.chunkWorld.getChunkAt(m.x, m.z);
				if (chunk) {
					this.chunkView.updateChunk(chunk);
					console.log('set da block');
				}
				else {
					window.alert("chunk out of bounds");
				}
				break;

			case 'fill':
				/*const updatedChunks: Array<Chunk> = */this.chunkWorld.fillBlocks(
					m.x1, m.y1, m.z1, m.x2, m.y2, m.z2, m.newValue
				);
				for (const chunk of this.chunkWorld.chunks) {
					console.log(chunk);
					await this.chunkView.updateChunk(chunk);
				}
				break;

			case 'log':
				console.log(m.value);
				break;

			default:
				console.error("Invalid message kind from extension");
		}
	}
}


export type ActionType =
	| 'block'
	| 'blockArray';
