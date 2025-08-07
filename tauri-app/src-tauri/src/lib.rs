// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// use tauri::Emitter;  // Temporairement désactivé

mod stealth;

use tauri::{AppHandle, Manager};
use tauri::webview::WebviewWindowBuilder;
use tauri_utils::config::WebviewUrl;
use url::Url;

fn ensure_overlay(app: &AppHandle) -> tauri::Result<tauri::webview::WebviewWindow> {
    if let Some(win) = app.get_webview_window("overlay") {
        return Ok(win);
    }
    let win = WebviewWindowBuilder::new(
        app,
        "overlay",
        WebviewUrl::External(Url::parse("http://localhost:1420/overlay").unwrap())
    )
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .visible(false)
    .build()?;

    win.set_ignore_cursor_events(true)?;

    // Temporairement désactivé pour debug
    // ▶️ APPEL CRITIQUE : rendre la fenêtre invisible aux captures
    /*
    #[cfg(target_os = "macos")]
    {
        use objc::{msg_send, sel, sel_impl};
        let win_clone = win.clone();
        tauri::async_runtime::spawn(async move {
            unsafe {
                let ns_win = win_clone.ns_window().unwrap() as *mut objc::runtime::Object;
                let _: () = msg_send![ns_win, setSharingType: 0u64]; // NSWindowSharingNone
            }
            println!("SharingType set to None");
        });
    }
    #[cfg(target_os = "windows")]
    unsafe {
        use windows::Win32::UI::WindowsAndMessaging::{
            SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE,
        };
        SetWindowDisplayAffinity(win.hwnd().unwrap() as _, WDA_EXCLUDEFROMCAPTURE);
    }
    */

    Ok(win)
}

fn create_mainhud_window(app: &AppHandle) -> tauri::Result<tauri::webview::WebviewWindow> {
    if let Some(win) = app.get_webview_window("mainhud") {
        return Ok(win);
    }
    
    match Url::parse("http://localhost:1420/mainhud") {
        Ok(url) => {
            let win = WebviewWindowBuilder::new(
                app,
                "mainhud",
                WebviewUrl::External(url)
            )
            .transparent(false)  // Changé à false pour être interactif
            .decorations(true)   // Changé à true pour avoir les contrôles
            .always_on_top(true)
            .skip_taskbar(false)
            .visible(true)
            .title("MainHUD")
            .center()
            .build()?;

            // Rendre déplaçable et interactif
            win.set_ignore_cursor_events(false)?;
            win.set_focus()?;  // Mettre au premier plan

            Ok(win)
        },
        Err(e) => {
            println!("Erreur URL MainHUD: {}", e);
            Err(tauri::Error::from(std::io::Error::new(std::io::ErrorKind::InvalidInput, format!("Erreur URL MainHUD: {}", e))))
        }
    }
}

fn ensure_hud(app: &AppHandle) -> tauri::Result<tauri::webview::WebviewWindow> {
    if let Some(win) = app.get_webview_window("hud") {
        return Ok(win);
    }
    
    // Vérifier que le serveur est prêt
    match Url::parse("http://localhost:1420/hud") {
        Ok(url) => {
                let win = WebviewWindowBuilder::new(
        app,
        "hud",
        WebviewUrl::External(url)
    )
    .transparent(false)
    .decorations(true)
    .always_on_top(false)
    .skip_taskbar(false)
    .visible(true)
    .title("HUD Debug")
    .center()
    .build()?;

            // Rendre déplaçable (pas click-through)
            win.set_ignore_cursor_events(false)?;

            // Temporairement désactivé pour debug
            // ▶️ APPEL CRITIQUE : rendre la fenêtre invisible aux captures
            /*
            #[cfg(target_os = "macos")]
            {
                use objc::{msg_send, sel, sel_impl};
                let win_clone = win.clone();
                tauri::async_runtime::spawn(async move {
                    unsafe {
                        let ns_win = win_clone.ns_window().unwrap() as *mut objc::runtime::Object;
                        let _: () = msg_send![ns_win, setSharingType: 0u64]; // NSWindowSharingNone
                    }
                    println!("HUD SharingType set to None");
                });
            }
            #[cfg(target_os = "windows")]
            unsafe {
                use windows::Win32::UI::WindowsAndMessaging::{
                    SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE,
                };
                SetWindowDisplayAffinity(win.hwnd().unwrap() as _, WDA_EXCLUDEFROMCAPTURE);
            }
            */

            Ok(win)
        },
        Err(e) => {
            println!("Erreur URL HUD: {}", e);
            Err(tauri::Error::from(std::io::Error::new(std::io::ErrorKind::InvalidInput, format!("Erreur URL HUD: {}", e))))
        }
    }
}

