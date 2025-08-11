// src-tauri/src/stealth.rs
#![allow(clippy::missing_safety_doc)]

use tauri::{AppHandle, Manager, Emitter};
use std::sync::{Arc, Mutex};
use tracing::{info, warn, error};
use serde_json;
use crate::platform::apply_stealth_to_window;

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
pub fn toggle_stealth(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<StealthState>().clone();
    let active = {
        let mut guard = state.0.lock().unwrap();
        *guard = !*guard;
        *guard
    };

    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    {
        info!("🕵️ Toggle stealth: active = {}", active);
    }

    #[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
    {
        warn!("🕵️ Stealth mode requested but stealth_macos feature not enabled");
        return Ok(());
    }

    // Toutes les opérations AppKit *doivent* être sur le thread UI.
    let _ = app.run_on_main_thread({
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

    // Émettre les événements legacy + nouveaux événements enrichis
    let _ = app.emit(
        if active { "stealth-activated" } else { "stealth-deactivated" },
        (),
    );
    
    // Nouvel événement unifié avec métadonnées
    let _ = app.emit("stealth:changed", serde_json::json!({
        "active": active,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "observability_disabled": active,
        "source": "api_toggle"
    }));

    Ok(())
}

// Fonction optionnelle pour rendre les fenêtres traversantes
pub fn make_windows_click_through(app: &AppHandle, click_through: bool) -> Result<(), String> {
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    {
        info!("Setting windows click through: {}", click_through);
    }

    #[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
    {
        warn!("Click through requested but stealth_macos feature not enabled");
        return Ok(());
    }
    
    let _ = app.run_on_main_thread({
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
pub fn force_stealth_on(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<StealthState>().clone();
    {
        let mut guard = state.0.lock().unwrap();
        *guard = true;
    }
    
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    {
        info!("🕵️ Force stealth mode ON");
    }

    #[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
    {
        warn!("🕵️ Force stealth requested but stealth_macos feature not enabled");
        return Ok(());
    }
    
    // Appliquer le mode furtif à toutes les fenêtres existantes
    let _ = app.run_on_main_thread({
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
    
    // Émettre les événements pour informer le frontend
    let _ = app.emit("stealth-activated", ());
    let _ = app.emit("stealth:changed", serde_json::json!({
        "active": true,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "observability_disabled": true,
        "source": "force_startup"
    }));
    
    Ok(())
}
