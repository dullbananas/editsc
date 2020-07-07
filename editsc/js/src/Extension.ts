import ChunkWorld from './ChunkWorld';
import ChunkView from './ChunkView';


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

	async load(url: string) {
		const code: string = `
			'use-strict';

			${msg.toString()}

			var Editsc = (
				${editscNs.toString()}
			)();

			self.onmessage = (m) => {Editsc.onmessage(m)};

			try {
				self.importScripts(
					${JSON.stringify(url + "?" + Date.now())}
				);
				main();
			}
			catch (e) {
				throw e;
			}
		`;
		console.log(code);
		const blob = new Blob([code], {'type': "application/javascript"});
		const worker = new Worker(window.URL.createObjectURL(blob));

		worker.onmessage = (event) => {
			this.handleMsg(event.data, url);
		};
		worker.onerror = (event) => {
			alert("An error occured in this extension: " + url);
			console.error({extensionUrl: url, errorEvent: event});
		};

		this.workers[url] = worker;
	}

	doSingleBlockAction(workerUrl: string, id: number) {
		const pos = this.chunkView.singleBlockSelectorPosition;
		console.log(pos);
		const block = this.chunkWorld.getBlockAt(pos.x, pos.y, pos.z);
		console.log('uwuowo');

		if (block == undefined) {
			window.alert("Block is out of bounds");
			return;
		}
		console.log('uwu2');

		console.log(this);
		console.log(this.workers);
		this.workers[workerUrl]!.postMessage({
			kind: 'singleBlockAction',
			actionId: id,
			x: pos.x,
			y: pos.y,
			z: pos.z,
			blockValue: block,
		});
		console.log('uwu3');
	}

	handleMsg(m: Msg, url: string) {
		console.log(m);
		switch (m.kind) {
			case 'alert':
				alert(m.content + " (from " + url + ")");
				break;

			case 'singleBlockAction':
				console.log('block action');
				this.sendToElm({
					kind: 'newSingleBlockAction',
					id: m.id,
					name: m.name,
					icon: m.icon,
					workerUrl: url,
				});
				break;

			case 'showUi':
				this.sendToElm({
					kind: 'showUi',
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

			case 'log':
				console.log(m.value);
				break;

			default:
				console.error("Invalid message kind from extension");
		}
	}
}


// Messages sent from an extension worker
type Msg =
	| {
		kind: 'alert',
		content: string,
	}
	| {
		kind: 'singleBlockAction',
		id: number,
		name: string,
		icon: string,
	}
	| {
		kind: 'setBlock',
		x: number,
		y: number,
		z: number,
		newValue: number,
	}
	| {
		kind: 'showUi',
		components: Array<UiComponentMsg>,
	}
	| {
		kind: 'log',
		value: any,
	};


function msg(m: Msg) {
	(self as any).postMessage(m);
}


type SingleBlockOpts = {
	name: string,
	icon: string,
	onclick: (block: any) => void,
};


type MsgToWorker =
	| {
		kind: 'singleBlockAction',
		actionId: number,
		x: number,
		y: number,
		z: number,
		blockValue: number,
	};


type Block = {
	x: number,
	y: number,
	z: number,
	value: number,
	typeId: number,
};


type UiComponent =
	| {
		kind: 'blockInput',
		name: string,
		onchange: (value: number) => void,
	}
	| {
		kind: 'button',
		name: string,
		icon: string,
		onclick: () => void,
	};


// Used to send UI components to Elm
type UiComponentMsg =
	| {
		kind: 'blockInput',
		name: string,
	}
	| {
		kind: 'button',
		name: string,
		icon: string,
	};


type EditscNs = {
	singleBlockActions: Record<number, (block: Block) => void | undefined>,
	nextSingleBlockId: number,
	ui: Array<UiComponent>,

	onmessage: (event: MessageEvent) => void,

	blockInput: (opt: {name: string, onchange: (value: number) => void}) => UiComponent,
	button: (opt: {name: string, icon: string, onclick: () => void}) => UiComponent,

	log: (value: any) => void,
	a: (text: string) => void,
	singleBlockAction: (opt: SingleBlockOpts) => void,
	showUi: (components: Array<UiComponent>) => void,
};


// Creates the Editsc namespace available to extensions.
function editscNs(): EditscNs { return {
	singleBlockActions: {},
	nextSingleBlockId: 0,
	ui: [],


	onmessage: function(event: MessageEvent) {
		const m: MsgToWorker = event.data;
		this.log(m);
		switch (m.kind) {
			case 'singleBlockAction':
				let _value: number = m.blockValue; // private
				let block = {};
				const prop = Object.defineProperty;

				prop(block, 'x', {value: m.x, writable: false});
				prop(block, 'y', {value: m.y, writable: false});
				prop(block, 'z', {value: m.z, writable: false});

				prop(block, 'value', {
					get: () => {
						return _value;
					},
					set: (newValue) => {
						_value = newValue;
						msg({
							kind: 'setBlock',
							x: m.x,
							y: m.y,
							z: m.z,
							newValue: newValue,
						});
						this.log("set block.");
					}
				});
				prop(block, 'typeId', {
					get: function() {
						return _value & 0b1111111111;
					}
				});

				this.singleBlockActions[m.actionId]!(block as Block);
				break;

			default:
				throw "Invalid message sent to extension";
		}
	},


	blockInput: function(opt: {name: string, onchange: (value: number) => void}): UiComponent {
		return {
			kind: 'blockInput',
			name: opt.name,
			onchange: opt.onchange,
		};
	},


	button: function(opt: {name: string, icon: string, onclick: () => void}): UiComponent {
		return {
			kind: 'button',
			name: opt.name,
			icon: opt.icon,
			onclick: opt.onclick,
		};
	},


	showUi: function(components: Array<UiComponent>) {
		this.ui = components;
		const uiMsg: Array<UiComponentMsg> = [];
		for (const component of components) {
			switch (component.kind) {
				case 'blockInput':
					uiMsg.push({
						kind: 'blockInput',
						name: component.name,
					});
					break;

				case 'button':
					uiMsg.push({
						kind: 'button',
						name: component.name,
						icon: component.icon,
					});
					break;
			}
		}
		msg({kind: 'showUi', components: uiMsg});
	},


	log: function(value: any) {
		msg({kind: 'log', value: value});
	},


	a: function(text: string) {
		msg({kind: 'alert', content: text});
	},


	singleBlockAction: function(opt: SingleBlockOpts) {
		const id = this.nextSingleBlockId;
		this.nextSingleBlockId++;

		this.singleBlockActions[id] = opt.onclick;
		this.log({id:id});
		msg({
			kind: 'singleBlockAction',
			id: id, name: opt.name, icon: opt.icon
		});
	},
};}
