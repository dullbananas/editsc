import * as THREE from 'three';

import ChunkWorld, {Chunk, createChunkWorker} from './ChunkWorld';
import * as Block from './Block';
import BlockType from './Block';
import {BlockCondition, WorkerMsg} from './ChunkWorker';


export default class ChunkView {
	constructor() {
		this.initScene();
		this.initCamera();
		this.initRenderer();

		this.initLight();
		this.initAdjustmentVectors();
		this.initSelector();
		this.chunkGroups = {};
		this.updateCount = 0;

		this.updateSize();
		this.renderNeeded = true;
		this.lightNeedsUpdate = true;
		this.renderLoop();
	}

	private scene: THREE.Scene;
	initScene() {
		this.scene = new THREE.Scene();
		this.scene.autoUpdate = true;
		this.scene.frustumCulled = false;
		this.scene.fog = new THREE.Fog(0xf0f0f0, 256-32, 256);
		this.scene.background = new THREE.Color(0xf0f0f0);
	}

	private camera: THREE.PerspectiveCamera;
	initCamera() {
		const fieldOfView = 60;
		const aspectRatio = window.innerWidth / window.innerHeight;
		const nearClippingPlane = 0.1;
		const farClippingPlane = 256;
		this.camera = new THREE.PerspectiveCamera(
			fieldOfView, aspectRatio, nearClippingPlane, farClippingPlane
		);
		this.camera.matrixAutoUpdate = false;

		this.updateSize();
		window.onresize = () => {
			this.updateSize();

			// This is needed to make sure the size is correct
			window.setTimeout(() => {this.updateSize();}, 200);
		};
	}

	async updateSize() {
		const width: number = window.innerWidth * this.pixelDensity;
		const height: number = window.innerHeight * this.pixelDensity;

		const PreventStyleChange = false;
		this.renderer.setSize(width, height, PreventStyleChange);
		this.camera.aspect = window.innerWidth / window.innerHeight;

		this.camera.updateProjectionMatrix();
		this.refresh();
		window.scrollTo(0, 0);
		document.body.style.height = window.innerHeight + "px";
	}


	canvas: HTMLElement;
	private pixelDensity: number;
	private renderer: THREE.WebGLRenderer;
	initRenderer() {
		this.renderer = new THREE.WebGLRenderer({
			stencil: false,
			antialias: true,
			powerPreference: 'low-power',
		});
		this.canvas = this.renderer.domElement;
		this.pixelDensity = Math.trunc(window.devicePixelRatio);
	}

	private directionalLight: THREE.DirectionalLight;
	initLight() {
		// ambient light
		this.scene.add(new THREE.AmbientLight(0xffffff, 1));
		// directional light
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
		this.directionalLight.matrixAutoUpdate = false;
		// directional light target
		this.directionalLight.target = new THREE.Object3D();
		this.directionalLight.target.matrixAutoUpdate = false;
		// add directional light
		this.scene.add(this.directionalLight.target, this.directionalLight);
	}

	refresh() {
		this.renderNeeded = true;
	}

	// Holds groups that contain geometry for each chunk.
	// Indexed by [chunkX][chunkZ]
	private chunkGroups: Record<number,
		Record<number,
			THREE.Group | undefined
		> | undefined
	>;
	private updateCount: number;

	async updateChunk(chunk: Chunk) {
		const worker: Worker = await createChunkWorker();
		await this.updateChunkWithWorker(chunk, worker);
		worker.terminate();
	}

