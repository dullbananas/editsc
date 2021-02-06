use wasm_bindgen::prelude::*;

// Some macros are derrived from the standard library


#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_string(string: &str);
}


macro_rules! dbg {
    /*() => {
        $crate::eprintln!("[{}:{}]", $crate::file!(), $crate::line!());
    };*/
    ($val:expr $(,)?) => {
        // Use of `match` here is intentional because it affects the lifetimes of temporaries - https://stackoverflow.com/a/48732525/1063961
        match $val {
            tmp => {
                let output = ::std::format!(
                    "[{}:{}] {} = {:#?}",
                    ::std::file!(),
                    ::std::line!(),
                    ::std::stringify!($val),
                    &tmp
                );
                // rust-analyzer falsely reports an error without this `unsafe` block
                #[allow(unused_unsafe)]
                unsafe {
                    $crate::utils::log_string(&output);
                }
                tmp
            }
        }
    };
    ($($val:expr),+ $(,)?) => {
        ($($crate::dbg!($val)),+,)
    };
}
