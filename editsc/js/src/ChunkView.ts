import * as THREE from 'three';

import ChunkWorld, {Chunk} from './ChunkWorld';
import * as Block from './Block';
import BlockType from './Block';


export default class ChunkView {
	constructor(canvas: HTMLCanvasElement) {
		this.initScene();
		this.initCamera();
		this.renderNeeded = true;
		this.initRenderer(canvas);

		this.initLight();
		this.initAdjustmentVectors();
		this.initSelector();
		this.chunkGroups = {};

		this.updateSize();
		this.renderLoop();
	}

	private scene: THREE.Scene;
	initScene() {
		this.scene = new THREE.Scene();
		this.scene.autoUpdate = true;
		this.scene.frustumCulled = false;
		this.scene.fog = new THREE.Fog(0xf5f5f5, 96, 128);
		this.scene.background = new THREE.Color(0xf5f5f5);
	}

	private camera: THREE.PerspectiveCamera;
	initCamera() {
		const fieldOfView = 70;
		const aspectRatio = window.innerWidth / window.innerHeight;
		const nearClippingPlane = 0.1;
		const farClippingPlane = 128;
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


	private pixelDensity: number;
	private renderer: THREE.WebGLRenderer;
	initRenderer(canvas: HTMLCanvasElement) {
		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			stencil: false,
			antialias: true,
			powerPreference: 'low-power',
		});
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
	async updateChunk(chunk: Chunk) {
		if (!this.chunkGroups[chunk.x]) {
			this.chunkGroups[chunk.x] = {};
		}
		if(this.chunkGroups[chunk.x]![chunk.z]) {
			this.scene.remove(this.chunkGroups[chunk.x]![chunk.z]!);
		}
		const group = new THREE.Group();
		this.scene.add(group);
		this.chunkGroups[chunk.x]![chunk.z] = group;

		//console.log(BlockType.all);
		for (const btype of BlockType.all) {
			const condition = (b: number) => btype.matchesBlockValue(b);
			if ((await chunk.count(condition)) == 0) {
				continue;
			}

			const faceCount: number = await chunk.countFaces(condition);

			const mesh: THREE.InstancedMesh = await btype.chunkMesh(faceCount);
			mesh.position.set(chunk.z << 4, 0, -(chunk.x << 4));

			let meshIndex = 0;
			await chunk.iterBlocks(async function(block, x, y, z) {
				if (meshIndex == faceCount) {
					return;
				}
				const faces = await chunk.blockFaces(condition, x, y, z);
				for (const face of faces) {
					Block.addFace(
						meshIndex,
						mesh,
						//Block.faceVectors[face],
						face,
						x, y, -z
					);
					meshIndex++;
				}
			}, condition);

			mesh.updateMatrix();
			mesh.instanceMatrix.needsUpdate = true;
			group.add(mesh);
			this.refresh();
		}
	}

	async initWorld(world: ChunkWorld) {
		window.setTimeout(async () => {
			await this.initWorldHelp(world, 0);
		}, 100);
	}

	initCameraPosition(cx: number, cz: number) {
		const x = cx * 16;
		const z = cz * -16;
		this.camera.position.set(x, 48, z);
		this.camera.lookAt(x+1, 48, z);
		this.camera.updateMatrix();
		console.log(this.camera.position);
	}

	async initWorldHelp(world: ChunkWorld, i: number) {
		const chunk = world.chunks[i];
		if (chunk) {
			if (i == 0) {
				this.initCameraPosition(chunk.x, chunk.z);
			}
			await this.updateChunk(chunk);
			console.log((i+1)+"/"+world.chunks.length);
			window.setTimeout(async () => {
				await this.initWorldHelp(world, i+1);
			}, 10);
		}
	}

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
				break;
			case 'rotateWorld':
				this.rotateWorldAdjustment.add(this.tmpVec);
				break;
		}
		this.renderNeeded = true;
	}

	renderNeeded: boolean;
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
			if (this.selectorMesh.visible) {
				this.updateSelector();
			}
			this.renderer.render(this.scene, this.camera);
		}
		requestAnimationFrame(() => {this.renderLoop()});
	}

	selectorMesh: THREE.Mesh;
	initSelector() {
		const selectorSize = 1.05;
		const selectorGeometry = new THREE.BoxBufferGeometry(
			selectorSize, selectorSize, selectorSize
		);
		const selectorMaterial = new THREE.MeshLambertMaterial({
			color: new THREE.Color(0x888888),
			transparent: true,
			opacity: 0.85,
		});
		this.selectorMesh = new THREE.Mesh(selectorGeometry, selectorMaterial);

		this.selectorMesh.matrixAutoUpdate = false;
		this.selectorMesh.visible = false;
		this.scene.add(this.selectorMesh);
	}

	get selectionMode(): SelectionMode {
		throw "selectionMode is set only";
		return 'none';
	}
	set selectionMode(mode: SelectionMode) {
		switch (mode) {
			case 'none':
				this.selectorMesh.visible = false;
				break;

			case 'singleBlock':
				this.updateSelector();
				this.selectorMesh.visible = true;
				break;
		}
		this.refresh();
	}

	updateSelector() {
		this.selectorMesh.position.copy(this.camera.position);
		this.selectorMesh.quaternion.copy(this.camera.quaternion);
		this.selectorMesh.translateZ(-5);
		this.selectorMesh.position.set(
			Math.round(this.selectorMesh.position.x),
			Math.round(this.selectorMesh.position.y - 1.5),
			Math.round(this.selectorMesh.position.z),
		);
		this.selectorMesh.rotation.set(0, 0, 0);
		this.selectorMesh.updateMatrix();
	}

	get singleBlockSelectorPosition() {
		const p = this.selectorMesh.position;
		return {x: -p.z, y: p.y, z: p.x};
	}
}


export type CameraAdjustment = {
	x: number, y: number, z: number,
	mode: 'translate' | 'rotate' | 'rotateWorld'
};


export type SelectionMode =
	| 'none'
	| 'singleBlock';


/*export function initCameraPosition() {
	camera.updateMatrix();
	camera.updateMatrixWorld(true);
	camera.matrixWorldNeedsUpdate = true;
}*/


/*async function updateLight() {
	directionalLight.position.copy(camera.position);
	directionalLight.target.position.copy(camera.position);
	directionalLight.target.quaternion.copy(camera.quaternion);

	directionalLight.target.rotateX(0.01); // look up
	directionalLight.target.translateZ(-1); // move forward

	directionalLight.target.updateMatrix();
	directionalLight.updateMatrix();
}*/





// Controls


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
