// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod stealth;
mod platform;
mod errors;
mod logging;
mod validation;
mod csp_manager;
mod openai;
#[cfg(test)]
mod tests;

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WebviewWindow, Listener};
use tracing::{info, warn, error, debug};
// Note: Ces imports ne sont plus nécessaires depuis l'utilisation du module logging


fn capture_screen_internal() -> Result<String, String> {
    use std::fs;
    use std::env;

    // Capturer l'écran principal
    let screens = screenshots::Screen::all().map_err(|e| e.to_string())?;
    let screen = screens.first().ok_or("Aucun écran trouvé")?;

    // Capturer l'écran complet
    let image = screen.capture().map_err(|e| e.to_string())?;

    // Créer le dossier de sauvegarde dans le répertoire temporaire
    let temp_dir = env::temp_dir();
    let screenshots_dir = temp_dir.join("tauri-screenshots");
    fs::create_dir_all(&screenshots_dir).map_err(|e| e.to_string())?;

    // Générer un nom de fichier unique
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("screenshot_{}.png", timestamp);
    let file_path = screenshots_dir.join(filename);

    // Sauvegarder l'image
    image.save(&file_path).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn capture_screen() -> Result<String, String> {
    capture_screen_internal()
}

#[tauri::command]
fn capture_and_analyze() -> String {
    match capture_screen_internal() {
        Ok(image_path) => format!("Capture réussie: {}", image_path),
        Err(e) => format!("Erreur de capture: {}", e),
    }
}

#[tauri::command]
fn get_image_as_base64(image_path: String) -> Result<String, String> {
    use std::fs;
    use base64::{Engine as _, engine::general_purpose};

    // Lire le fichier image
    let image_data = fs::read(&image_path).map_err(|e| format!("Erreur de lecture: {}", e))?;

    // Convertir en base64
    let base64_string = general_purpose::STANDARD.encode(&image_data);

    // Déterminer le type MIME basé sur l'extension
    let mime_type = if image_path.ends_with(".png") {
        "image/png"
    } else if image_path.ends_with(".jpg") || image_path.ends_with(".jpeg") {
        "image/jpeg"
    } else {
        "image/png" // par défaut
    };

    // Retourner l'URL data
    Ok(format!("data:{};base64,{}", mime_type, base64_string))
}

#[tauri::command]
fn close_all_windows(app: AppHandle) -> tauri::Result<()> {
    app.exit(0);
    Ok(())
}



#[tauri::command]
fn start_window_dragging(app: AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("hud") {
        window.start_dragging()?;
    }
    Ok(())
}

#[tauri::command]
fn resize_window(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    use validation::{validate_and_rate_limit, WindowSize};

    let size = WindowSize { width, height };

    validate_and_rate_limit("resize_window", size, |validated_size| {
        if let Some(window) = app.get_webview_window("hud") {
            window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                width: validated_size.width,
                height: validated_size.height
            })).map_err(|e| e.to_string())?;
        }
        Ok(())
    })
}

// Configuration du panel
const PANEL_WIDTH: f64 = 1072.0;
const PANEL_HEIGHT: f64 = 618.0;
const PANEL_INITIAL_X: f64 = 200.0;
const PANEL_INITIAL_Y: f64 = 490.0;

// Configuration de la fenêtre response ChatGPT
const RESPONSE_WIDTH: f64 = 600.0;
const RESPONSE_HEIGHT: f64 = 400.0;
const RESPONSE_INITIAL_X: f64 = 400.0;  // Même position que le panel
const RESPONSE_INITIAL_Y: f64 = 490.0;  // Même position que le panel

// Fonction d'aide pour appliquer l'état furtif actuel
fn apply_current_stealth(app: &AppHandle, win: &tauri::WebviewWindow) -> tauri::Result<()> {
    let stealth = app.state::<stealth::StealthState>().is_active();
    configure_panel_stealth(win, stealth)
}

