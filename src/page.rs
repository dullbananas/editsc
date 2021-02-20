use seed::prelude::*;
use super::ui::*;


pub enum Page {
    Home,

    Import {
        files: web_sys::FileList,
    },
}


pub enum Msg {
}


impl Page {
    pub fn init() -> Page {
        Page::Home
    }


    pub fn update(
        &mut self,
        msg: Msg,
        orders: &mut impl Orders<Msg>,
    ) {
        match msg {
        }
    }


    pub fn view(&self) -> Vec<Node<Msg>> {
        Ui::combine(vec![
        ]).into_nodes()
    }
}
