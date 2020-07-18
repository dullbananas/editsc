const JSZip = require('jszip');
//const download = require('downloadjs');


export default class WorldFile {
	chunks: ArrayBuffer;
	project: string;
	inputElement: HTMLInputElement;

	constructor(inputElement: HTMLInputElement) {
		this.chunks = new ArrayBuffer(0);
		this.project = "";
		this.inputElement = inputElement;
	}

	async init(reportError: any) {
		const files: FileList = this.inputElement.files!;
		console.log(files);
		switch (files.length) {
			case 1:
				const file: File = this.inputElement.files![0];
				const zip: any = await JSZip.loadAsync(file);
				console.log("Zip loaded");

				const chunksObj = zip.file(/Chunks32h\.dat$/)[0];
				const projectObj = zip.file(/Project\.xml$/)[0];
				console.log("Objects loaded");

				if ( chunksObj && projectObj ) {
					this.project = await projectObj.async('string');
					console.log("Loaded project string");
					this.chunks = await chunksObj.async('arraybuffer');
					console.log("Loaded chunks arraybuffer");
				}
				else {
					const filenames: Array<String> = [];
					for (const obj of zip.file(/.*/)) {
						filenames.push(obj.name);
					}

					reportError(
						"The world doesn't contain the right files. It might be from an unsupported"+
						"version of Survivalcraft. It only contains these files: "+
						filenames.join(", ")
					);
				}
				break;

			default:
				reportError("You must upload exactly 1 file, but you uploaded "+files.length+" files");
		}
	}

	async saveAs(zipName: string) {
		const zip = new JSZip();
		const rootDir: string = zipName.split(".")[0] + "/";

		zip.file(rootDir + "Project.xml", this.project);
		zip.file(rootDir + "Chunks32h.dat", this.chunks);

		const blob: Blob = await zip.generateAsync({type:'blob'});
		require('downloadjs')(blob, zipName, "application/zip");
	}
}
