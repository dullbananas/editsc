// This is the end of the bundle file


module('Main',
['ZipExtractor', 'Wasm'],
async (ZipExtractor, Wasm) => {
    const port = Elm.Main.init().ports;


	port.toJs.subscribe(async (msg) => {
		switch (msg.$) {
            case 'startExtracting':
                const files = document.getElementById('scworldFile').files;
                switch (files.length) {
                    case 1:
                        const extractor = await ZipExtractor.create(files[0]);
                        /*port.importerPort.send({
                            $: 'gotFiles',
                            project: extractor.project,
                            chunks: extractor.chunks,
                        });*/
                        break;
                    default:
                        console.error("Invalid number of files uploaded");
                }
                break;

			default:
                console.error("Invalid msg name from elm: "+msg.$);
        }
	});


	return {};
});
