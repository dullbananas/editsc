#[macro_use] mod utils;
mod world;

use seed::prelude::*;
use world::World;


struct Model {
    world: World,
}

fn init(_: Url, _: &mut impl Orders<Msg>) -> Model {
    Model {
        world: World::init(),
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
