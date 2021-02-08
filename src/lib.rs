mod page;
mod ui;
#[macro_use] mod utils;
mod world;

use page::Page;
use seed::prelude::*;
use ui::Viewport;
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
    Page(page::Msg),
}


fn update(
    main_msg: Msg,
    model: &mut Model,
    orders: &mut impl Orders<Msg>,
) {
    match main_msg {
        Msg::Page(msg) =>
            model.current_page.update(
                msg,
                &mut orders.proxy(Msg::Page),
            ),
    }
}


fn view(model: &Model) -> Node<Msg> {
    seed::div![
        seed::div![
            model.current_page
                .view()
                .map_msg(Msg::Page),
        ],
    ]
}


#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();

    App::start("main", init, update, view);
}
