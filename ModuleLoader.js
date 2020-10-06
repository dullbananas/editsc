// This is the beginning of the bundle file
"use-strict";


const loadedModules = {};
const moduleDefs = {};


function logErr(e) {
    const props = ['name', 'message', 'stack', 'lineNumber'];
    const result = {};
    for (const p of props) {
        result[p] = e[p];
    }
    console.log(result);
}


// Circular imports are not allowed
function module(name, imports, callback) {
    moduleDefs[name] = {
        imports: imports,
        callback: (...args) => {
            console.log("Loading "+name);
            try {
                return callback(...args);
            }
            catch(e) {
                console.error("Could not load module: "+name);
                logErr(e);
                throw e;
            }
        },
    };
}


async function importModule(name) {
    //console.log("Importing "+name);

    // Only load module once
    if (loadedModules.hasOwnProperty(name)) {
        return loadedModules[name];
    }

    // Load module definition if it exists
    if (!(moduleDefs.hasOwnProperty(name))) {
        throw "Module not found: "+name;
    }
    const def = moduleDefs[name];

    // Load if it has no imports
    if (def.imports.length === 0) {
        const mod = await def.callback();
        loadedModules[name] = mod;
        return mod;
    }

    // Import required modules if module has imports
    const args = [];
    for (const importName of def.imports) {
        args.push(await importModule(importName));
    }

    const mod = await def.callback(...args);
    loadedModules[name] = mod;
    return mod;
}
