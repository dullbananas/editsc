// World

import {World} from "./world";

let world: World = null;


// Initialize Elm

var Elm = require('./Main.elm').Elm;

let app = Elm.Main.init({
	node: document.getElementById('ui'),
});



// Ports

app.ports.loadWorld.subscribe(function(data) {
	function handleErr(err: string) {
		app.ports.worldLoadError.send(err);
	}
	try {
		world = new World(document.getElementById('scworld-input'), handleErr);
	}
	catch (err) {
		handleErr(err.message);
	}
});



// Make this file a module

export {};
