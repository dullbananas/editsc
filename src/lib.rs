#[macro_use] mod utils;
mod world;

use wasm_bindgen::prelude::*;
use world::World;


#[wasm_bindgen]
pub struct Model {
    world: World,
}


#[wasm_bindgen]
impl Model {
    pub fn init() -> Model {
        Model {
            world: World::init(),
        }
    }


    pub fn update(&mut self) {
    }
}


#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}
