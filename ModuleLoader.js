// This is the beginning of the bundle file
"use-strict";


const moduleDefs = {};
const loadedModules = {};


function module(name, imports, callback) {
	moduleDefs[name] = {
		imports: imports,
		callback: callback,
	};
}


async function importModule(name) {
	if (loadedModules[name]) {
		return loadedModules[name];
	}

	const def = moduleDefs[name];
	if (!def) {
		throw "Module not found: " + name;
	}

	const args = def.imports.map(importModule);
	const module = await def.callback.apply(null, args);
	loadedModules[name] = module;
	return module;
}
