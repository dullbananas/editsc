use seed::prelude::*;
use super::ui::*;


pub enum Page {
    Home,
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
        Combine {
            items: vec![
            ]
        }.into_nodes()
    }
}
