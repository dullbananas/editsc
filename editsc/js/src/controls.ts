// Handles keyboard controls


import * as rendering from './rendering';


// Holds variables describing current state of pressed keys
export namespace KeysState {
	export var keys: any = {}; // Object mapping keys to booleans telling whether or not they're down
	export var intervals: any = {}; // Same thing but the values are the return value of winow.setInterval
	export var keyCount: number = 0; // Number of keys that are down
}


export function handleKeyDown(event) {
	if (!KeysState.keys[event.key]) {
		let n = 1;
		KeysState.intervals[event.key] = window.setInterval(function() {
			switch (event.key) {
				case 'w':
					rendering.Objects.camera.translateZ(-n);
					break;
				case 's':
					rendering.Objects.camera.translateZ(n);
					break;
				case 'a':
					rendering.Objects.camera.translateX(-n);
					break;
				case 'd':
					rendering.Objects.camera.translateX(n);
					break;
				case 'q':
					rendering.Objects.camera.translateY(-n);
					break;
				case 'e':
					rendering.Objects.camera.translateY(n);
					break;
			}
			rendering.Objects.pointLight.position.set(
				rendering.Objects.camera.position.x,
				rendering.Objects.camera.position.y,
				rendering.Objects.camera.position.z,
			);
		}, 1000/60);
		KeysState.keys[event.key] = true;
		KeysState.keyCount += 1;
	}
}


export function handleKeyUp(event) {
	KeysState.keys[event.key] = false;
	window.clearInterval(KeysState.intervals[event.key]);
	KeysState.keyCount -= 1;
}

