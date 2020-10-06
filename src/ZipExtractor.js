// JSZip library used here


module('ZipExtractor',
['Wasm'],
async (Wasm) => {
    class Obj {
        constructor() {}

        async init(file) {
            const zip = await JSZip.loadAsync(file);
            const chunks = zip.file(/Chunks32h\.dat$/)[0];
            const project = zip.file(/Project\.xml$/)[0];
            if (typeof chunks === 'undefined' || typeof project === 'undefined') {
                throw "Missing file(s) in world";
            }

            const reader = Wasm.ChunksReader.new();
            
            const streamHelper = chunks.internalStream('uint8array')
            .on('data', (data, meta) => {
                //console.log(meta.percent);
                await reader.handleData(data);
            })
            .on('error', (e) => {
                throw e;
            })
            .on('end', () => {
                console.log("end");
                console.log(reader.sizeSum());
                this.world = reader.toWorld();
            });
            streamHelper.resume();
            
            /*const collector = new BytesCollector(
                chunks,
                (data) => {
                    console.log(data.byteLength);
                },
                () => {
                    console.log('end');
                }
            );*/
        }
    }


    /*class BytesCollector {
        constructor(zipEntry, ondata, onend) {
            this.streamHelper = zipEntry.internalStream('uint8array')
            .on('data', (data, meta) => {
                console.log(meta);
                this.resolveData(data);
            })
            .on('end', () => {
                this.resolveEnd();
            })
            .on('error', (e) => {
                console.log(e);
            });
            
            let collected = null;
            do {
                collected = await this.collect();
                const
            } while (collected);
        }

        async collect() {
            const data = new Promise(resolve => {
                this.resolveData = resolve;
                this.resolveEnd = () => {resolve(null);};
            });
            this.streamHelper.resume();
            const result = await data;
            this.streamHelper.pause();
            return result;
        }
    }*/


    async function create(file) {
        const obj = new Obj();
        await obj.init(file);
        return obj;
    }


    return {
        create: create,
    };
});