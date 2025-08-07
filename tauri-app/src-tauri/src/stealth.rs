use tauri::Manager;
use std::time::Duration;

pub fn start_screenshot_monitor(_app: tauri::AppHandle) {
    println!("Moniteur de captures d'écran démarré (version simplifiée)");
    
    // Pour l'instant, on utilise une version simplifiée
    // TODO: Implémenter la détection complète des captures d'écran
    
    // On peut ajouter une commande manuelle pour tester
    println!("Utilisez la commande 'hide_for_capture' pour tester le masquage");
}

#[tauri::command]
pub fn hide_for_capture(app: tauri::AppHandle) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window("Numa") {
        println!("Masquage temporaire de la fenêtre Numa pour capture");
        win.hide()?;
        
        let app_clone = app.clone();
        std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(700));
            if let Some(w) = app_clone.get_webview_window("Numa") {
                println!("Réaffichage de la fenêtre Numa");
                w.show().ok();
            }
        });
    }
    Ok(())
} 