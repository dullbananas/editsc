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
    main_msg: Msg,
    model: &mut Model,
    orders: &mut impl Orders<Msg>,
) {
    match main_msg {
    }
}


fn view(model: &Model) -> Node<Msg> {
    seed::div![
    ]
}


#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();

    App::start("main", init, update, view);
}
