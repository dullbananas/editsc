// This is the end of the bundle file


module('Main',
['Wasm'],
async (Wasm) => {
    const port = Elm.Main.init().ports;


	port.toJs.subscribe(async (msg) => {
		switch (msg.$) {
            case 'startExtracting':
                console.log('extract');
                break;

			default:
                console.error("Invalid msg name from elm: "+msg.$);
        }
	});


	return {};
});
