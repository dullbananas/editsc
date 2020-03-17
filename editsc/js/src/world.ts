var zip = require('zip-js/WebContent/zip').zip;
zip.useWebWorkers = false;



// Represents the whole world
export class World {
	version: string;

	constructor(fileInput, handleErr) {
		if (fileInput.files.length != 1) {
			throw new Error('You must upload exactly one file.');
		}

		let file: File = fileInput.files[0];
		let blobReader = new zip.BlobReader(file);
		zip.createReader(blobReader, function(reader) {
			reader.getEntries(function(entries) {
				// This runs when the entries are ready to be accessed
				try {
					entries.forEach(function(entry) {
						// This code runs for every entry (file) in the zip archive
						console.log(entry.filename);
					});
					throw new Error('Not implemented');
				}
				catch (err) {
					handleErr(err.message);
				}
			});
		}, function(err) {
			// Runs when an error occurs
			handleErr('Could not extract zip contents: ' + err);
		});
	}
}
