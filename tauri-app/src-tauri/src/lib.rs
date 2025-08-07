// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod stealth;
#[cfg(test)]
mod tests;

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WebviewWindow};


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
fn resize_window(app: AppHandle, width: f64, height: f64) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("hud") {
        window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))?;
    }
    Ok(())
}




// Configuration du panel
const PANEL_WIDTH: f64 = 1072.0;
const PANEL_HEIGHT: f64 = 618.0;
const PANEL_INITIAL_X: f64 = 200.0;
const PANEL_INITIAL_Y: f64 = 490.0;

/// Configure la fenêtre `panel` pour qu'elle soit invisible aux captures d'écran
/// Utilise NSWindow.sharingType = .none pour exclure du screen-capture
fn configure_panel_stealth(panel: &tauri::WebviewWindow, stealth: bool) -> tauri::Result<()> {
    #[cfg(target_os = "macos")]
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
    #[cfg(target_os = "macos")]
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
    }
    Ok(panel)
}

#[tauri::command]
fn panel_show(app: AppHandle) -> tauri::Result<()> {
    ensure_panel(&app)?;
    let _hud = app.get_webview_window("hud").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "HUD window not found")))?;
    let panel = app.get_webview_window("panel").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "Panel window not found")))?;

    // 1) Rendre visible et interactif
    #[cfg(target_os = "macos")]
    unsafe {
        use objc::{msg_send, sel, sel_impl};
        let win = panel.ns_window()? as *mut objc::runtime::Object;
        let _: () = msg_send![win, setAlphaValue: 1.0];
        let _: () = msg_send![win, setIgnoresMouseEvents: false];
    }
    
    // 2) Réactiver la capture d'écran
    configure_panel_stealth(&panel, false)?;
    
    // 3) Afficher au-dessus du HUD
    panel.show()?;
    
    Ok(())
}

#[tauri::command]
fn panel_hide(app: AppHandle) -> tauri::Result<()> {
    if let Some(panel) = app.get_webview_window("panel") {
        // 1) Rendre invisible et non-interactif
        #[cfg(target_os = "macos")]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = panel.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, setAlphaValue: 0.0];
            let _: () = msg_send![win, setIgnoresMouseEvents: true];
        }
        
        // 2) Exclure de la capture d'écran
        configure_panel_stealth(&panel, true)?;
    }
    Ok(())
}

#[tauri::command]
fn toggle_stealth_cmd(app: AppHandle) {
    stealth::toggle_stealth(&app);
}

#[tauri::command]
fn get_stealth_status(app: AppHandle) -> bool {
    app.state::<stealth::StealthState>().is_active()
}

#[tauri::command]
fn test_stealth_manual(app: AppHandle) {
    println!("🧪 Test manuel du mode furtif");
    stealth::toggle_stealth(&app);
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
            toggle_stealth_cmd,
            get_stealth_status,
            test_stealth_manual
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                window.app_handle().exit(0);
            }
        })
        .setup(|app| {
            // Forcer le HUD au premier plan
            if let Some(hud_win) = app.get_webview_window("hud") {
                hud_win.set_focus().ok();
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