	async updateChunkWithWorker(chunk: Chunk, worker: Worker) {
		if (!this.chunkGroups[chunk.x]) {
			this.chunkGroups[chunk.x] = {};
		}
		if(this.chunkGroups[chunk.x]![chunk.z]) {
			this.scene.remove(this.chunkGroups[chunk.x]![chunk.z]!);
		}

		//const worker: Worker = await chunk.createWorker();
		chunk.initWorker(worker);

		const group = new THREE.Group();
		this.scene.add(group);
		this.chunkGroups[chunk.x]![chunk.z] = group;

		//console.log(BlockType.all);
		for (const btype of BlockType.all) {
			const condition = (b: number) => btype.id === (b & 0b1111111111);
			const wcondition: BlockCondition = btype.condition;

			// check if any blocks are the right type
			const anyMsg: WorkerMsg = {kind: 'any', condition: wcondition};
			worker.postMessage(anyMsg);
			const anyBlocks: boolean = await new Promise(resolve => {
				worker.onmessage = event => { resolve(event.data as boolean) }
			});
			if (!anyBlocks) {
				continue;
			}

			// face count
			const faceCountMsg: WorkerMsg = {kind: 'countFaces', condition: wcondition};
			worker.postMessage(faceCountMsg);
			const faceCount: number = await new Promise(resolve => {
				worker.onmessage = event => { resolve(event.data as number) }
			});

			const mesh: THREE.InstancedMesh = await btype.chunkMesh(faceCount);
			mesh.position.set(chunk.z << 4, 0, -(chunk.x << 4));

			let meshIndex = 0;
			const blockFacesMsg: WorkerMsg = {kind: 'getBlockFaces', condition: wcondition};
			//console.log(69);
			worker.postMessage(blockFacesMsg);
			//console.log(70);
			const facesBuffer: ArrayBuffer = await new Promise(resolve => {
				worker.onmessage = event => { resolve(event.data as ArrayBuffer) }
			});
			//console.log(71);
			const blockFaces = new Uint8Array(facesBuffer);
			//console.log(72);

			for (let i = 0; i < 65536; i++) {
				//console.log(100000000+i);
				const faces: number = blockFaces[i];
				if (faces !== 0b000000) {
					// Extract coordinates from index
					const x = (i>>8)&15;
					const y = i&255;
					const z = -((i>>12)&15);
					for (let facei = 0; facei < 6; facei++) {
						if (faces & (1<<facei)) {
							Block.addFace(
								meshIndex,
								mesh,
								facei as Block.Face,
								x, y, z
							);
							meshIndex++;
						}
					}
				}
				if (meshIndex > faceCount) {
					break;
				}
			}

			mesh.updateMatrix();
			mesh.instanceMatrix.needsUpdate = true;
			group.add(mesh);
			//this.refresh();
			//this.renderer.render(this.scene, this.camera);
		}
		//worker.terminate();
		group.updateMatrix();
		this.updateCount++;
		this.refresh();
		//console.log("rendered chunk # "+this.updateCount)
	}

	async initWorld(
		world: ChunkWorld,
		onprogress: (soFar: number, max: number) => void,
	) {
		console.log("total chunk count: "+world.chunks.length);

		const chunk0 = world.chunks[0];
		if (chunk0) {
			this.initCameraPosition(chunk0.z << 4, -(chunk0.x << 4));
		}

		const worker: Worker = await createChunkWorker();
		for (const chunk of world.chunks) {
			await this.updateChunkWithWorker(chunk, worker);
			onprogress(this.updateCount, world.chunks.length);
		}
		worker.terminate();
		console.log("rendered all chunks");

	}

	initCameraPosition(x: number, z: number) {
		//const x = cx * 16;
		//const z = cz * -16;
		this.camera.position.set(x, 128, z);
		this.camera.updateMatrix();
		this.camera.lookAt(x, 127, z);
		this.camera.updateMatrix();
		this.refresh();
		//this.lightNeedsUpdate = true;
	}

	/*async initWorldHelp(world: ChunkWorld, i: number) {
		const chunk = world.chunks[i];
		if (chunk) {
			if (i == 0) {
				this.initCameraPosition(chunk.x, chunk.z);
			}
			await this.updateChunk(chunk);
			this.refresh();
			console.log((i+1)+"/"+world.chunks.length);
			window.setTimeout(async () => {
				await this.initWorldHelp(world, i+1);
			}, 50);
		}
	}*/

	// Adjustments to be performed on the next frame
	translateAdjustment: THREE.Vector3;
	rotateAdjustment: THREE.Vector3;
	rotateWorldAdjustment: THREE.Vector3;

	tmpVec: THREE.Vector3;

