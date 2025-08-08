//! Module spécifique à macOS
//! Contient tout le code unsafe et les appels AppKit

use objc::{msg_send, sel, sel_impl};
use objc::runtime::Object;
use tauri::WebviewWindow;

/// Définit les types de partage de fenêtre macOS
#[repr(u64)]
pub enum NSWindowSharingType {
    None = 0,
    ReadWrite = 2,
}

/// Configure le type de partage d'une fenêtre (invisible aux captures)
pub fn set_window_sharing_type(window: *mut Object, sharing_type: NSWindowSharingType) {
    unsafe {
        let _: () = msg_send![window, setSharingType: sharing_type as u64];
    }
}

/// Configure l'alpha d'une fenêtre (transparence)
pub fn set_window_alpha(window: *mut Object, alpha: f64) {
    unsafe {
        let _: () = msg_send![window, setAlphaValue: alpha];
    }
}

/// Configure si une fenêtre ignore les événements souris
pub fn set_window_ignores_mouse_events(window: *mut Object, ignores: bool) {
    unsafe {
        let _: () = msg_send![window, setIgnoresMouseEvents: ignores];
    }
}

/// Applique le style borderless à une fenêtre
pub fn set_window_borderless(window: *mut Object) {
    unsafe {
        let _: () = msg_send![window, setStyleMask: 0];
    }
}

/// Obtient la fenêtre NS d'une WebviewWindow Tauri
pub fn get_ns_window(webview: &WebviewWindow) -> Result<*mut Object, tauri::Error> {
    let ns_window = webview.ns_window()?;
    Ok(ns_window as *mut Object)
}

/// Applique le mode furtif à une fenêtre
pub fn apply_stealth_to_window(webview: &WebviewWindow, stealth: bool) -> Result<(), tauri::Error> {
    let window = get_ns_window(webview)?;
    
    if stealth {
        set_window_sharing_type(window, NSWindowSharingType::None);
        tracing::info!("Window hidden from screen capture (sharingType = 0)");
    } else {
        set_window_sharing_type(window, NSWindowSharingType::ReadWrite);
        set_window_ignores_mouse_events(window, false);
        tracing::info!("Window visible in screen capture (sharingType = 2)");
    }
    
    Ok(())
}

/// Cache visuellement une fenêtre (alpha = 0, ignore mouse events)
pub fn hide_window_visually(webview: &WebviewWindow) -> Result<(), tauri::Error> {
    let window = get_ns_window(webview)?;
    set_window_alpha(window, 0.0);
    set_window_ignores_mouse_events(window, true);
    Ok(())
}

/// Affiche visuellement une fenêtre (alpha = 1, accepte mouse events)
pub fn show_window_visually(webview: &WebviewWindow) -> Result<(), tauri::Error> {
    let window = get_ns_window(webview)?;
    set_window_alpha(window, 1.0);
    set_window_ignores_mouse_events(window, false);
    Ok(())
}
