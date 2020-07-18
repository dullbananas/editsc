export function waitForWorker(worker: Worker): Promise<any> {
	return new Promise(resolve => {
		worker.onmessage = (event) => { resolve(event.data) };
	});
}