/// Configure la fenêtre `panel` pour qu'elle soit invisible aux captures d'écran
/// Utilise NSWindow.sharingType = .none pour exclure du screen-capture
fn configure_panel_stealth(panel: &tauri::WebviewWindow, stealth: bool) -> tauri::Result<()> {
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    unsafe {
        use objc::{msg_send, sel, sel_impl};
        use objc::runtime::Object;

        let win: *mut Object = panel.ns_window()? as *mut Object;

        if stealth {
            // — exclure du screen-capture —
            // 0 = NSWindowSharingNone
            let _: () = msg_send![win, setSharingType: 0];

            // — garder les clics actifs pour l'interaction —
            // let _: () = msg_send![win, setIgnoresMouseEvents: true];
        } else {
            // — réactiver la capture —
            // 2 = NSWindowSharingReadWrite (comportement normal)
            let _: () = msg_send![win, setSharingType: 2];

            // — réactiver les clics explicitement —
            let _: () = msg_send![win, setIgnoresMouseEvents: false];
        }
    }

    #[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
    {
        tracing::warn!("Stealth mode not available - stealth_macos feature not enabled");
    }

    // Sur Windows/Linux il n'existe pas d'équivalent public pour masquer une fenêtre
    // d'une capture système. On devra accepter qu'elle soit visible ou écrire du code natif.
    Ok(())
}

fn ensure_panel(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    if let Some(w) = app.get_webview_window("panel") {
        return Ok(w); // déjà créé
    }

    let hud = app.get_webview_window("hud").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "HUD window not found")))?;
    let parent_ptr = hud.ns_window()?;

    let panel = WebviewWindowBuilder::new(
        app,
        "panel",
        WebviewUrl::External("http://localhost:1420/#/panel".parse().unwrap()),
    )
    .parent_raw(parent_ptr)                 // 🔑 Child window du HUD
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .resizable(false)
    .minimizable(false)
    .closable(false)
    .skip_taskbar(true)
    .inner_size(PANEL_WIDTH, PANEL_HEIGHT)
    .position(PANEL_INITIAL_X, PANEL_INITIAL_Y)
    .visible(false)
    .build()?;

    // 🔑 Supprimer complètement les contours de la fenêtre sur macOS
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    unsafe {
        use objc::{class, msg_send, sel, sel_impl};
        use objc::runtime::Object;
        let panel_ns: *mut Object = panel.ns_window()? as *mut Object;

        // 1) Fenêtre réellement transparente
        let clear: *mut Object = msg_send![class!(NSColor), clearColor];
        let _: () = msg_send![panel_ns, setOpaque: false];
        let _: () = msg_send![panel_ns, setBackgroundColor: clear];

        // 2) Style borderless SANS ombre
        const BORDERLESS: u64 = 0; // == NSWindowStyleMaskBorderless
        let _: () = msg_send![panel_ns, setStyleMask: BORDERLESS];
        let _: () = msg_send![panel_ns, setHasShadow: false]; // ← appeler APRÈS setStyleMask

        // 3) Appliquer le mode furtif si il est actif
        if app.state::<stealth::StealthState>().is_active() {
            println!("🔒 Applying stealth to newly created panel");
            let _: () = msg_send![panel_ns, setSharingType: 0u64];
        }
    }
    Ok(panel)
}

#[tauri::command]
fn panel_show(app: AppHandle) -> tauri::Result<()> {
    ensure_panel(&app)?;
    let _hud = app.get_webview_window("hud").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "HUD window not found")))?;
    let panel = app.get_webview_window("panel").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "Panel window not found")))?;

    // 1) Rendre visible et interactif
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    unsafe {
        use objc::{msg_send, sel, sel_impl};
        let win = panel.ns_window()? as *mut objc::runtime::Object;
        let _: () = msg_send![win, setAlphaValue: 1.0];
        let _: () = msg_send![win, setIgnoresMouseEvents: false];
    }

    // 2) Appliquer l'état furtif actuel (0 si furtif, 2 sinon)
    apply_current_stealth(&app, &panel)?;

    // 3) Afficher au-dessus du HUD
    panel.show()?;

    Ok(())
}

