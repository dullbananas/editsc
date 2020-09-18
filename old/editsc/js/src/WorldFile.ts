const JSZip = require('jszip');
//const download = require('downloadjs');


export interface StreamHelper {
	on(event: 'data'|'error'|'end', callback: any): void;
	resume(): void;
	pause(): void;
}


export default class WorldFile {
	chunksBlob: Blob;
	chunksStreamHelper: StreamHelper | null;
	project: string;
	inputElement: HTMLInputElement;

	constructor(inputElement: HTMLInputElement) {
		this.chunksBlob = new Blob([]);
		this.project = "";
		this.inputElement = inputElement;
		this.chunksStreamHelper = null;
	}

	async init(reportError: any) {
		const files: FileList = this.inputElement.files!;
		console.log(files);
		switch (files.length) {
			case 1:
				const file: File = this.inputElement.files![0];
				const zip: any = await JSZip.loadAsync(file);

				const chunksObj = zip.file(/Chunks32h\.dat$/)[0];
				const projectObj = zip.file(/Project\.xml$/)[0];

				if ( chunksObj && projectObj ) {
					this.project = await projectObj.async('string');
					//this.chunks = await chunksObj.async('arraybuffer');
					this.chunksStreamHelper = chunksObj.internalStream('arraybuffer') as StreamHelper;
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
		console.log('ss0');
		const zip = new JSZip();
		const rootDir: string = zipName.split(".")[0] + "/";
		console.log('ss1');

		zip.file(rootDir + "Project.xml", this.project);
		zip.file(rootDir + "Chunks32h.dat", this.chunksBlob);

		console.log('ss2');
		const blob: Blob = await zip.generateAsync({type:'blob'});
		//require('downloadjs')(blob, zipName, "application/zip");
		console.log('ss3');
		require('downloadjs')(blob, zipName);
	}
}
