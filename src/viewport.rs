use wasm_bindgen::prelude::*;
use web_sys::Window;


pub struct Viewport {
    width: u32,
    height: u32,
}


impl Viewport {
    pub fn from_window(window: &Window) -> Viewport {
        Viewport {
            width: unwrap_u32(window.inner_width()),
            height: unwrap_u32(window.inner_height()),
        }
    }


    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }
}


fn unwrap_u32(result: Result<JsValue, JsValue>) -> u32 {
    result
        .unwrap()
        .as_f64()
        .unwrap()
        as u32
}