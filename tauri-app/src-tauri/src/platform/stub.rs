//! Module stub pour les plateformes non-macOS
//! Fournit des implémentations no-op pour maintenir la compatibilité

use tauri::WebviewWindow;

/// Type de partage de fenêtre (non utilisé sur les autres plateformes)
#[repr(u64)]
pub enum NSWindowSharingType {
    None = 0,
    ReadWrite = 2,
}

/// Configure le type de partage d'une fenêtre (no-op sur autres plateformes)
pub fn set_window_sharing_type(_window: *mut (), _sharing_type: NSWindowSharingType) {
    // No-op sur les autres plateformes
    tracing::warn!("set_window_sharing_type called on non-macOS platform");
}

/// Configure l'alpha d'une fenêtre (no-op sur autres plateformes)
pub fn set_window_alpha(_window: *mut (), _alpha: f64) {
    // No-op sur les autres plateformes
    tracing::warn!("set_window_alpha called on non-macOS platform");
}

/// Configure si une fenêtre ignore les événements souris (no-op sur autres plateformes)
pub fn set_window_ignores_mouse_events(_window: *mut (), _ignores: bool) {
    // No-op sur les autres plateformes
    tracing::warn!("set_window_ignores_mouse_events called on non-macOS platform");
}

/// Applique le style borderless à une fenêtre (no-op sur autres plateformes)
pub fn set_window_borderless(_window: *mut ()) {
    // No-op sur les autres plateformes
    tracing::warn!("set_window_borderless called on non-macOS platform");
}

/// Obtient la fenêtre NS d'une WebviewWindow Tauri (erreur sur autres plateformes)
pub fn get_ns_window(_webview: &WebviewWindow) -> Result<*mut (), tauri::Error> {
    Err(tauri::Error::from(std::io::Error::new(
        std::io::ErrorKind::Unsupported,
        "NSWindow not available on this platform"
    )))
}

/// Applique le mode furtif à une fenêtre (no-op sur autres plateformes)
pub fn apply_stealth_to_window(_webview: &WebviewWindow, _stealth: bool) -> Result<(), tauri::Error> {
    tracing::warn!("Stealth mode not supported on this platform");
    Ok(())
}

/// Cache visuellement une fenêtre (no-op sur autres plateformes)
pub fn hide_window_visually(_webview: &WebviewWindow) -> Result<(), tauri::Error> {
    tracing::warn!("Visual hiding not supported on this platform");
    Ok(())
}

/// Affiche visuellement une fenêtre (no-op sur autres plateformes)
pub fn show_window_visually(_webview: &WebviewWindow) -> Result<(), tauri::Error> {
    tracing::warn!("Visual showing not supported on this platform");
    Ok(())
}