	initAdjustmentVectors() {
		this.translateAdjustment = new THREE.Vector3();
		this.rotateAdjustment = new THREE.Vector3();
		this.rotateWorldAdjustment = new THREE.Vector3();
		this.tmpVec = new THREE.Vector3();
	}

	adjustCamera(adjustment: CameraAdjustment) {
		this.tmpVec.set(adjustment.x, adjustment.y, adjustment.z);

		switch (adjustment.mode) {
			case 'translate':
				this.translateAdjustment.add(this.tmpVec);
				break;
			case 'rotate':
				this.rotateAdjustment.add(this.tmpVec);
				this.lightNeedsUpdate = true;
				break;
			case 'rotateWorld':
				this.rotateWorldAdjustment.add(this.tmpVec);
				this.lightNeedsUpdate = true;
				break;
		}
		this.renderNeeded = true;
	}

	renderNeeded: boolean;
	lightNeedsUpdate: boolean;
	renderLoop() {
		//console.log(this);
		if (this.renderNeeded) {
			// translate
			this.camera.translateX(this.translateAdjustment.x);
			this.camera.translateY(this.translateAdjustment.y);
			this.camera.translateZ(this.translateAdjustment.z);

			// rotate
			this.camera.rotateX(this.rotateAdjustment.x);
			this.camera.rotateY(this.rotateAdjustment.y);
			this.camera.rotateZ(this.rotateAdjustment.z);

			// rotate world
			this.tmpVec.set(1, 0, 0);
			this.camera.rotateOnWorldAxis(this.tmpVec, this.rotateWorldAdjustment.x);
			this.tmpVec.set(0, 1, 0);
			this.camera.rotateOnWorldAxis(this.tmpVec, this.rotateWorldAdjustment.y);
			this.tmpVec.set(0, 0, 1);
			this.camera.rotateOnWorldAxis(this.tmpVec, this.rotateWorldAdjustment.z);

			// reset adjustment
			this.translateAdjustment.set(0, 0, 0);
			this.rotateAdjustment.set(0, 0, 0);
			this.rotateWorldAdjustment.set(0, 0, 0);
			this.renderNeeded = false;

			// update and render
			this.camera.matrixWorldNeedsUpdate = true;
			this.camera.updateMatrix();
			if (this.blueSelector.visible) {
				this.updateSelector(this.blueSelector);
			}
			if (this.greenSelector.visible) {
				this.updateSelector(this.greenSelector);
			}
			if (this.arrayBorder.visible) {
				this.updateArrayBorder();
			}
			if (this.lightNeedsUpdate) {
				this.updateLight();
			}
			this.renderer.render(this.scene, this.camera);
		}
		requestAnimationFrame(() => {this.renderLoop()});
	}

	blueSelector: THREE.Mesh;
	greenSelector: THREE.Mesh;
	arrayBorder: THREE.Mesh;
	initSelector() {
		const selectorSize = 1.05;
		const selectorGeometry = new THREE.BoxBufferGeometry(
			selectorSize, selectorSize, selectorSize
		);
		const blueMaterial = new THREE.MeshLambertMaterial({
			color: new THREE.Color(0x0000ff),
			transparent: true,
			opacity: 0.5,
		});
		const greenMaterial = new THREE.MeshLambertMaterial({
			color: new THREE.Color(0x00ff00),
			transparent: true,
			opacity: 0.5,
		});

		this.blueSelector = new THREE.Mesh(selectorGeometry, blueMaterial);
		this.blueSelector.matrixAutoUpdate = false;
		this.blueSelector.visible = false;

		this.greenSelector = new THREE.Mesh(selectorGeometry, greenMaterial);
		this.greenSelector.matrixAutoUpdate = false;
		this.greenSelector.visible = false;

		const arrayBorderGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
		const arrayBorderMaterial = new THREE.MeshLambertMaterial({
			color: new THREE.Color(0xeeee00),
			wireframe: false,
			transparent: true,
			opacity: 0.5,
			side: THREE.DoubleSide,
		});
		this.arrayBorder = new THREE.Mesh(arrayBorderGeometry, arrayBorderMaterial);
		this.arrayBorder.visible = false;

		this.scene.add(this.blueSelector, this.greenSelector, this.arrayBorder);
	}

