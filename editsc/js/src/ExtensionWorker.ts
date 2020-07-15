// main() is defined by the extension
declare const main: () => void;


export type MsgToExtension =
	| {
		kind: 'doSingleBlockAction',
		actionId: number,
		x: number,
		y: number,
		z: number,
		blockValue: number,
	}
	| {
		kind: 'buttonClicked',
		callbackId: number,
	}
	| {
		kind: 'blockInputChanged',
		callbackId: number,
		newValue: number,
	}
	| {
		kind: 'init',
		url: string,
	};


export type MsgFromExtension =
	| {
		kind: 'alert',
		content: string,
	}
	| {
		kind: 'newSingleBlockAction',
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
		title: string,
		components: Array<UiComponent>,
	}
	| {
		kind: 'log',
		value: any,
	};


type SingleBlockOpts = {
	name: string,
	icon: string,
	onclick: (block: any) => void,
};


type UiComponent =
	| {
		kind: 'blockInput',
		name: string,
		callbackId: number,
	}
	| {
		kind: 'button',
		name: string,
		icon: string,
		callbackId: number,
	};


class Block {
	#value: number;

	constructor(value = 1) {
		this.#value = value;
	}

	get value(): number {
		return this.#value;
	}

	set value(newValue: number) {
		this.#value = newValue;
	}

	get typeId(): number {
		return this.#value & 0b1111111111;
	}
}


class BlockSelection extends Block {
	onchange: (newValue: number) => void

	constructor(value: number, onchange: (newValue: number) => void) {
		super(value);
		this.onchange = onchange;
	}

	get value(): number {
		return super.value;
	}

	set value(newValue: number) {
		super.value = newValue;
		this.onchange(newValue);
	}
}


const Editsc = new (class EditscNs {
	singleBlockActions: Array<(selection: BlockSelection) => void>;
	//ui: Array<UiComponent>;
	blockInputCallbacks: Array<(block: Block) => void>;
	buttonCallbacks: Array<() => void>;

	constructor() {
		this.singleBlockActions = [];
		this.blockInputCallbacks = [];
		this.buttonCallbacks = [];
		//this.ui = [];
	}

	sendMsg(msg: MsgFromExtension) {
		(self.postMessage as any)(msg);
	}

	handleMsg(msg: MsgToExtension): void {
		this.log(msg);
		switch (msg.kind) {
			case 'doSingleBlockAction':
				const selection = new BlockSelection(
					msg.blockValue,
					(newValue: number) => { this.sendMsg({
						kind: 'setBlock',
						x: msg.x,
						y: msg.y,
						z: msg.z,
						newValue: newValue,
					}); }
				);
				this.singleBlockActions[msg.actionId]!(selection);
				break;

			case 'buttonClicked':
				this.buttonCallbacks[msg.callbackId]!();
				break;

			case 'blockInputChanged':
				this.blockInputCallbacks[msg.callbackId]!(new Block(msg.newValue));
				break;

			case 'init':
				try {
					self.importScripts(msg.url);
					main();
				}
				catch (e) {
					throw e;
				}
				break;

			//default:
				//this.log("Invalid msg.kind: "+(msg as MsgToExtension).kind)
		}
	}

	blockInput(opt: {name: string, onchange: (newBlock: Block) => void}): UiComponent {
		const id = this.blockInputCallbacks.length;
		this.blockInputCallbacks.push(opt.onchange);
		return {
			kind: 'blockInput',
			name: opt.name,
			callbackId: id,
		};
	}

	button(opt: {name: string, icon: string, onclick: () => void}): UiComponent {
		const id = this.buttonCallbacks.length;
		this.buttonCallbacks.push(opt.onclick);
		return {
			kind: 'button',
			name: opt.name,
			icon: opt.icon,
			callbackId: id,
		};
	}

	showUi(title: string, components: Array<UiComponent>) {
		/*this.ui = components;
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
		}*/
		this.sendMsg({kind: 'showUi', title: title, components: components});
	}

	log(value: any) {
		try {
			this.sendMsg({kind: 'log', value: value});
		}
		catch (e) {
			this.sendMsg({kind: 'log', value: "Value cannot be logged becuasae it is not clonable."});
		}
	}

	a(text: string) {
		this.sendMsg({kind: 'alert', content: text});
	}

	singleBlockAction(opt: SingleBlockOpts) {
		const id: number = this.singleBlockActions.length;
		this.singleBlockActions.push(opt.onclick);
		this.sendMsg({
			kind: 'newSingleBlockAction',
			id: id, name: opt.name, icon: opt.icon
		});
	}
})();


self.onmessage = function(event: MessageEvent) {
	Editsc.handleMsg(event.data);
};
