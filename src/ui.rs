use seed::{prelude::*, *};
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


pub struct Ui<Ms> {
    nodes: Vec<Node<Ms>>,
}


trait IntoUi<Ms> {
    fn into_ui(self) -> Ui<Ms>;
}

impl<Ms> IntoUi<Ms> for Vec<Node<Ms>> {
    fn into_ui(self) -> Ui<Ms> {
        Ui { nodes: self }
    }
}


impl<Ms> Ui<Ms> {
    pub fn combine(items: Vec<Self>) -> Self {
        Ui {
            nodes: items
                .into_iter()
                .map(IntoNodes::into_nodes)
                .flatten()
                .collect(),
        }
    }


    pub fn button(label: String, on_click: Ms) -> Self {
        todo!("button")
    }


    pub fn column(rows: Vec<Row<Ms>>) -> Self {
        rows
            .into_iter()
            .map(|Row {nodes}| nodes)
            .flatten()
            .collect::<Vec<Node<Ms>>>()
            .into_ui()
    }


    /*pub fn file_input(
        label: String,
        on_change: impl FnOnce(FileList) -> Ms + 'static + Clone,
    ) -> Self
    where
        Ms: 'static,
    {
        vec![
            input![
                attrs!{
                    At::Type => "file",
                },
                ev(
                    Ev::Change,
                    move |event| {
                        let target = event
                            .current_target()
                            .unwrap();
                        let files = wasm_bindgen::JsCast
                            ::dyn_into
                                ::<HtmlInputElement>(target)
                            .unwrap()
                            .files()
                            .unwrap();
                        Some(on_change(files))
                    },
                ),
            ],
        ].into_ui()
    }*/
}


impl<Ms> IntoNodes<Ms> for Ui<Ms> {
    fn into_nodes(self) -> Vec<Node<Ms>> {
        self.nodes
    }
}


pub struct Row<Ms> {
    nodes: Vec<Node<Ms>>,
}
