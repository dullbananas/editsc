mod page;
#[macro_use] mod utils;
mod viewport;
mod world;

use page::Page;
use seed::prelude::*;
use viewport::Viewport;
use world::World;


struct Model {
    current_page: Page,
    previous_pages: Vec<Page>,
    viewport: Viewport,
    world: World,
}

fn init(_: Url, _: &mut impl Orders<Msg>) -> Model {
    let window = web_sys::window()
        .unwrap();
    Model {
        current_page: Page::init(),
        previous_pages: Vec::with_capacity(4),
        viewport: Viewport::from_window(&window),
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
    ]
}


#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();

    App::start("main", init, update, view);
}
