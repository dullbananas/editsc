mod utils;

pub use utils::set_panic_hook;

use wasm_bindgen::prelude::*;
use bytes::{BytesMut, BufMut, Buf};


#[cfg(feature="wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;


#[wasm_bindgen]
extern {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}


#[wasm_bindgen]
pub struct ChunksReader {
    total_bytes_read: usize,
    buffer: BytesMut,
    loaded_directory: bool,
    chunk_buffers: Vec<BytesMut>
}


// Not available to js
impl ChunksReader {
    pub fn read_directory(&mut self, mut _data: BytesMut) {
        // Directory data is currently ignored
        self.loaded_directory = true;
    }

    pub fn read_chunk(&mut self, mut data: BytesMut) {
        //log(&format!("{};", data.len()));
        let magic1 = data.get_u32_le();
        let magic2 = data.get_u32_le();
        //log(&format!("{}, {}", magic1, magic2));
        if !(magic1 == 0xDEADBEEF && magic2 == 0xFFFFFFFE) {
            panic!("Wrong magic numbers");
        }
        self.chunk_buffers.push(data);
    }
}


// Methods available to JavaScript
#[wasm_bindgen]
impl ChunksReader {
    pub fn new() -> ChunksReader {
        ChunksReader {
            total_bytes_read: 0,
            buffer: BytesMut::with_capacity(1_000_000),
            loaded_directory: false,
            chunk_buffers: Vec::with_capacity(24),
        }
    }

    pub fn handleData(&mut self, data: &[u8]) {
        //let previous_byte_count = self.total_bytes_read;
        self.total_bytes_read += data.len();
        self.buffer.put(data);
        if !self.loaded_directory && self.buffer.len() >= 786444 {
            // Load chunk directory
            let mut directory_buffer = self.buffer.split_to(786444);
            self.read_directory(directory_buffer);
        } else if self.loaded_directory && self.buffer.len() >= 263184 {
            // Load a chunk
            let mut chunk_buffer = self.buffer.split_to(263184);
            self.read_chunk(chunk_buffer);
        }
    }

    pub fn toWorld(&mut self) {
        for chunk_buffer in self.chunk_buffers.drain(..) {
        }
    }

    pub fn sizeSum(&self) -> usize {
        //self.buffer.len()
        self.total_bytes_read
    }
}


struct World {
    chunks: Vec<Chunk>,
}


impl World {
    pub fn new() -> World {
        World {
            chunks: Vec::with_capacity(24),
        }
    }
}


struct Chunk {
    blocks: [u32; 65536],
}
