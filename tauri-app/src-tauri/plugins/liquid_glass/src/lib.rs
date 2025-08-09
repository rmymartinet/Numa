use tauri::{plugin::Builder, Runtime};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct LiquidGlassConfig {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub material: Option<String>, // "hudWindow", "glass", "liquid"
}

#[tauri::command]
async fn start_liquid_glass<R: Runtime>(
    window: tauri::Window<R>,
    config: LiquidGlassConfig,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use crate::macos::liquid_glass::start_liquid_glass_impl;
        start_liquid_glass_impl(window, config)
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Liquid Glass is only available on macOS".to_string())
    }
}

#[tauri::command]
async fn update_liquid_glass_frame<R: Runtime>(
    window: tauri::Window<R>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use crate::macos::liquid_glass::update_liquid_glass_frame_impl;
        update_liquid_glass_frame_impl(window, x, y, width, height)
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Liquid Glass is only available on macOS".to_string())
    }
}

#[tauri::command]
async fn stop_liquid_glass<R: Runtime>(window: tauri::Window<R>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use crate::macos::liquid_glass::stop_liquid_glass_impl;
        stop_liquid_glass_impl(window)
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Liquid Glass is only available on macOS".to_string())
    }
}

pub fn init<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
    Builder::new("liquid_glass")
        .invoke_handler(tauri::generate_handler![
            start_liquid_glass,
            update_liquid_glass_frame,
            stop_liquid_glass
        ])
        .build()
}

#[cfg(target_os = "macos")]
mod macos {
    pub mod liquid_glass;
}
