// This is the end of the bundle file


module('Main',
['Filesystem'],
(Filesystem) => {
	const elm = Elm.Main.init();
	const port = elm.ports;


	port.toJs.subscribe(async (msg) => {
		switch (msg.$) {
			case 'ls':
				const response = await Filesystem.ls(msg.path);
				port.lsSub.send(response);
				break;

			default:
				console.error("Invalid msg name from elm: "+msg.$);
		}
	});


	return {};
});
