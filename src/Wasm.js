module('Wasm',
[],
async () => {
    // These functions will be available to wasm
    const imports = {};


    const {exports} = await (async () => {
        const response = await fetch("main.wasm");
        const code = await response.arrayBuffer();
        console.log(1);
        return (await WebAssembly.instantiate(code, {env:imports})).instance;
    })();
    console.log(exports);


    return {};
});
