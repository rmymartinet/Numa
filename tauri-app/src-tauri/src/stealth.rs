// src-tauri/src/stealth.rs
#![allow(clippy::missing_safety_doc)]

use tauri::{AppHandle, Manager, Emitter};
use std::sync::{Arc, Mutex};
use tracing::{info, warn, error};
use crate::platform::{apply_stealth_to_window, hide_window_visually, show_window_visually};
use crate::errors::{StealthError, AppResult};

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
pub fn toggle_stealth(app: &AppHandle) -> AppResult<()> {
    let state = app.state::<StealthState>().clone();
    let active = {
        let mut guard = state.0.lock().unwrap();
        *guard = !*guard;
        *guard
    };

    info!("🕵️ Toggle stealth: active = {}", active);

    // Toutes les opérations AppKit *doivent* être sur le thread UI.
    app.run_on_main_thread({
        let app = app.clone();
        move || {
            // Appliquer à toutes les fenêtres existantes
            for label in ["hud", "panel"] {
                if let Some(window) = app.get_webview_window(label) {
                    match apply_stealth_to_window(&window, active) {
                        Ok(_) => info!("✅ {} window stealth applied", label),
                        Err(e) => error!("❌ {} window stealth failed: {}", label, e),
                    }
                } else {
                    warn!("❌ {} window not found", label);
                }
            }
        }
    });

    let _ = app.emit(
        if active { "stealth-activated" } else { "stealth-deactivated" },
        (),
    );

    Ok(())
}



// Fonction optionnelle pour rendre les fenêtres traversantes
pub fn make_windows_click_through(app: &AppHandle, click_through: bool) -> AppResult<()> {
    info!("Setting windows click through: {}", click_through);
    
    app.run_on_main_thread({
        let app = app.clone();
        move || {
            for label in ["hud", "panel"] {
                if let Some(window) = app.get_webview_window(label) {
                    match apply_stealth_to_window(&window, false) {
                        Ok(_) => info!("✅ {} window click through applied", label),
                        Err(e) => error!("❌ {} window click through failed: {}", label, e),
                    }
                }
            }
        }
    });
    
    Ok(())
}

// Fonction pour forcer l'activation du mode furtif
pub fn force_stealth_on(app: &AppHandle) -> AppResult<()> {
    let state = app.state::<StealthState>().clone();
    {
        let mut guard = state.0.lock().unwrap();
        *guard = true;
    }
    
    info!("🕵️ Force stealth mode ON");
    
    // Appliquer le mode furtif à toutes les fenêtres existantes
    app.run_on_main_thread({
        let app = app.clone();
        move || {
            // Appliquer à toutes les fenêtres existantes
            for label in ["hud", "panel"] {
                if let Some(window) = app.get_webview_window(label) {
                    match apply_stealth_to_window(&window, true) {
                        Ok(_) => info!("✅ {} window stealth applied", label),
                        Err(e) => error!("❌ {} window stealth failed: {}", label, e),
                    }
                } else {
                    warn!("❌ {} window not found", label);
                }
            }
        }
    });
    
    // Émettre l'événement pour informer le frontend
    let _ = app.emit("stealth-activated", ());
    
    Ok(())
}