fn capture_screen_internal() -> Result<String, String> {
    use std::fs;
    use std::env;
    
    // Capturer l'écran principal
    let screens = screenshots::Screen::all().map_err(|e| e.to_string())?;
    let screen = screens.first().ok_or("Aucun écran trouvé")?;
    
    // Capturer l'écran complet
    let image = screen.capture().map_err(|e| e.to_string())?;
    
    // TODO: Masquer la zone de l'overlay si elle est visible
    // Pour l'instant, on capture tout l'écran
    
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
    // Masquer l'overlay avant la capture
    // TODO: Utiliser l'API correcte pour masquer la fenêtre overlay
    
    // Capturer l'écran (sans l'overlay)
    let result = capture_screen_internal();
    
    // Remontrer l'overlay après la capture
    // TODO: Remontrer la fenêtre overlay
    
    result
}

#[tauri::command]
async fn show_overlay() -> Result<(), String> {
    // TODO: Implémenter l'affichage de la fenêtre overlay
    // L'API Tauri v2 a changé, on va utiliser une approche différente
    println!("Commande show_overlay appelée");
    Ok(())
}

#[tauri::command]
async fn hide_overlay() -> Result<(), String> {
    // TODO: Implémenter le masquage de la fenêtre overlay
    println!("Commande hide_overlay appelée");
    Ok(())
}

#[tauri::command]
async fn send_to_overlay(_message: String) -> Result<(), String> {
    // Envoyer un message à l'overlay
    // L'overlay écoutera cet événement
    println!("Message envoyé à l'overlay");
    Ok(())
}

#[tauri::command]
fn toggle_overlay(app: AppHandle, show: bool) -> tauri::Result<()> {
    let win = ensure_overlay(&app)?;
    if show { win.show()? } else { win.hide()? }
    Ok(())
}

#[tauri::command]
fn set_overlay_size(app: AppHandle, width: u32, height: u32) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window("overlay") {
        win.set_size(tauri::Size::Logical(tauri::LogicalSize { width: width.into(), height: height.into() }))?;
    }
    Ok(())
}

#[tauri::command]
fn move_overlay(app: AppHandle, dx: i32, dy: i32) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window("overlay") {
        let pos = win.outer_position()?;
        win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: pos.x + dx, y: pos.y + dy }))?;
    }
    Ok(())
}

#[tauri::command]
fn toggle_numa_overlay_mode(app: AppHandle, enable: bool) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window("Numa") {
        // NE PAS activer le click-through sur la fenêtre Numa elle-même
        // win.set_ignore_cursor_events(enable)?; // ❌ Supprimé
        
        // Activer/désactiver toujours au-dessus
        win.set_always_on_top(enable)?;
        
        // Protection contre les captures d'écran (macOS)
        #[cfg(target_os = "macos")]
        if enable {
            unsafe {
                use objc::{msg_send, sel, sel_impl};
                let ns_win = win.ns_window().unwrap() as *mut objc::runtime::Object;
                let _: () = msg_send![ns_win, setSharingType: 0u64]; // NSWindowSharingNone
            }
        }
        
        println!("Mode overlay {} pour la fenêtre Numa (furtif mais interactif)", if enable { "activé" } else { "désactivé" });
    }
    Ok(())
}

#[tauri::command]
fn overlay_passthrough(app: AppHandle, enable: bool) -> tauri::Result<()> {
    if let Some(w) = app.get_webview_window("overlay") {
        w.set_ignore_cursor_events(enable)?;
    }
    Ok(())
}

#[tauri::command]
fn show_main_window(app: AppHandle) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window("Numa") {
        win.show()?;
        win.set_focus()?;
    }
    Ok(())
}

#[tauri::command]
fn close_all_windows(app: AppHandle) -> tauri::Result<()> {
    app.exit(0);
    Ok(())
}

#[tauri::command]
fn show_numa_window(app: AppHandle) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window("Numa") {
        win.show()?;
        win.set_focus()?;
        println!("Fenêtre Numa affichée");
    } else {
        println!("Fenêtre Numa non trouvée");
    }
    Ok(())
}

