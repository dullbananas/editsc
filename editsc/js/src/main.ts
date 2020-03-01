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
	try {
		world = new World(document.getElementById('scworld-input'));
	}
	catch (err) {
		app.ports.worldLoadError.send(err.message);
	}
});



// Make this file a module

export {};
