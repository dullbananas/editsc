module('Filesystem',
[],
() => {
	// FS constructor from isomorphic-git/lightning-fs
	const fs = new FS("main");


	function joinPath(path) {
		return path.join("/");
	}


	async function ls(path) {
		const pathStr = joinPath(path);
		const allChildren = await new Promise(
			r => fs.readdir(joinPath(path), undefined, r)
		);
		const files = [];
		const dirs = [];

		for (const childName of allChildren) {
			const childPath = pathStr + "/" + childName;
			const info = await new Promise(
				r => fs.stat(childPath, undefined, r)
			);
			switch (info.type) {
				case 'file':
					files.push(childName);
					break;

				case 'dir':
					dirs.push(childName);
					break;
			}
		}

		return {files: files, dirs: dirs};
	}


	return {
		ls: ls,
	};
});
