var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _value;
class Block {
    constructor(value = 1) {
        _value.set(this, void 0);
        __classPrivateFieldSet(this, _value, value);
    }
    get value() {
        return __classPrivateFieldGet(this, _value);
    }
    set value(newValue) {
        __classPrivateFieldSet(this, _value, newValue);
    }
    get typeId() {
        return __classPrivateFieldGet(this, _value) & 0b1111111111;
    }
}
_value = new WeakMap();
class BlockSelection extends Block {
    constructor(value, onchange) {
        super(value);
        this.onchange = onchange;
    }
    get value() {
        return super.value;
    }
    set value(newValue) {
        super.value = newValue;
        this.onchange(newValue);
    }
}
class BlockArray {
    constructor(w, h, d) {
        this.width = w;
        this.height = h;
        this.depth = d;
    }
}
class BlockArraySelection extends BlockArray {
    constructor(opt) {
        super(0, 0, 0);
        this.x1 = opt.x1;
        this.y1 = opt.y1;
        this.z1 = opt.z1;
        this.x2 = opt.x2;
        this.y2 = opt.y2;
        this.z2 = opt.z2;
        this.onfill = opt.onfill;
    }
    fill(block) {
        this.onfill(block.value);
    }
}
const Editsc = new (class EditscNs {
    constructor() {
        this.singleBlockActions = [];
        this.blockArrayActions = [];
        this.blockInputCallbacks = [];
        this.buttonCallbacks = [];
        //this.ui = [];
    }
    sendMsg(msg) {
        self.postMessage(msg);
    }
    handleMsg(msg) {
        this.log(msg);
        switch (msg.kind) {
            case 'doSingleBlockAction':
                const selection = new BlockSelection(msg.blockValue, (newValue) => {
                    this.sendMsg({
                        kind: 'setBlock',
                        x: msg.x,
                        y: msg.y,
                        z: msg.z,
                        newValue: newValue,
                    });
                });
                this.singleBlockActions[msg.actionId](selection);
                break;
            case 'doBlockArrayAction':
                const arraySelection = new BlockArraySelection({
                    x1: msg.x1, y1: msg.y1, z1: msg.z1,
                    x2: msg.x2, y2: msg.y2, z2: msg.z2,
                    onfill: (block) => {
                        this.sendMsg({
                            kind: 'fill',
                            x1: msg.x1, y1: msg.y1, z1: msg.z1,
                            x2: msg.x2, y2: msg.y2, z2: msg.z2,
                            newValue: block,
                        });
                    },
                });
                this.blockArrayActions[msg.actionId](arraySelection);
                break;
            case 'buttonClicked':
                this.buttonCallbacks[msg.callbackId]();
                break;
            case 'blockInputChanged':
                this.blockInputCallbacks[msg.callbackId](new Block(msg.newValue));
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
    blockInput(opt) {
        const id = this.blockInputCallbacks.length;
        this.blockInputCallbacks.push(opt.onchange);
        return {
            kind: 'blockInput',
            name: opt.name,
            callbackId: id,
        };
    }
    button(opt) {
        const id = this.buttonCallbacks.length;
        this.buttonCallbacks.push(opt.onclick);
        return {
            kind: 'button',
            name: opt.name,
            icon: opt.icon,
            callbackId: id,
        };
    }
    showUi(title, components) {
        this.sendMsg({ kind: 'showUi', title: title, components: components });
    }
    log(value) {
        try {
            this.sendMsg({ kind: 'log', value: value });
        }
        catch (e) {
            this.sendMsg({ kind: 'log', value: "Value cannot be logged becuasae it is not clonable." });
        }
    }
    a(text) {
        this.sendMsg({ kind: 'alert', content: text });
    }
    singleBlockAction(opt) {
        const id = this.singleBlockActions.length;
        this.singleBlockActions.push(opt.onclick);
        this.sendMsg({
            kind: 'newAction', actionType: 'block',
            id: id, name: opt.name, icon: opt.icon
        });
    }
    blockArrayAction(opt) {
        const id = this.blockArrayActions.length;
        this.blockArrayActions.push(opt.onclick);
        this.sendMsg({
            kind: 'newAction', actionType: 'blockArray',
            id: id, name: opt.name, icon: opt.icon
        });
    }
})();
self.onmessage = function (event) {
    Editsc.handleMsg(event.data);
};
