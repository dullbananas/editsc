import * as rendering from './rendering';
import * as main from './main';


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
		kind: 'log',
		value: any,
	};


function msg(m: Msg) {
	(self as any).postMessage(m);
}


function handleMsg(m: Msg, url: string, elmApp: any) {
	switch (m.kind) {
		/*case 'error':
			alert("An error occured in this extension: " + m.extensionUrl);
			//console.error(m.error);
			break;*/

		case 'alert':
			alert(m.content + " (from " + url + ")");
			break;

		case 'singleBlockAction':
			console.log('block action');
			elmApp.ports.newSingleBlockAction.send({
				id: m.id,
				name: m.name,
				icon: m.icon,
				url: url,
			});
			break;

		case 'setBlock':
			main.world.setBlockAt(m.x, m.y, m.z, m.newValue);
			const chunk = main.world.getChunkAt(m.x, m.z);
			if (chunk) {
				rendering.renderChunk(chunk);
			}
			break;

		case 'log':
			console.log(m.value);
			break;
	}
}


/*class SingleBlockAction {
	id: number;

	constructor(opt: any, id: number) {
		this.id = id;
	}
}*/


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


/*export class Block {
	#value: number;
	x: number;
	y: number;
	z: number;

	constructor(value: number, x: number, y: number, z: number) {
		this.#value = value;
		this.x = x;
		this.y = y;
		this.z = z;
	}

	get value(): number {
		return this.#value;
	}

	get typeId(): number {
		return this.#value & 0b1111111111;
	}
}*/


type Block = {
	x: number,
	y: number,
	z: number,
	value: number,
	typeId: number,
};


type EditscNs = {
	singleBlockActions: Record<number, (block: Block) => void | undefined>,
	nextSingleBlockId: number,

	onmessage: (event: MessageEvent) => void,

	log: (value: any) => void,
	a: (text: string) => void,
	singleBlockAction: (opt: SingleBlockOpts) => void,
};


// Creates the Editsc namespace available to extensions.
function editscNs(): EditscNs { return {
	singleBlockActions: {},
	nextSingleBlockId: 0,


	onmessage: function(event: MessageEvent) {
		const m: MsgToWorker = event.data;
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
		}
	},


	log: function(value: any) {
		msg({kind: 'log', value: value});
	},


	a: function(text: string) {
		msg({kind: 'alert', content: text});
	},


	singleBlockAction: function(opt: SingleBlockOpts) {
		// Generate a new unique id
		/*let id = 0;
		while (true) {
			this.log({id:id});
			let idAvailable = true;
			for (let existingId in this.singleBlockActions) {
				if (existingId == id) {
					idAvailable = false;
					break;
				}
			}
			if (idAvailable) {
				break;
			}
			id++;
		}*/

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


type Extension = {
	worker: Worker,
};


export let extensions: Record<string, Extension | undefined> = {};


export async function load(url: string, elmApp: any) {
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

	worker.onmessage = function(event) {
		handleMsg(event.data, url, elmApp);
	};
	worker.onerror = function(event) {
		alert("An error occured in this extension: " + url);
		console.error({extensionUrl: url, errorEvent: event});
	};

	extensions[url] = {
		worker: worker,
	};
}
