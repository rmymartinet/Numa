// src-tauri/src/stealth.rs
#![allow(clippy::missing_safety_doc)]

use tauri::{AppHandle, Manager, Emitter};
use std::sync::{Arc, Mutex};

/// Partagé dans l'app pour savoir si le mode furtif est actif.
#[derive(Default, Clone)]
pub struct StealthState(Arc<Mutex<bool>>);

impl StealthState {
    pub fn is_active(&self) -> bool {
        *self.0.lock().unwrap()
    }
}

/// Initialiser dans `tauri::Builder`
/// .manage(StealthState::default())
pub fn toggle_stealth(app: &AppHandle) {
    let state = app.state::<StealthState>().clone();
    let active = {
        let mut guard = state.0.lock().unwrap();
        *guard = !*guard;
        *guard
    };

    // Toutes les opérations AppKit *doivent* être sur le thread UI.
    app.run_on_main_thread({
        let app = app.clone();
        move || unsafe {
            println!("🕵️ Toggle stealth: active = {}", active);
            
            // Appliquer à toutes les fenêtres existantes
            for label in ["hud", "panel"] {
                if let Some(window) = app.get_webview_window(label) {
                    if let Ok(win) = window.ns_window() {
                        println!("✅ {} window found, applying stealth...", label);
                        if active {
                            hide_ns_window(win as _);
                        } else {
                            show_ns_window(win as _);
                        }
                    } else {
                        println!("❌ {} ns_window() failed", label);
                    }
                } else {
                    println!("❌ {} window not found", label);
                }
            }
        }
    });

    let _ = app.emit(
        if active { "stealth-activated" } else { "stealth-deactivated" },
        (),
    );
}

#[cfg(target_os = "macos")]
unsafe fn hide_ns_window(win: *mut objc::runtime::Object) {
    use objc::{msg_send, sel, sel_impl};
    // 0 = NSWindowSharingNone → jamais envoyé au compositor partagé
    let _: () = msg_send![win, setSharingType: 0u64];
    println!("🔒 Window hidden from screen capture (sharingType = 0)");
    // Garder les clics actifs pour pouvoir interagir avec l'interface
    // let _: () = msg_send![win, setIgnoresMouseEvents: true];
}

#[cfg(target_os = "macos")]
unsafe fn show_ns_window(win: *mut objc::runtime::Object) {
    use objc::{msg_send, sel, sel_impl};
    // 2 = NSWindowSharingReadWrite (comportement normal)
    let _: () = msg_send![win, setSharingType: 2u64];
    // Réactiver les clics explicitement
    let _: () = msg_send![win, setIgnoresMouseEvents: false];
    println!("👁️ Window visible in screen capture (sharingType = 2)");
}

// --- NO-OP stubs pour Windows/Linux ---------------------------------------
#[cfg(not(target_os = "macos"))]
unsafe fn hide_ns_window(_: *mut core::ffi::c_void) {}
#[cfg(not(target_os = "macos"))]
unsafe fn show_ns_window(_: *mut core::ffi::c_void) {}

// Fonction optionnelle pour rendre les fenêtres traversantes
#[cfg(target_os = "macos")]
pub unsafe fn make_windows_click_through(app: &AppHandle, click_through: bool) {
    use objc::{msg_send, sel, sel_impl};
    
    app.run_on_main_thread({
        let app = app.clone();
        move || unsafe {
            if let Some(hud) = app.get_webview_window("hud") {
                if let Ok(win) = hud.ns_window() {
                    let _: () = msg_send![win as *mut objc::runtime::Object, setIgnoresMouseEvents: click_through];
                }
            }
            if let Some(panel) = app.get_webview_window("panel") {
                if let Ok(win) = panel.ns_window() {
                    let _: () = msg_send![win as *mut objc::runtime::Object, setIgnoresMouseEvents: click_through];
                }
            }
        }
    });
}

#[cfg(not(target_os = "macos"))]
pub unsafe fn make_windows_click_through(_: &AppHandle, _: bool) {}

// Fonction pour forcer l'activation du mode furtif
pub fn force_stealth_on(app: &AppHandle) {
    let state = app.state::<StealthState>().clone();
    {
        let mut guard = state.0.lock().unwrap();
        *guard = true;
    }
    
    // Appliquer le mode furtif à toutes les fenêtres existantes
    app.run_on_main_thread({
        let app = app.clone();
        move || unsafe {
            println!("🕵️ Force stealth mode ON");
            
            // Appliquer à toutes les fenêtres existantes
            for label in ["hud", "panel"] {
                if let Some(window) = app.get_webview_window(label) {
                    if let Ok(win) = window.ns_window() {
                        println!("✅ {} window found, applying stealth...", label);
                        hide_ns_window(win as _);
                    } else {
                        println!("❌ {} ns_window() failed", label);
                    }
                } else {
                    println!("❌ {} window not found", label);
                }
            }
        }
    });
    
    // Émettre l'événement pour informer le frontend
    let _ = app.emit("stealth-activated", ());
}