#[tauri::command]
fn move_mainhud_with_numa(app: AppHandle, x: i32, y: i32) -> tauri::Result<()> {
    use tauri::LogicalPosition;
    
    // Déplacer MainHUD
    if let Some(mainhud) = app.get_webview_window("mainhud") {
        let position = LogicalPosition::new(x as f64, y as f64);
        mainhud.set_position(position)?;
    }
    
    // Déplacer Numa en dessous (avec un offset)
    if let Some(numa) = app.get_webview_window("Numa") {
        let numa_y = y + 320; // 300px (hauteur MainHUD) + 20px d'espace
        let position = LogicalPosition::new(x as f64, numa_y as f64);
        numa.set_position(position)?;
    }
    
    Ok(())
}

#[tauri::command]
fn toggle_numa_visibility(app: AppHandle) -> tauri::Result<()> {
    if let Some(numa) = app.get_webview_window("Numa") {
        let is_visible = numa.is_visible()?;
        if is_visible {
            numa.hide()?;
            println!("Numa cachée");
        } else {
            numa.show()?;
            numa.set_focus()?;
            println!("Numa affichée");
        }
    }
    Ok(())
}

#[tauri::command]
fn focus_mainhud(app: AppHandle) -> tauri::Result<()> {
    if let Some(mainhud) = app.get_webview_window("mainhud") {
        mainhud.set_focus()?;
        println!("MainHUD mis au premier plan");
    }
    Ok(())
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // .plugin(tauri_plugin_global_shortcut::init())  // Temporairement désactivé
        .invoke_handler(tauri::generate_handler![capture_and_analyze, capture_screen, get_image_as_base64, show_overlay, hide_overlay, send_to_overlay, toggle_overlay, set_overlay_size, move_overlay, toggle_numa_overlay_mode, stealth::hide_for_capture, overlay_passthrough, show_main_window, close_all_windows, show_numa_window, move_mainhud_with_numa, toggle_numa_visibility, focus_mainhud])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                println!("Tentative de fermeture de la fenêtre: {}", window.label());
                // Minimiser au lieu de fermer - comportement recommandé
                window.minimize().ok();
                api.prevent_close();
                println!("Fenêtre minimisée: {}", window.label());
            }
        })
                            .setup(|app| {
                        println!("Application démarrée - Configuration du raccourci global...");
                        
                        // Démarrer le moniteur de captures d'écran
                        stealth::start_screenshot_monitor(app.handle().clone());
                        println!("Moniteur de captures d'écran activé");
                        
                        // Créer le HUD après un délai pour laisser le serveur démarrer
                        let app_clone = app.handle().clone();
                        tauri::async_runtime::spawn(async move {
                            // Attendre que le serveur soit prêt
                            std::thread::sleep(std::time::Duration::from_millis(3000));
                            
                            // Créer le HUD
                            println!("Tentative de création du HUD...");
                            match ensure_hud(&app_clone) {
                                Ok(_) => println!("HUD créé avec succès"),
                                Err(e) => println!("Erreur création HUD: {}", e),
                            }
                            
                                                    // Créer le MainHUD séparément (petite fenêtre en haut)
                        println!("Création du MainHUD...");
                        match create_mainhud_window(&app_clone) {
                            Ok(_) => println!("MainHUD créé avec succès"),
                            Err(e) => println!("Erreur création MainHUD: {}", e),
                        }
                            
                            // Forcer le HUD au premier plan aussi
                            if let Some(hud_win) = app_clone.get_webview_window("hud") {
                                hud_win.set_focus().ok();
                                println!("HUD mis au premier plan");
                            }
                            
                            println!("Setup terminé - Application devrait rester ouverte");
                            println!("Vérification des fenêtres actives...");
                            
                            // Lister toutes les fenêtres pour debug
                            for (label, window) in app_clone.webview_windows() {
                                println!("Fenêtre trouvée: {} - Visible: {}", label, window.is_visible().unwrap_or(false));
                            }
                            
                            println!("Setup terminé - Application devrait rester ouverte");
                            println!("Les fenêtres sont maintenant gérées par Tauri");
                        });
                        
                        // Pour l'instant, on désactive le raccourci global pour éviter les erreurs
                        // TODO: Implémenter le raccourci global une fois l'API stabilisée
                        println!("Raccourci global temporairement désactivé - API en cours de stabilisation");
                        Ok(())
                    })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
