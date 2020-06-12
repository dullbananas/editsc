var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define("blockType", ["require", "exports", "three"], function (require, exports, THREE) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.blockTypes = exports.fromBlock = exports.isType = void 0;
    function isType(blockType) {
        return function (block) {
            return fromBlock(block) == blockType.id;
        };
    }
    exports.isType = isType;
    function fromBlock(block) {
        return block & 0b1111111111;
    }
    exports.fromBlock = fromBlock;
    function v(id, x, y, color = 0xffffff) {
        return {
            kind: 'voxel',
            id: id,
            textureX: x,
            textureY: y,
            color: new THREE.Color(color),
        };
    }
    exports.blockTypes = [
        v(1, 1, 1),
        v(2, 2, 0),
        v(3, 1, 0),
        v(8, 0, 0, 0x44dd44),
        v(9, 4, 1),
        v(10, 5, 7),
        v(11, 4, 7),
        v(12, 4, 3, 0x22dd22),
        v(13, 4, 3, 0x44ff00),
        v(14, 4, 8, 0x22cc22),
        v(15, 3, 4),
        v(16, 2, 2),
    ];
});
define("geometry", ["require", "exports", "three", "rendering"], function (require, exports, THREE, rendering) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.voxelMesh = exports.addFace = exports.faceVectors = void 0;
    // Holds matrix that will be applied to objects
    let tmpObj = new THREE.Object3D();
    let textureLoader = new THREE.TextureLoader();
    //let texture = textureLoader.load("../static/blocks.png", rendering.forceRenderFrame);
    function newTexture(btype) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = textureLoader.load("../static/blocks.png", rendering.forceRenderFrame);
            //let result = texture.clone();
            //result.needsUpdate = true;
            //result.encoding = THREE.sRGBEncoding;
            result.repeat.x = result.repeat.y = 1 / 16;
            result.magFilter = THREE.NearestFilter; // pixelated appearane
            result.offset.x = btype.textureX / 16;
            result.offset.y = 15 / 16 - (btype.textureY / 16);
            //(result as any).updateM
            //result.needsUpdate = true;
            return result;
        });
    }
    exports.faceVectors = {
        '+x': new THREE.Vector3(0, 0, 1),
        '+y': new THREE.Vector3(0, 1, 0),
        '+z': new THREE.Vector3(1, 0, 0),
        '-x': new THREE.Vector3(0, 0, -1),
        '-y': new THREE.Vector3(0, -1, 0),
        '-z': new THREE.Vector3(-1, 0, 0),
    };
    /*const halfVectors: Record<Face, THREE.Vector3> = (function() {
        result = faceVectors;
        for ()
        return result;
    })();*/
    function addFace(meshIndex, mesh, face, x, y, z) {
        tmpObj.position.set(x + face.x * 0.5, y + face.y * 0.5, z + face.z * -0.5);
        //tmpObj.lookAt(face.x*2+x, face.y*2+y, face.z*2+z);
        tmpObj.lookAt(face.x + x, face.y + y, -face.z + z);
        /*tmpObj.position.x += face.x * 0.5;
        tmpObj.position.y += face.y * 0.5;
        tmpObj.position.z += face.z * 0.5;*/
        tmpObj.updateMatrix();
        mesh.setMatrixAt(meshIndex, tmpObj.matrix);
    }
    exports.addFace = addFace;
    function voxelMesh(faceCount, btype) {
        return __awaiter(this, void 0, void 0, function* () {
            const geometry = new THREE.PlaneBufferGeometry(1, 1);
            const material = new THREE.MeshLambertMaterial({
                map: yield newTexture(btype),
                color: btype.color,
            });
            let mesh = new THREE.InstancedMesh(geometry, material, faceCount);
            mesh.frustumCulled = false;
            return mesh;
        });
    }
    exports.voxelMesh = voxelMesh;
});
define("world", ["require", "exports", "geometry"], function (require, exports, geometry) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.inChunkBounds = exports.getBlockIndex = exports.Chunk = exports.World = void 0;
    const LittleEndian = true;
    class World {
        constructor(arrayBuffer) {
            this.chunks = [];
            switch (arrayBuffer) {
                case null:
                    this.arrayBuffer = new ArrayBuffer(0);
                    this.chunkLength = 0;
                    break;
                default:
                    this.arrayBuffer = arrayBuffer;
                    if (((arrayBuffer.byteLength - 786444) % 263184) != 0) {
                        throw "Invalid world byte length: " + arrayBuffer.byteLength;
                    }
                    //const chunkCount = (arrayBuffer.byteLength - 786444) / 263184;
                    this.chunkLength = (arrayBuffer.byteLength - 786444) / 263184;
                    for (let i = 0; i < this.chunkLength; i++) {
                        const offset = 786444 + (i * 263184);
                        let newChunk = new Chunk(new DataView(this.arrayBuffer, offset, 263184));
                        this.chunks.push(newChunk);
                    }
            }
        }
        // Takes coordinates and returns the chunk that contains it
        /*getChunkWith(x: number, z: number): Chunk | undefined {
            for (let chunk of this.chunks) {
                const chunkXStart = chunk.x * 16;
                const chunkZStart = chunk.z * 16;
    
                const chunkXEnd = chunkXStart + 15;
                const chunkZEnd = chunkXStart + 15;
    
                const xIsCorrect = chunkXStart <= x && x <= chunkXEnd;
                const zIsCorrect = chunkZStart <= z && z <= chunkZEnd;
    
                if (xIsCorrect && zIsCorrect) {
                    return chunk;
                }
            }
    
            return undefined;
        }*/
        getBlockAt(x, y, z) {
            const coords = getChunkCoords(x, z);
            const chunk = this.getChunkAt(x, z);
            if (chunk) {
                return chunk.getBlock(getBlockIndex(coords.blockZ, y, coords.blockX));
            }
            return undefined;
        }
        setBlockAt(x, y, z, value) {
            const coords = getChunkCoords(x, z);
            const chunk = this.getChunkAt(x, z);
            if (chunk) {
                chunk.setBlock(getBlockIndex(coords.blockZ, y, coords.blockX), value);
            }
        }
        getChunkAt(x, z) {
            const coords = getChunkCoords(x, z);
            for (let chunk of this.chunks) {
                //if (chunk.x==coords.chunkX && chunk.z==coords.chunkZ) {
                //const chunkXStart = chunk.x * 16;
                //const chunkZStart = chunk.z * 16;
                //const chunkXStart = (chunk.x-1) * 16;
                //const chunkZStart = (chunk.z-1) * 16;
                //const chunkXEnd = chunkXStart + 15;
                //const chunkZEnd = chunkZStart + 15;
                //const chunkXEnd = chunkXStart - 15;
                //const chunkZEnd = chunkZStart - 15;
                //const xIsCorrect = chunkXStart<=x && x<=chunkXEnd;
                //const zIsCorrect = chunkZStart<=z && z<=chunkZEnd;
                //const xIsCorrect = chunkXStart>=x && x>=chunkXEnd;
                //const zIsCorrect = chunkZStart>=z && z>=chunkZEnd;
                const xIsCorrect = chunk.x == (x - coords.blockX) / 16;
                const zIsCorrect = chunk.z == (z - coords.blockZ) / 16;
                //console.log(69);
                //console.log([chunkXStart,chunkZStart,chunkXEnd,chunkZEnd]);
                //console.log([x,z]);
                //console.log([xIsCorrect,zIsCorrect]);
                //console.log(coords);
                if (xIsCorrect && zIsCorrect) {
                    //const blockX = x - chunk.x*16;
                    //const blockZ = z - chunk.z*16;
                    //console.log({x:blockX,z:blockZ});
                    return chunk /*.getBlock(getBlockIndex(
                        coords.blockX,
                        y,
                        coords.blockZ,
                    ))!*/;
                }
            }
            return undefined;
        }
        getChunk(i) {
            return this.chunks[i];
        }
    }
    exports.World = World;
    class Chunk {
        constructor(view) {
            this.view = view;
            // Magic numbers
            let magicNums = [
                this.view.getUint32(0, LittleEndian),
                this.view.getUint32(4, LittleEndian),
            ];
            const correctNums = [0xDEADBEEF, 0xFFFFFFFE];
            if (magicNums[0] != correctNums[0] || magicNums[1] != correctNums[1]) {
                throw "These magic numbers are incorrect: "
                    + magicNums[0]
                    + ", "
                    + magicNums[1];
                +"; Correct numbers: "
                    + correctNums[0]
                    + ", "
                    + correctNums[1];
            }
            // Coordinates
            this.x = view.getInt32(8, LittleEndian);
            this.z = view.getInt32(12, LittleEndian);
        }
        getBlock(index) {
            /*if (index < 0 || index > 65535) {
                throw "invalid block index: " + index
            }*/
            return this.view.getUint32(16 // <- Header size
                //+ (4 * index)
                + (index << 2)
            //, LittleEndian
            , true);
        }
        setBlock(index, value) {
            this.view.setUint32(16 + (index << 2), value, true);
        }
        blockFaces(condition, x, y, z) {
            return __awaiter(this, void 0, void 0, function* () {
                //return y + (x << 8) + (z << 12);
                let result = [];
                for (let faceName in geometry.faceVectors) {
                    const face = faceName;
                    const vector = geometry.faceVectors[face];
                    const ox = x + vector.x;
                    const oy = y + vector.y;
                    const oz = z + vector.z;
                    //face.z *= -1;
                    if (!inChunkBounds(ox, oy, oz)) {
                        result.push(face);
                        continue;
                    }
                    const otherIndex = getBlockIndex(ox, oy, oz);
                    const otherBlock = this.getBlock(otherIndex);
                    if (!condition(otherBlock)) {
                        result.push(face);
                    }
                }
                return result;
            });
        }
        // Count the number of blocks that satisfy a condition.
        count(condition) {
            return __awaiter(this, void 0, void 0, function* () {
                let result = 0;
                /*this.forEach(function() {
                    result++;
                }, condition);*/
                for (let i = 0; i < 65536; i++) {
                    if (condition(this.getBlock(i))) {
                        result++;
                    }
                }
                return result;
            });
        }
        // Like count() but counts the amount of visible block faces
        countFaces(condition) {
            return __awaiter(this, void 0, void 0, function* () {
                /*const faces: Array<[number, number, number]> = [
                    [0, 0, -1],
                    [0, 0, 1],
                    [0, -1, 0],
                    [0, 1, 0],
                    [-1, 0, 0],
                    [1, 0, 0],
                ];*/
                let result = 0;
                for (let face in geometry.faceVectors) {
                    const vector = geometry.faceVectors[face];
                    yield this.forEach((block, x, y, z) => __awaiter(this, void 0, void 0, function* () {
                        const ox = x + vector.x;
                        const oy = y + vector.y;
                        const oz = z + vector.z;
                        if (!inChunkBounds(ox, oy, oz)) {
                            result++;
                            return;
                        }
                        const blockIndex = getBlockIndex(ox, oy, oz);
                        if (!condition(this.getBlock(blockIndex))) {
                            result++;
                        }
                    }), condition);
                }
                return result;
            });
        }
        forEach(callback, condition = (anyBlock) => true) {
            return __awaiter(this, void 0, void 0, function* () {
                //return y + (x << 8) + (z << 12);
                //for (let x = 0; x < 16; x++) {
                //for (let y = 0; y < 256; y++) {
                //for (let z = 0; z < 16; z++) {
                //for (let x = 0; x < (16<<8); x+=(1<<8)) {
                //for (let y = 0; y < 256; y++) {
                //for (let z = 0; z < (16<<12); z+=(1<<12)) {
                for (let x = 0; x < 4096; x += 256) {
                    for (let y = 0; y < 256; y++) {
                        for (let z = 0; z < 65536; z += 4096) {
                            //const blockIndex: number = getBlockIndex(x, y, z);
                            //const block: number = this.getBlock(getBlockIndex(x, y, z))!;
                            const block = this.getBlock(x + y + z);
                            if (condition(block)) {
                                yield callback(block, x >> 8, y, z >> 12);
                            }
                        }
                    }
                }
            });
        }
    }
    exports.Chunk = Chunk;
    function getBlockIndex(x, y, z) {
        /*x = clamp(x, 0, 15);
        y = clamp(y, 0, 255);
        z = clamp(z, 0, 15);*/
        //return y + x * 256 + z * 256 * 16;
        //return y + x * 256 + z * 4096;
        /*if (!inChunkBounds(x, y, z)) {
            throw "invalid coordinates: " + x + ", " + y + ", " + z;
        }*/
        return y + (x << 8) + (z << 12);
    }
    exports.getBlockIndex = getBlockIndex;
    function inChunkBounds(x, y, z) {
        return clamp(x, 0, 15) == x && clamp(y, 0, 255) == y && clamp(z, 0, 15) == z;
    }
    exports.inChunkBounds = inChunkBounds;
    function clamp(num, min, max) {
        if (num > max) {
            return max;
        }
        if (num < min) {
            return min;
        }
        return num;
    }
    function getChunkCoords(x, z) {
        while (x < 0) {
            x += 16;
        }
        while (z < 0) {
            z += 16;
        }
        //const chunkX = Math.floor(x / 16);
        //const chunkZ = Math.floor(z / 16);
        return {
            //chunkX: chunkX,
            //hunkZ: chunkZ,
            //blockX: x - chunkX*16,
            //blockZ: z - chunkZ*16,
            blockX: (x) % 16,
            blockZ: (z) % 16,
        };
    }
});
define("main", ["require", "exports", "world", "rendering", "extension"], function (require, exports, world_1, rendering, extension) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.app = exports.world = void 0;
    // State
    let chunksFileEntry = undefined;
    exports.world = new world_1.World(null);
    exports.app = Elm.Main.init({
        node: document.getElementById('ui'),
    });
    let cssApp = Elm.Styles.init({
        node: document.getElementById('style'),
    });
    // Ports
    exports.app.ports.extractZip.subscribe(function () {
        function zipErr(err) {
            exports.app.ports.extractionError.send(err);
        }
        let fileInput = document.getElementById('scworld-input');
        switch (fileInput.files.length) {
            case 1:
                let file = fileInput.files[0];
                JSZip.loadAsync(file).then(function (zip /*: JSZip*/) {
                    const chunksObj = zip.file(/Chunks32h\.dat$/)[0];
                    const projectObj = zip.file(/Project\.xml$/)[0];
                    if (chunksObj && projectObj) {
                        chunksFileEntry = chunksObj; // save chunks file for later
                        projectObj.async('string').then(function (content) {
                            // Send Project.xml to Elm
                            exports.app.ports.gotProjectFile.send(content);
                        });
                    }
                    else {
                        zipErr("The scworld file doesn't contain the right files. It might be in an unsupported Survivalcraft version.");
                    }
                });
                break;
            default:
                zipErr("You must upload exactly one file.");
                break;
        }
    });
    exports.app.ports.parseChunks.subscribe(function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (chunksFileEntry) {
                let arrayBuffer = yield chunksFileEntry.async('arraybuffer');
                try {
                    exports.world = new world_1.World(arrayBuffer);
                }
                catch (e) {
                    exports.app.ports.chunksError.send("Invalid data in chunks file; it might be corrupted");
                    console.error({ chunkLoadError: e });
                    return;
                }
                // Importing is done
                initRender();
                exports.app.ports.chunksReady.send(null);
            }
        });
    });
    exports.app.ports.startRendering.subscribe(function () {
        // Elm app is now in the Editor page
        extension.load("https://editsc.pythonanywhere.com/dulldevBasics.js", exports.app);
        exports.app.ports.progress.send({
            soFar: 0,
            total: exports.world.chunkLength,
            message: "Creating geometry",
        });
    });
    exports.app.ports['continue'].subscribe(function (i) {
        //console.log(i);
        const chunk = exports.world.getChunk(i);
        if (chunk) {
            rendering.renderChunk(chunk).then(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield rendering.forceRenderFrame();
                    window.setTimeout(function () {
                        exports.app.ports.progress.send({
                            soFar: i + 1,
                            total: exports.world.chunkLength,
                            message: "Creating geometry",
                        });
                    }, 50);
                });
            });
        }
    });
    function initRender() {
        rendering.startKeyEvents();
        rendering.updateSize();
        rendering.renderLoop();
        rendering.initCameraPosition();
        /*for (let i = 0; i < world.chunkCount(); i++) {
            rendering.renderChunk(world.getChunk(i)!);
            rendering.forceRenderFrame();
        }
        rendering.startKeyEvents();*/
    }
    exports.app.ports.saveWorld.subscribe(function (arg) {
        let zip = new JSZip();
        const rootDir = arg.fileName.split(".")[0] + "/";
        zip.file(rootDir + "Project.xml", arg.xml);
        zip.file(rootDir + "Chunks32h.dat", exports.world.arrayBuffer);
        zip.generateAsync({ type: 'blob' }).then(function (blob) {
            download(blob, arg.fileName, "application/zip");
        });
    });
    exports.app.ports.selectionState.subscribe(rendering.updateSelectMode);
    exports.app.ports.doSingleBlockAction.subscribe(function (action) {
        const pos = rendering.selector.position;
        const block = exports.world.getBlockAt(-pos.z, pos.y, pos.x);
        if (block == undefined) {
            window.alert("Block is out of bounds");
            return;
        }
        /*rendering.scene.remove(rendering.chunkGroups[block.x]![block.z]!);
        rendering.forceRenderFrame();
        return;*/
        extension.extensions[action.url].worker.postMessage({
            kind: 'singleBlockAction',
            actionId: action.id,
            x: -pos.z,
            y: pos.y,
            z: pos.x,
            blockValue: block,
        });
    });
});
//import * as THREE from 'three';
//declare const THREE: THREE;
define("rendering", ["require", "exports", "main", "geometry", "blockType", "blockType"], function (require, exports, main, geometry, blockType_1, blockType) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.selector = exports.updateSelectMode = exports.startKeyEvents = exports.currentKeys = exports.updateSize = exports.renderLoop = exports.forceRenderFrame = exports.initCameraPosition = exports.renderChunk = exports.chunkGroups = exports.scene = void 0;
    /*
    
    Layers
        0: Almost everything
        1: Single block selection box
    
    nevermind
    
    */
    // Set up rendering
    exports.scene = new THREE.Scene();
    exports.scene.background = new THREE.Color(0xf5f5f5);
    exports.scene.autoUpdate = true;
    exports.scene.frustumCulled = false;
    let camera = new THREE.PerspectiveCamera(70, // field of view
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1, // near clipping plane
    128);
    camera.matrixAutoUpdate = false;
    let renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('world-canvas'),
        stencil: false,
        antialias: true,
        powerPreference: 'low-power',
    });
    renderer.physicallyCorrectLights = false;
    const pixelDensity = Math.trunc(window.devicePixelRatio);
    // Lights & fog
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.2);
    directionalLight.matrixAutoUpdate = false;
    directionalLight.target = new THREE.Object3D();
    directionalLight.target.matrixAutoUpdate = false;
    exports.scene.add(ambientLight, directionalLight.target, directionalLight);
    exports.scene.fog = new THREE.Fog(0xf5f5f5, 96, 128);
    // chunkGroups[x][z] holds the geometry for that chunk
    exports.chunkGroups = {};
    function renderChunk(chunk /*, btype: BlockType*/) {
        return __awaiter(this, void 0, void 0, function* () {
            let group;
            if (!exports.chunkGroups[chunk.x]) {
                exports.chunkGroups[chunk.x] = {};
            }
            if (exports.chunkGroups[chunk.x][chunk.z]) {
                exports.scene.remove(exports.chunkGroups[chunk.x][chunk.z]);
            }
            group = new THREE.Group();
            exports.scene.add(group);
            exports.chunkGroups[chunk.x][chunk.z] = group;
            /*if(!(chunkGroups[chunk.x]![chunk.z])) {
                group = new THREE.Group();
                scene.add(group);
                chunkGroups[chunk.x]![chunk.z] = group;
            }
            else {
                group = chunkGroups[chunk.x]![chunk.z]!;
            }*/
            //blockTypes.forEach(function(btype: BlockType) {
            for (let btype of blockType_1.blockTypes) {
                const condition = blockType.isType(btype);
                if ((yield chunk.count(condition)) == 0) {
                    continue;
                }
                switch (btype.kind) {
                    case 'voxel':
                        const faceCount = yield chunk.countFaces(condition);
                        let mesh = yield geometry.voxelMesh(faceCount, btype);
                        mesh.position.set(chunk.z << 4, 0, -(chunk.x << 4));
                        let meshIndex = 0;
                        yield chunk.forEach(function (block, x, y, z) {
                            return __awaiter(this, void 0, void 0, function* () {
                                if (meshIndex == faceCount) {
                                    return;
                                }
                                const faces = yield chunk.blockFaces(condition, x, y, z);
                                faces.forEach(function (face) {
                                    geometry.addFace(meshIndex, mesh, geometry.faceVectors[face], 
                                    // x, y, z converted from left to right handed coordinates
                                    //(chunk.z * 16) + ((x-1) % 16),
                                    //(chunk.z << 4) + ((x-1) % 16),
                                    //(chunk.z << 4) + x - 1,
                                    //x - 1,
                                    x, y, 
                                    //(chunk.x * -16) - ((z-1) % 16),
                                    //-(chunk.x << 4) - ((z-1) % 16),
                                    //-z + 1,
                                    -z);
                                    meshIndex++;
                                });
                            });
                        }, condition);
                        mesh.updateMatrix();
                        mesh.instanceMatrix.needsUpdate = true;
                        group.add(mesh);
                        break;
                }
            }
            console.log(exports.chunkGroups);
        });
    }
    exports.renderChunk = renderChunk;
    function initCameraPosition() {
        const chunk = main.world.getChunk(0);
        if (chunk) {
            const x = chunk.x * 16;
            const z = chunk.z * -16;
            camera.position.set(x, 48, z);
            camera.updateMatrix();
            camera.lookAt(x + 1, 48, z + 1);
        }
        camera.updateMatrix();
        camera.updateMatrixWorld(true);
        camera.matrixWorldNeedsUpdate = true;
    }
    exports.initCameraPosition = initCameraPosition;
    // Rendering loop
    let rotationVector = new THREE.Vector3(0, 0, 0);
    function rotate(x, y, z, angle) {
        rotationVector.set(x, y, z);
        camera.rotateOnWorldAxis(rotationVector, angle);
        camera.matrixWorldNeedsUpdate = true;
    }
    function renderFrame() {
        return __awaiter(this, void 0, void 0, function* () {
            if (exports.currentKeys.size == 0) {
                return;
            }
            if (millisPerFrame == 0) {
                return;
            }
            //let moveDist: number = 24 / (1000/millisPerFrame);
            let moveDist = 0.024 * millisPerFrame;
            //let angle: number = Math.PI / 2 / (1000/millisPerFrame);
            //let angle: number = 0.0016 * millisPerFrame;
            let angle = 0.0024 * millisPerFrame;
            if (exports.currentKeys.has("shift")) {
                moveDist *= 0.35;
                angle *= 0.35;
            }
            if (exports.currentKeys.has("i")) {
                camera.translateZ(-moveDist);
            }
            if (exports.currentKeys.has("k")) {
                camera.translateZ(moveDist);
            }
            if (exports.currentKeys.has("a")) {
                camera.translateX(-moveDist);
            }
            if (exports.currentKeys.has("d")) {
                camera.translateX(moveDist);
            }
            if (exports.currentKeys.has("w")) {
                camera.translateY(moveDist);
            }
            if (exports.currentKeys.has("s")) {
                camera.translateY(-moveDist);
            }
            if (exports.currentKeys.has("j")) {
                rotate(0, 1, 0, angle);
                updateLight();
            }
            if (exports.currentKeys.has("l")) {
                rotate(0, 1, 0, -angle);
                updateLight();
            }
            if (selectMode == SelectMode.SingleBlock) {
                yield updateSelector();
            }
            camera.updateMatrix();
            //camera.updateProjectionMatrix();
            yield forceRenderFrame();
        });
    }
    // FPS counter
    //let fps = 0;
    let millisPerFrame = 0;
    let lastRenderTime = Date.now(); // when the last frame was rendered
    function updateLight() {
        return __awaiter(this, void 0, void 0, function* () {
            directionalLight.position.copy(camera.position);
            directionalLight.target.position.copy(camera.position);
            directionalLight.target.quaternion.copy(camera.quaternion);
            directionalLight.target.rotateX(0.01); // look up
            directionalLight.target.translateZ(-1); // move forward
            directionalLight.target.updateMatrix();
            directionalLight.updateMatrix();
        });
    }
    //window.setInterval(updateLight, 100)
    function forceRenderFrame() {
        return __awaiter(this, void 0, void 0, function* () {
            renderer.render(exports.scene, camera);
        });
    }
    exports.forceRenderFrame = forceRenderFrame;
    function renderLoop() {
        renderFrame().then(function () {
            millisPerFrame = Date.now() - lastRenderTime;
            lastRenderTime = Date.now();
            requestAnimationFrame(renderLoop);
        });
        //fps = 1000 / millisPerFrame;
    }
    exports.renderLoop = renderLoop;
    function updateSize() {
        return __awaiter(this, void 0, void 0, function* () {
            const PreventStyleChange = false;
            const width = window.innerWidth * pixelDensity;
            const height = window.innerHeight * pixelDensity;
            renderer.setSize(width, height, PreventStyleChange);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            forceRenderFrame();
            window.scrollTo(0, 0);
            document.body.style.height = window.innerHeight + "px";
        });
    }
    exports.updateSize = updateSize;
    window.onresize = function () {
        updateSize();
        // This is needed to make sure the size is correct
        window.setTimeout(updateSize, 200);
    };
    // Controls
    // Holds the keys that are currently being pressed
    exports.currentKeys = new Set();
    function startKeyEvents() {
        document.body.onkeydown = function (event) {
            const key = event.key.toLowerCase();
            if (!exports.currentKeys.has(key)) {
                exports.currentKeys.add(key);
                if (key == "u") {
                    camera.rotateX(Math.PI / -8);
                    camera.updateMatrix();
                    camera.matrixWorldNeedsUpdate = true;
                    updateLight();
                }
                if (key == "o") {
                    camera.rotateX(Math.PI / 8);
                    camera.updateMatrix();
                    camera.matrixWorldNeedsUpdate = true;
                    updateLight();
                }
            }
        };
        document.body.onkeyup = function (event) {
            exports.currentKeys.delete(event.key.toLowerCase());
        };
    }
    exports.startKeyEvents = startKeyEvents;
    ;
    // Block selection
    var SelectMode;
    (function (SelectMode) {
        SelectMode[SelectMode["None"] = 0] = "None";
        SelectMode[SelectMode["SingleBlock"] = 1] = "SingleBlock";
    })(SelectMode || (SelectMode = {}));
    ;
    let selectMode = SelectMode.None;
    function updateSelectMode(mode) {
        selectMode = mode;
        switch (mode) {
            case SelectMode.None:
                exports.selector.visible = false;
                break;
            case SelectMode.SingleBlock:
                updateSelector();
                exports.selector.visible = true;
                break;
        }
        forceRenderFrame();
    }
    exports.updateSelectMode = updateSelectMode;
    const selectorSize = 1.05;
    const selectorGeometry = new THREE.BoxBufferGeometry(selectorSize, selectorSize, selectorSize);
    const selectorMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(0x888888),
        transparent: true,
        opacity: 0.85,
    });
    exports.selector = new THREE.Mesh(selectorGeometry, selectorMaterial);
    exports.selector.matrixAutoUpdate = false;
    exports.selector.visible = false;
    exports.scene.add(exports.selector);
    function updateSelector() {
        return __awaiter(this, void 0, void 0, function* () {
            exports.selector.position.copy(camera.position);
            exports.selector.quaternion.copy(camera.quaternion);
            exports.selector.translateZ(-5);
            exports.selector.position.set(Math.round(exports.selector.position.x), Math.round(exports.selector.position.y - 1.5), Math.round(exports.selector.position.z));
            exports.selector.rotation.set(0, 0, 0);
            exports.selector.updateMatrix();
            //console.log(selector.position);
        });
    }
    //window.setInterval(updateSelector, 1000);
    // Initialize some stuff
    forceRenderFrame();
    updateSize();
});
define("extension", ["require", "exports", "rendering", "main"], function (require, exports, rendering, main) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.load = exports.extensions = void 0;
    function msg(m) {
        self.postMessage(m);
    }
    function handleMsg(m, url, elmApp) {
        switch (m.kind) {
            /*case 'error':
                alert("An error occured in this extension: " + m.extensionUrl);
                //console.error(m.error);
                break;*/
            case 'alert':
                alert(m.content + " (from " + url + ")");
                break;
            case 'singleBlockAction':
                console.log('block action');
                elmApp.ports.newSingleBlockAction.send({
                    id: m.id,
                    name: m.name,
                    icon: m.icon,
                    url: url,
                });
                break;
            case 'setBlock':
                main.world.setBlockAt(m.x, m.y, m.z, m.newValue);
                const chunk = main.world.getChunkAt(m.x, m.z);
                if (chunk) {
                    rendering.renderChunk(chunk);
                }
                break;
            case 'log':
                console.log(m.value);
                break;
        }
    }
    // Creates the Editsc namespace available to extensions.
    function editscNs() {
        return {
            singleBlockActions: {},
            nextSingleBlockId: 0,
            onmessage: function (event) {
                const m = event.data;
                switch (m.kind) {
                    case 'singleBlockAction':
                        let _value = m.blockValue; // private
                        let block = {};
                        const prop = Object.defineProperty;
                        prop(block, 'x', { value: m.x, writable: false });
                        prop(block, 'y', { value: m.y, writable: false });
                        prop(block, 'z', { value: m.z, writable: false });
                        prop(block, 'value', {
                            get: () => {
                                return _value;
                            },
                            set: (newValue) => {
                                _value = newValue;
                                msg({
                                    kind: 'setBlock',
                                    x: m.x,
                                    y: m.y,
                                    z: m.z,
                                    newValue: newValue,
                                });
                                this.log("set block.");
                            }
                        });
                        prop(block, 'typeId', {
                            get: function () {
                                return _value & 0b1111111111;
                            }
                        });
                        this.singleBlockActions[m.actionId](block);
                        break;
                }
            },
            log: function (value) {
                msg({ kind: 'log', value: value });
            },
            a: function (text) {
                msg({ kind: 'alert', content: text });
            },
            singleBlockAction: function (opt) {
                // Generate a new unique id
                /*let id = 0;
                while (true) {
                    this.log({id:id});
                    let idAvailable = true;
                    for (let existingId in this.singleBlockActions) {
                        if (existingId == id) {
                            idAvailable = false;
                            break;
                        }
                    }
                    if (idAvailable) {
                        break;
                    }
                    id++;
                }*/
                const id = this.nextSingleBlockId;
                this.nextSingleBlockId++;
                this.singleBlockActions[id] = opt.onclick;
                this.log({ id: id });
                msg({
                    kind: 'singleBlockAction',
                    id: id, name: opt.name, icon: opt.icon
                });
            },
        };
    }
    exports.extensions = {};
    function load(url, elmApp) {
        return __awaiter(this, void 0, void 0, function* () {
            const code = `
		'use-strict';

		${msg.toString()}

		var Editsc = (
			${editscNs.toString()}
		)();

		self.onmessage = (m) => {Editsc.onmessage(m)};

		try {
			self.importScripts(
				${JSON.stringify(url + "?" + Date.now())}
			);
			main();
		}
		catch (e) {
			throw e;
		}
	`;
            console.log(code);
            const blob = new Blob([code], { 'type': "application/javascript" });
            const worker = new Worker(window.URL.createObjectURL(blob));
            worker.onmessage = function (event) {
                handleMsg(event.data, url, elmApp);
            };
            worker.onerror = function (event) {
                alert("An error occured in this extension: " + url);
                console.error({ extensionUrl: url, errorEvent: event });
            };
            exports.extensions[url] = {
                worker: worker,
            };
        });
    }
    exports.load = load;
});
