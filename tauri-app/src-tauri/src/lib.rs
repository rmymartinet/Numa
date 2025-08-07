// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod stealth;

use tauri::{AppHandle, Manager};

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
async fn capture_screen() -> Result<String, String> {
    // Capturer l'écran
    let result = capture_screen_internal();
    result
}

#[tauri::command]
fn capture_and_analyze() -> String {
    println!("Raccourci clavier global activé ! Capture et analyse en cours...");
    
    // Capturer l'écran
    match capture_screen_internal() {
        Ok(image_path) => {
            println!("Capture réussie: {}", image_path);
            // Ici on pourrait ajouter l'analyse automatique
            format!("Capture réussie: {}", image_path)
        }
        Err(e) => {
            println!("Erreur de capture: {}", e);
            format!("Erreur de capture: {}", e)
        }
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

#[tauri::command]
fn panel_show(app: AppHandle, passthrough: bool) -> tauri::Result<()> {
    let Some(hud) = app.get_webview_window("hud") else { return Ok(()); };
    let Some(panel) = app.get_webview_window("panel") else { return Ok(()); };

    // place le panel centré par rapport au HUD
    if let Ok(pos) = hud.outer_position() {
        // HUD: ~500px (réel), Panel: 1200x800
        // Centrer horizontalement: pos.x + (500-1200)/2 = pos.x - 350
        // Positionner verticalement: pos.y + 64 (juste en dessous du HUD)
        let panel_x = pos.x - 350; // Centré horizontalement
        let panel_y = pos.y + 64;  // Juste en dessous du HUD
        
        panel.set_position(tauri::LogicalPosition::new(panel_x, panel_y))?;
    }
    panel.set_ignore_cursor_events(passthrough)?;
    panel.show()?;
    Ok(())
}

#[tauri::command]
fn panel_hide(app: AppHandle) -> tauri::Result<()> {
    if let Some(panel) = app.get_webview_window("panel") {
        panel.hide()?;
    }
    Ok(())
}





#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![capture_and_analyze, capture_screen, get_image_as_base64, stealth::hide_for_capture, close_all_windows, start_window_dragging, resize_window, panel_show, panel_hide])

        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                println!("Fermeture de l'application Numa");
                // Fermer complètement l'application
                window.app_handle().exit(0);
            }
        })
        .setup(|app| {
            println!("Application Numa démarrée - Interface unifiée");
            
            // Démarrer le moniteur de captures d'écran
            stealth::start_screenshot_monitor(app.handle().clone());
            println!("Moniteur de captures d'écran activé");
            
            // La fenêtre HUD est déjà créée par la configuration Tauri
            println!("Fenêtre HUD principale active");
            
            // Forcer le HUD au premier plan
            if let Some(hud_win) = app.get_webview_window("hud") {
                hud_win.set_focus().ok();
                println!("HUD mis au premier plan");
            }
            
            println!("Setup terminé - Interface unifiée activée");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
