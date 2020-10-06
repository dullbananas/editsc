module('Wasm',
[],
async () => {
    const wasm = await import('./main-wasm.js');
    // wasm.default is the init function
    const {memory} = await wasm.default('./main.wasm');
    console.log(wasm, memory);

    
    wasm.set_panic_hook();
    
    
    return {
        ...wasm
    };
});
