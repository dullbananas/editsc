// Messages sent from an extension worker
type Msg =
	| {
		kind: 'alert',
		content: string,
	};


function msg(m: Msg) {
	(self as any).postMessage(m);
}


function handleMsg(m: Msg) {
	switch (m.kind) {
		case 'alert':
			alert(m.content);
			break;
	}
}


// Creates the Editsc namespace available to extensions.
function editscNs() {
	return {
		a: function(text: string) {
			msg({kind: 'alert', content: text});
		}
	};
}


export async function load(url: string) {
	const code: string = `
		${msg.toString()}
		var Editsc = (${editscNs.toString()})();
		self.importScripts(${JSON.stringify(url)});
	`;
	console.log(code);
	const blob = new Blob([code], {'type': 'application/javascript'});
	const worker = new Worker(window.URL.createObjectURL(blob));

	worker.onmessage = function(event) {
		handleMsg(event.data);
	};
	worker.onerror = function(event) {
		throw event;
	}
}
