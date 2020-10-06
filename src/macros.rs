#[macro_export]
macro_rules! log {
    ($($arg:tt)*) => {
        logf(&format!($(arg)*));
    };
}