	get selectionMode(): SelectionMode {
		throw "selectionMode is set only";
		return 'none';
	}
	set selectionMode(mode: SelectionMode) {
		this.blueSelector.visible = false;
		this.greenSelector.visible = false;
		this.arrayBorder.visible = false;
		switch (mode) {
			case 'none':
				break;

			case 'singleBlock':
				this.updateSelector(this.blueSelector);
				this.blueSelector.visible = true;
				break;

			case 'array':
				this.arrayBorder.visible = true;
				break;

			case 'arrayBlue':
				//this.updateSelector(this.blueSelector);
				this.arrayBorder.visible = true;
				this.blueSelector.visible = true;
				break;

			case 'arrayGreen':
				//this.updateSelector(this.greenSelector);
				this.arrayBorder.visible = true;
				this.greenSelector.visible = true;
				break;
		}
		this.refresh();
	}

	updateLight() {
		this.directionalLight.position.copy(this.camera.position);
		this.directionalLight.target.position.copy(this.camera.position);
		this.directionalLight.target.quaternion.copy(this.camera.quaternion);

		this.directionalLight.target.rotateX(0.01); // look up
		this.directionalLight.target.translateZ(-1); // move forward

		this.directionalLight.target.updateMatrix();
		this.directionalLight.updateMatrix();
	}

	updateSelector(mesh: THREE.Mesh) {
		mesh.position.copy(this.camera.position);
		mesh.quaternion.copy(this.camera.quaternion);
		mesh.translateZ(-5);
		mesh.position.set(
			Math.round(mesh.position.x),
			Math.round(mesh.position.y - 1),
			Math.round(mesh.position.z),
		);
		mesh.rotation.set(0, 0, 0);
		mesh.updateMatrix();
	}

	updateArrayBorder() {
		const blue = this.blueSelector.position;
		const green = this.greenSelector.position;
		const x = (blue.x+green.x) / 2;
		const y = (blue.y+green.y) / 2;
		const z = (blue.z+green.z) / 2;
		const xscale = Math.abs(blue.x-green.x) + 1.025
		const yscale = Math.abs(blue.y-green.y) + 1.025
		const zscale = Math.abs(blue.z-green.z) + 1.025
		this.arrayBorder.position.set(x, y, z);
		this.arrayBorder.scale.set(xscale, yscale, zscale);
		this.arrayBorder.updateMatrix();
	}

	get singleBlockSelectorPosition() {
		const p = this.blueSelector.position;
		return {x: -p.z, y: p.y, z: p.x};
	}

	get arrayCorner1() {
		const blue = this.blueSelector.position;
		const green = this.greenSelector.position;
		return {
			x: Math.min(blue.x, green.x),
			y: Math.min(blue.y, green.y),
			z: Math.min(blue.z, green.z),
		};
	}

	get arrayCorner2() {
		const blue = this.blueSelector.position;
		const green = this.greenSelector.position;
		return {
			x: Math.max(blue.x, green.x),
			y: Math.max(blue.y, green.y),
			z: Math.max(blue.z, green.z),
		};
	}
}


export type CameraAdjustment = {
	x: number, y: number, z: number,
	mode: 'translate' | 'rotate' | 'rotateWorld'
};


export type SelectionMode =
	| 'none'
	| 'array'
	| 'arrayBlue'
	| 'arrayGreen'
	| 'singleBlock';


// Holds the keys that are currently being pressed
/*export let currentKeys: Set<String> = new Set();


export function startKeyEvents() {
	document.body.onkeydown = function(event) {
		const key: string = event.key.toLowerCase();
		if (!currentKeys.has(key)) {
			currentKeys.add(key);
			if (key == "u") {
				camera.rotateX(Math.PI/-8);
				camera.updateMatrix();
				camera.matrixWorldNeedsUpdate = true;
				updateLight();
			}
			if (key == "o") {
				camera.rotateX(Math.PI/8);
				camera.updateMatrix();
				camera.matrixWorldNeedsUpdate = true;
				updateLight();
			}
		}
	};
	document.body.onkeyup = function(event) {
		currentKeys.delete(event.key.toLowerCase());
	};
};*/
