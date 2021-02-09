use seed::{prelude::*, *};
use web_sys::{FileList, HtmlInputElement, Window};


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


pub enum Ui<Ms> {
    Combine {
        items: Vec<Ui<Ms>>,
    },

    Button {
        on_click: Ms,
        text: String,
    },
    InputFile {
        on_change: std::rc::Rc<dyn Fn(FileList) -> Ms>,
        text: String,
    },
}

pub use Ui::*;


impl<Ms> IntoNodes<Ms> for Ui<Ms> {
    fn into_nodes(self) -> Vec<Node<Ms>> {
        match self {
            Combine {items} => {
                items
                    .into_iter()
                    .map(IntoNodes::into_nodes)
                    .flatten()
                    .collect()
            },
            
            Button {on_click, text} => todo!("button"),
            
            InputFile {on_change, text} => vec![
                // a lifetime issue occured with `Ms`
                /*input![
                    attrs!{
                        At::Type => "file",
                    },
                    ev(Ev::Change, move |event| {
                        let target = event
                            .current_target()
                            .unwrap();
                        let files = wasm_bindgen::JsCast
                            ::dyn_into
                                ::<HtmlInputElement>(target)
                            .unwrap()
                            .files()
                            .unwrap();
                        on_change.clone()(files)
                    }),
                ],*/
            ],
        }
    }
}
