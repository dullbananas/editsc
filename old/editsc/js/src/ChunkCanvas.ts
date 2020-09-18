// A web component for ChunkView's canvas


import ChunkView from './ChunkView';


export function initChunkCanvas(chunkView: ChunkView) {
	window.customElements.define("chunk-canvas", chunkCanvasClass(chunkView.canvas));
}


function chunkCanvasClass(canvas: HTMLElement) {
	return (class ChunkCanvas extends HTMLElement {
		constructor() {
			super();
			const shadow = this.attachShadow({mode: 'open'});
			canvas.style.width = "100%";
			canvas.style.height = "100%";
			shadow.appendChild(canvas);
		}
	});
}
