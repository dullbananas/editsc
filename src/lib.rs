#[macro_use] mod utils;

use seed::prelude::*;
//use wasm_bindgen::prelude::*;


struct Model {
}

fn init(_: Url, _: &mut impl Orders<Msg>) -> Model {
    Model {
    }
}


enum Msg {
}


fn update(
    msg: Msg,
    model: &mut Model,
    _: &mut impl Orders<Msg>,
) {
    match msg {
    }
}


fn view(model: &Model) -> Node<Msg> {
    seed::div![
        "Hello world",
    ]
}


#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    dbg!("Hello world");

    App::start("main", init, update, view);
}