#[tauri::command]
fn panel_hide(app: AppHandle) -> tauri::Result<()> {
    if let Some(panel) = app.get_webview_window("panel") {
        // 1) Rendre invisible et non-interactif
        #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = panel.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, setAlphaValue: 0.0];
            let _: () = msg_send![win, setIgnoresMouseEvents: true];
        }

        // 2) Appliquer l'état furtif actuel (reste 0 si furtif)
        apply_current_stealth(&app, &panel)?;
    }
    Ok(())
}

// === RESPONSE WINDOW MANAGEMENT ===

fn ensure_response(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    if let Some(w) = app.get_webview_window("response") {
        return Ok(w); // déjà créé
    }

    let hud = app.get_webview_window("hud").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "HUD window not found")))?;
    let parent_ptr = hud.ns_window()?;

    let response = WebviewWindowBuilder::new(
        app,
        "response",
        WebviewUrl::External("http://localhost:1420/#/response".parse().unwrap()),
    )
    // .on_page_load(move |window, _| {
    //     println!("🔔 Response window page loaded: {}", window.label());
    //     // Open DevTools to debug
    //     let _ = window.open_devtools();
    // })
    .parent_raw(parent_ptr)                 // Child window du HUD
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .resizable(false)
    .minimizable(false)
    .closable(false)
    .skip_taskbar(true)
    .inner_size(RESPONSE_WIDTH, RESPONSE_HEIGHT)
    .position(RESPONSE_INITIAL_X, RESPONSE_INITIAL_Y)
    .visible(false)
    .build()?;

    // Style macOS similaire au panel
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    unsafe {
        use objc::{class, msg_send, sel, sel_impl};
        use objc::runtime::Object;
        let response_ns: *mut Object = response.ns_window()? as *mut Object;

        // Fenêtre transparente
        let clear: *mut Object = msg_send![class!(NSColor), clearColor];
        let _: () = msg_send![response_ns, setOpaque: false];
        let _: () = msg_send![response_ns, setBackgroundColor: clear];

        // Style borderless sans ombre
        const BORDERLESS: u64 = 0;
        let _: () = msg_send![response_ns, setStyleMask: BORDERLESS];
        let _: () = msg_send![response_ns, setHasShadow: false];

        // Appliquer stealth si actif
        if app.state::<stealth::StealthState>().is_active() {
            let _: () = msg_send![response_ns, setSharingType: 0u64];
        }
    }
    Ok(response)
}

#[tauri::command]
fn response_show(app: AppHandle) -> tauri::Result<()> {
    ensure_response(&app)?;
    let response = app.get_webview_window("response").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "Response window not found")))?;

    // Rendre visible
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    unsafe {
        use objc::{msg_send, sel, sel_impl};
        let win = response.ns_window()? as *mut objc::runtime::Object;
        let _: () = msg_send![win, setAlphaValue: 1.0];
        let _: () = msg_send![win, setIgnoresMouseEvents: false];
    }

    // Appliquer l'état furtif actuel
    apply_current_stealth(&app, &response)?;

    response.show()?;
    Ok(())
}

#[tauri::command]
fn response_hide(app: AppHandle) -> tauri::Result<()> {
    if let Some(response) = app.get_webview_window("response") {
        #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = response.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, setAlphaValue: 0.0];
            let _: () = msg_send![win, setIgnoresMouseEvents: true];
        }

        apply_current_stealth(&app, &response)?;
    }
    Ok(())
}

#[tauri::command]
fn test_response_window(app: AppHandle) -> tauri::Result<()> {
    println!("🧪 Testing response window...");

    // Ensure response window exists
    ensure_response(&app)?;
    println!("🧪 Response window ensured");

    let response = app.get_webview_window("response").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "Response window not found")))?;
    println!("🧪 Got response window");

    // Show it
    response.show()?;
    println!("🧪 Response window shown");

    // Test event emission
    app.emit_to("response", "test:event", serde_json::json!({ "test": "Hello from Rust!" }))?;
    println!("🧪 Test event emitted");

    Ok(())
}

#[tauri::command]
fn start_chat(app: AppHandle, message: String) -> tauri::Result<()> {
    println!("🚀 start_chat called with message: {}", message);

    // 1) Assure/affiche la fenêtre réponse
    let response = ensure_response(&app)?;
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    unsafe {
        use objc::{msg_send, sel, sel_impl};
        let win = response.ns_window()? as *mut objc::runtime::Object;
        let _: () = msg_send![win, setAlphaValue: 1.0];
        let _: () = msg_send![win, setIgnoresMouseEvents: false];
    }
    apply_current_stealth(&app, &response)?;
    response.show()?;
    println!("🚀 Response window shown");

    // 2) Attends le "response:ready" envoyé par la webview, puis émet "chat:start"
    let app_for_start = app.clone();
    let msg_for_start = message.clone();
    let mut chat_started = std::sync::Mutex::new(false);
    app_for_start.clone().listen("response:ready", move |_| {
        let mut started = chat_started.lock().unwrap();
        if !*started {
            *started = true;
            println!("✅ response:ready received — emitting chat:start");
            let _ = app_for_start.emit_to(
                "response",
                "chat:start",
                serde_json::json!({ "message": msg_for_start }),
            );
        } else {
            println!("⚠️ response:ready received again, ignoring");
        }
    });

    // 3) Chat OpenAI en async, et on **cible** la fenêtre "response"
    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        match openai::chat_with_openai(openai::ChatRequest {
            message: message.clone(),
            conversation_id: None,
            context: None,
        }).await {
            Ok(chat_response) => {
                println!("🤖 OpenAI response: {}", chat_response.message);
                println!("🚀 Emitting chat:response to response window");
                let _ = app_clone.emit_to("response", "chat:response", serde_json::json!({
                    "message": chat_response.message,
                    "conversation_id": chat_response.conversation_id,
                    "tokens_used": chat_response.tokens_used,
                    "model": chat_response.model,
                }));
                println!("✅ chat:response emitted");
            }
            Err(e) => {
                println!("❌ OpenAI error: {}", e);
                let _ = app_clone.emit_to("response", "chat:error", serde_json::json!({
                    "error": e.to_string(),
                }));
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn toggle_stealth_cmd(app: AppHandle) -> Result<bool, String> {
    use validation::check_rate_limit;

    // Rate limit cette commande sensible
    check_rate_limit("toggle_stealth_cmd").map_err(|e| e.to_string())?;

    stealth::toggle_stealth(&app).map_err(|e| e.to_string())?;
    let active = app.state::<stealth::StealthState>().is_active();

    // Émettre un événement enrichi avec métadonnées
    let _ = app.emit("stealth:changed", serde_json::json!({
        "active": active,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "observability_disabled": active,
        "source": "manual_toggle"
    }));

    info!("🔄 Stealth mode toggled: {} (manual)", if active { "ON" } else { "OFF" });

    Ok(active)
}

#[tauri::command]
fn get_stealth_status(app: AppHandle) -> bool {
    app.state::<stealth::StealthState>().is_active()
}

#[tauri::command]
fn test_stealth_manual(app: AppHandle) {
    println!("🧪 Test manuel du mode furtif");
    let _ = stealth::toggle_stealth(&app);
}

// Commandes pour le stockage sécurisé - avec validation
#[tauri::command]
fn secure_store(key: String, value: String) -> Result<(), String> {
    use keyring::Entry;
    use validation::{validate_and_rate_limit, SecureKeyValue};

    let kv = SecureKeyValue { key, value };

    validate_and_rate_limit("secure_store", kv, |validated_kv| {
        let entry = Entry::new("numa", &validated_kv.key)
            .map_err(|e| format!("Erreur lors de la création de l'entrée: {}", e))?;

        entry.set_password(&validated_kv.value)
            .map_err(|e| format!("Erreur lors du stockage sécurisé: {}", e))?;

        Ok(())
    })
}

#[tauri::command]
fn secure_load(key: String) -> Result<String, String> {
    use keyring::Entry;
    use validation::{validate_and_rate_limit, SecureKey};

    let secure_key = SecureKey { key };

    validate_and_rate_limit("secure_load", secure_key, |validated_key| {
        let entry = Entry::new("numa", &validated_key.key)
            .map_err(|e| format!("Erreur lors de la création de l'entrée: {}", e))?;

        entry.get_password()
            .map_err(|e| format!("Erreur lors de la récupération sécurisée: {}", e))
    })
}

#[tauri::command]
fn secure_delete(key: String) -> Result<(), String> {
    use keyring::Entry;
    use validation::{validate_and_rate_limit, SecureKey};

    let secure_key = SecureKey { key };

    validate_and_rate_limit("secure_delete", secure_key, |validated_key| {
        let entry = Entry::new("numa", &validated_key.key)
            .map_err(|e| format!("Erreur lors de la création de l'entrée: {}", e))?;

        entry.delete_password()
            .map_err(|e| format!("Erreur lors de la suppression sécurisée: {}", e))?;

        Ok(())
    })
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 🚀 Initialize comprehensive logging system FIRST
    logging::init_comprehensive_logging();

    info!("🚀 Starting Numa application...");
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    {
        info!("🕵️ Stealth mode enabled - macOS private APIs active");
    }
    #[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
    {
        warn!("🕵️ Stealth mode disabled - macOS private APIs not available");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(stealth::StealthState::default())
        .invoke_handler(tauri::generate_handler![
            capture_and_analyze,
            capture_screen,
            get_image_as_base64,
            close_all_windows,
            start_window_dragging,
            resize_window,
            panel_show,
            panel_hide,
            response_show,
            response_hide,
            test_response_window,
            start_chat,
            toggle_stealth_cmd,
            get_stealth_status,
            test_stealth_manual,
            secure_store,
            secure_load,
            secure_delete,
            csp_manager::get_dynamic_csp_policy,
            csp_manager::get_csp_for_context,
            openai::chat_with_openai,
            openai::store_openai_key,
            openai::get_chat_config
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                window.app_handle().exit(0);
            }
        })
        .setup(|app| {
            info!("Setting up application...");

            // Forcer le HUD au premier plan
            if let Some(hud_win) = app.get_webview_window("hud") {
                hud_win.set_focus().ok();
                info!("HUD window focused");
            }

            // 🚀 Setup background tasks
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(1000));

                #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
                {
                    if let Err(e) = stealth::force_stealth_on(&app_handle) {
                        error!("Failed to force stealth on: {}", e);
                    } else {
                        info!("🕵️ Stealth mode activated on startup");
                    }
                }

                #[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
                {
                    info!("🕵️ Skipping stealth activation - feature not enabled");
                }

                // 🧹 Setup periodic rate limiter cleanup
                let _app_handle_cleanup = app_handle.clone();
                std::thread::spawn(move || {
                    loop {
                        std::thread::sleep(std::time::Duration::from_secs(300)); // Every 5 minutes
                        validation::cleanup_rate_limiter();
                        debug!("🧹 Rate limiter cleanup completed");
                    }
                });

                // Émettre un événement pour signaler que l'application est prête
                if let Err(e) = app_handle.emit("app-ready", ()) {
                    error!("Failed to emit app-ready event: {}", e);
                } else {
                    info!("App ready event emitted");
                }
            });

            info!("Application setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
