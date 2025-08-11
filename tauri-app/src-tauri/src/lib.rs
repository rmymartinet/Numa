// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod stealth;
mod platform;
mod errors;
mod logging;
mod validation;
mod csp_manager;
mod openai;
mod ns_panel;
#[cfg(test)]
mod tests;

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WebviewWindow, Listener};
use tracing::{info, warn, error, debug};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
// Note: Ces imports ne sont plus nécessaires depuis l'utilisation du module logging

// 🎯 SYSTÈME DOCK/UNDOCK pour fenêtre Input
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "mode")]
pub enum DockState {
    #[serde(rename = "docked")]
    Docked {
        anchor: String, // "below-center", "below-left", etc.
        offset_x: f64,
        offset_y: f64,
    },
    #[serde(rename = "undocked")]
    Undocked,
}

#[derive(Debug)]
pub struct InputWindowState {
    pub dock_state: DockState,
    pub free_positions: HashMap<String, (f64, f64)>, // monitor_id -> (x, y)
    pub is_dragging: bool,
    pub snap_zone_active: bool,
}

impl Default for InputWindowState {
    fn default() -> Self {
        Self {
            dock_state: DockState::Docked {
                anchor: "below-center".to_string(),
                offset_x: 0.0,
                offset_y: 20.0,
            },
            free_positions: HashMap::new(),
            is_dragging: false,
            snap_zone_active: false,
        }
    }
}

pub type InputState = Arc<Mutex<InputWindowState>>;


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

        // 🔧 Fix macOS ghosting: Force window redraw after drag to eliminate ghost images
        #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = window.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, display]; // Force immediate redraw
        }
    }
    Ok(())
}

#[tauri::command]
fn force_hud_redraw(app: AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("hud") {
        // 🔧 Force complete window redraw to eliminate ghost images on macOS
        #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = window.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, display]; // Force immediate redraw
            let _: () = msg_send![win, setViewsNeedDisplay: true]; // Mark all views as needing redraw
        }
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

// Configuration des fenêtres draggables
// 🎯 AMÉLIORATION : Tailles optimisées pour layout côte à côte
const INPUT_WIDTH: f64 = 450.0;   // Réduit pour être côte à côte
const INPUT_HEIGHT: f64 = 120.0;  // Un peu plus haut pour le contenu
const INPUT_INITIAL_X: f64 = 400.0;  
const INPUT_INITIAL_Y: f64 = 490.0;  

const CONTEXT_WIDTH: f64 = 400.0;   // Réduit pour être côte à côte  
const CONTEXT_HEIGHT: f64 = 300.0;  // Ajusté proportionnellement
const CONTEXT_INITIAL_X: f64 = 400.0;  
const CONTEXT_INITIAL_Y: f64 = 490.0;

// === LAYOUT MANAGER AUTOMATIQUE ===

#[derive(Clone, Copy, Debug)]
struct RectI {
    x: i32,
    y: i32,
    w: i32,
    h: i32,
}

impl RectI {
    fn right(&self) -> i32 { self.x + self.w }
    fn bottom(&self) -> i32 { self.y + self.h }
}

fn get_rect(win: &tauri::WebviewWindow) -> tauri::Result<RectI> {
    let p = win.outer_position()?;
    let s = win.outer_size()?;
    Ok(RectI { x: p.x, y: p.y, w: s.width as i32, h: s.height as i32 })
}

fn set_pos(win: &tauri::WebviewWindow, x: i32, y: i32) -> tauri::Result<()> {
    win.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)))
}

fn screen_frame_of(window: &tauri::WebviewWindow) -> tauri::Result<RectI> {
    let mon = window
        .current_monitor()?
        .ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, "No monitor")))?;
    let pos = mon.position();
    let size = mon.size(); // physical
    Ok(RectI { x: pos.x, y: pos.y, w: size.width as i32, h: size.height as i32 })
}

fn arrange_hud_children(app: &tauri::AppHandle) -> tauri::Result<()> {
    let hud = app.get_webview_window("hud")
        .ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "HUD not found")))?;
    let hud_r = get_rect(&hud)?;
    let screen = screen_frame_of(&hud)?;

    let input = app.get_webview_window("input");
    let context = app.get_webview_window("context");

    let mut input_vis = false;
    let mut context_vis = false;

    if let Some(w) = &input { input_vis = w.is_visible().unwrap_or(false); }
    if let Some(w) = &context { context_vis = w.is_visible().unwrap_or(false); }

    // Rien à faire
    if !input_vis && !context_vis { return Ok(()); }

    // Constantes layout
    const GAP: i32 = 12;         // marge entre fenêtres
    const HUD_GAP_Y: i32 = 20;   // marge sous le HUD

    // Slot "ligne" sous HUD
    let line_y = hud_r.bottom() + HUD_GAP_Y;

    // Fonction pour centrer une largeur donnée sous HUD
    let center_x = |width: i32| hud_r.x + (hud_r.w - width) / 2;

    // Récup tailles actuelles (outer_size)
    let input_size = if let Some(w) = &input {
        let s = w.outer_size()?;
        (s.width as i32, s.height as i32)
    } else { (0, 0) };

    let context_size = if let Some(w) = &context {
        let s = w.outer_size()?;
        (s.width as i32, s.height as i32)
    } else { (0, 0) };

    println!("🎯 Layout Manager - HUD: {:?}, Screen: {:?}", hud_r, screen);
    println!("🎯 Layout Manager - Input: visible={}, size={:?}", input_vis, input_size);
    println!("🎯 Layout Manager - Context: visible={}, size={:?}", context_vis, context_size);

    match (input_vis, context_vis) {
        (true, false) => {
            // Uniquement input → centré sous HUD
            if let Some(w) = &input {
                let x = center_x(input_size.0);
                println!("🎯 Layout: Input seul, centré à ({}, {})", x, line_y);
                set_pos(w, x, line_y)?;
            }
        }
        (false, true) => {
            // Uniquement context → centré sous HUD
            if let Some(w) = &context {
                let x = center_x(context_size.0);
                println!("🎯 Layout: Context seul, centré à ({}, {})", x, line_y);
                set_pos(w, x, line_y)?;
            }
        }
        (true, true) => {
            // Les deux visibles → tenter côte à côte
            // 🎯 CORRECTION : Context à gauche (contexte de conversation), Input à droite (zone de saisie)
            let total_w = context_size.0 + GAP + input_size.0;
            let available_w = screen.w - 40; // Marge de sécurité
            
            let fits_horizontally = total_w <= available_w;

            if fits_horizontally {
                // Placement normal côte à côte
                let left_x = center_x(total_w);
                let right_x = left_x + context_size.0 + GAP;
                
                println!("🎯 Layout: Côte à côte - Context à ({}, {}), Input à ({}, {})", left_x, line_y, right_x, line_y);
                if let Some(wc) = &context { set_pos(wc, left_x, line_y)?; }
                if let Some(wi) = &input { set_pos(wi, right_x, line_y)?; }
            } else if available_w > (GAP + 200 + 200) { // Au moins 200px chacune + gap
                // 🎯 NOUVEAU : Layout adaptatif - réduire proportionnellement les tailles
                let scale_factor = (available_w - GAP) as f64 / total_w as f64;
                let new_context_w = (context_size.0 as f64 * scale_factor) as i32;
                let new_input_w = available_w - GAP - new_context_w;
                
                let left_x = center_x(available_w);
                let right_x = left_x + new_context_w + GAP;
                
                println!("🎯 Layout: Côte à côte adaptatif - Context à ({}, {}) [{}px], Input à ({}, {}) [{}px]", 
                         left_x, line_y, new_context_w, right_x, line_y, new_input_w);
                
                // Ajuster les tailles temporairement
                if let Some(wc) = &context { 
                    let _ = wc.set_size(tauri::LogicalSize::new(new_context_w as f64, context_size.1 as f64));
                    set_pos(wc, left_x, line_y)?; 
                }
                if let Some(wi) = &input { 
                    let _ = wi.set_size(tauri::LogicalSize::new(new_input_w as f64, input_size.1 as f64));
                    set_pos(wi, right_x, line_y)?; 
                }
            } else {
                // Fallback : pile (context sous input)
                let input_x = center_x(input_size.0);
                let context_x = center_x(context_size.0);
                let context_y = line_y + input_size.1 + GAP;

                // Si la pile dépasse le bas de l'écran, on remonte au max
                let max_bottom = context_y + context_size.1;
                let overflow = max_bottom - (screen.y + screen.h);
                let adjust = if overflow > 0 { overflow } else { 0 };

                println!("🎯 Layout: Pile verticale - Input à ({}, {}), Context à ({}, {}), adjust={}", 
                         input_x, line_y - adjust, context_x, context_y - adjust, adjust);
                if let Some(wi) = &input { set_pos(wi, input_x, line_y - adjust)?; }
                if let Some(wc) = &context { set_pos(wc, context_x, context_y - adjust)?; }
            }
        }
        (false, false) => {
            // Cas déjà géré plus haut
        }
    }
    Ok(())
}

// === FONCTIONS GÉNÉRIQUES POUR FENÊTRES DRAGGABLES ===

#[derive(Debug, Clone)]
struct DraggableWindowConfig {
    width: f64,
    height: f64,
    initial_x: f64,
    initial_y: f64,
    route: &'static str,
}

impl DraggableWindowConfig {
    fn for_input() -> Self {
        Self {
            width: INPUT_WIDTH,
            height: INPUT_HEIGHT,
            initial_x: INPUT_INITIAL_X,
            initial_y: INPUT_INITIAL_Y,
            route: "#/input",
        }
    }
    
    fn for_context() -> Self {
        Self {
            width: CONTEXT_WIDTH,
            height: CONTEXT_HEIGHT,
            initial_x: CONTEXT_INITIAL_X,
            initial_y: CONTEXT_INITIAL_Y,
            route: "#/context",
        }
    }
}

fn ensure_draggable_window(app: &AppHandle, window_name: &str, config: DraggableWindowConfig) -> tauri::Result<WebviewWindow> {
    if let Some(w) = app.get_webview_window(window_name) {
        return Ok(w);
    }

    let hud = app.get_webview_window("hud").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "HUD window not found")))?;
    let parent_ptr = hud.ns_window()?;

    let window = WebviewWindowBuilder::new(
        app,
        window_name,
        WebviewUrl::External(format!("http://localhost:1420/{}", config.route).parse().unwrap()),
    )
    .parent_raw(parent_ptr)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .resizable(true) // 🎯 NOUVEAU : Toutes les fenêtres draggables sont resizable
    .minimizable(false)
    .closable(false)
    .skip_taskbar(true)
    .inner_size(config.width, config.height)
    .position(config.initial_x, config.initial_y)
    .visible(false)
    .build()?;

    // Style macOS commun
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    unsafe {
        use objc::{class, msg_send, sel, sel_impl};
        use objc::runtime::Object;
        let window_ns: *mut Object = window.ns_window()? as *mut Object;

        let clear: *mut Object = msg_send![class!(NSColor), clearColor];
        let _: () = msg_send![window_ns, setOpaque: false];
        let _: () = msg_send![window_ns, setBackgroundColor: clear];

        const BORDERLESS: u64 = 0;
        let _: () = msg_send![window_ns, setStyleMask: BORDERLESS];
        let _: () = msg_send![window_ns, setHasShadow: false];

        if app.state::<stealth::StealthState>().is_active() {
            let _: () = msg_send![window_ns, setSharingType: 0u64];
        }
    }
    Ok(window)
}

fn show_draggable_window(app: &AppHandle, window_name: &str, config: DraggableWindowConfig) -> tauri::Result<()> {
    ensure_draggable_window(app, window_name, config.clone())?;
    let window = app.get_webview_window(window_name).ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, format!("{} window not found", window_name))))?;

    // Rendre visible
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    unsafe {
        use objc::{msg_send, sel, sel_impl};
        let win = window.ns_window()? as *mut objc::runtime::Object;
        let _: () = msg_send![win, setAlphaValue: 1.0];
        let _: () = msg_send![win, setIgnoresMouseEvents: false];
    }

    apply_current_stealth(app, &window)?;
    window.show()?;

    // 🎯 NOUVEAU : Appliquer le layout automatique après avoir rendu visible
    arrange_hud_children(app)?;
    
    Ok(())
}

fn undock_draggable_window(app: &AppHandle, window_name: &str) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(window_name) {
        if let Some(hud) = app.get_webview_window("hud") {
            println!("🔓 Undocking {} - passage en mode libre", window_name);

            #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
            unsafe {
                use objc::{msg_send, sel, sel_impl};
                let win = window.ns_window()? as *mut objc::runtime::Object;
                let hud_win = hud.ns_window()? as *mut objc::runtime::Object;

                // Détacher du parent
                let _: () = msg_send![hud_win, removeChildWindow: win];
                let _: () = msg_send![win, setParentWindow: std::ptr::null::<objc::runtime::Object>()];
                let _: () = msg_send![win, setMovable: true];
                let _: () = msg_send![win, orderFront: std::ptr::null::<objc::runtime::Object>()];
            }

            // Émettre l'événement
            let _ = app.emit_to(window_name, &format!("{}:undocked", window_name), serde_json::json!({}));
            println!("✅ {} undocked", window_name);
        }
    }
    Ok(())
}

fn dock_draggable_window(app: &AppHandle, window_name: &str, config: DraggableWindowConfig) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(window_name) {
        if let Some(hud) = app.get_webview_window("hud") {
            println!("🔒 Docking {} to HUD", window_name);

            #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
            unsafe {
                use objc::{msg_send, sel, sel_impl};
                let window_win = window.ns_window()? as *mut objc::runtime::Object;
                let hud_win = hud.ns_window()? as *mut objc::runtime::Object;

                let _: () = msg_send![hud_win, addChildWindow: window_win ordered: 1_i32];
                let _: () = msg_send![window_win, setMovable: false];
            }

            // Repositionner avec le layout manager
            let _ = arrange_hud_children(app);

            // Émettre l'événement
            let _ = app.emit_to(window_name, &format!("{}:docked", window_name), serde_json::json!({}));
            println!("✅ {} docked", window_name);
        }
    }
    Ok(())
}

fn start_dragging_window(app: &AppHandle, window_name: &str) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(window_name) {
        println!("🎯 start_{}_dragging appelé", window_name);

        #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = window.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, setMovable: true];
        }

        match window.start_dragging() {
            Ok(()) => println!("✅ start_dragging OK for {}", window_name),
            Err(e) => println!("❌ start_dragging failed for {}: {}", window_name, e),
        }

        #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = window.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, display];
        }
    }
    Ok(())
}

fn check_snap_distance_for_window(app: &AppHandle, window_name: &str) -> tauri::Result<serde_json::Value> {
    if let Some(window) = app.get_webview_window(window_name) {
        if let Some(hud) = app.get_webview_window("hud") {
            let window_pos = window.outer_position()?;
            let window_size = window.outer_size()?;
            let hud_pos = hud.outer_position()?;
            let hud_size = hud.outer_size()?;

            // Rectangle window
            let win_left = window_pos.x as f64;
            let win_right = win_left + window_size.width as f64;
            let win_top = window_pos.y as f64;
            let win_bottom = win_top + window_size.height as f64;

            // Rectangle HUD
            let hud_left = hud_pos.x as f64;
            let hud_right = hud_left + hud_size.width as f64;
            let hud_top = hud_pos.y as f64;
            let hud_bottom = hud_top + hud_size.height as f64;

            // Collision AABB
            let is_in_snap_zone =
                win_right >= hud_left &&
                win_left <= hud_right &&
                win_bottom >= hud_top &&
                win_top <= hud_bottom;

            println!(
                "🎯 {}/HUD overlap: {}=({}, {} -> {}, {}), hud=({}, {} -> {}, {}), should_snap={}",
                window_name, window_name, win_left, win_top, win_right, win_bottom, hud_left, hud_top, hud_right, hud_bottom, is_in_snap_zone
            );

            Ok(serde_json::json!({
                "should_snap": is_in_snap_zone,
                format!("{}_rect", window_name): {
                    "left": win_left,
                    "right": win_right,
                    "top": win_top,
                    "bottom": win_bottom
                },
                "hud_rect": {
                    "left": hud_left,
                    "right": hud_right,
                    "top": hud_top,
                    "bottom": hud_bottom
                }
            }))
        } else {
            Err(tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, "HUD window not found")))
        }
    } else {
        Err(tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("{} window not found", window_name))))
    }
}

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
    let hud = app.get_webview_window("hud").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "HUD window not found")))?;
    let panel = app.get_webview_window("panel").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "Panel window not found")))?;

    // 🎯 SOLUTION LOCALE À L'ÉCRAN : Coordonnées locales + offset manuel

    // 0) Écran du HUD et ses caractéristiques
    let monitor = hud.current_monitor().map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to get monitor: {}", e))))?.ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "No monitor found")))?;
    let scale = monitor.scale_factor(); // permet de convertir entre logique et physique
    let mon_pos_phys = monitor.position(); // Origine physique de l'écran dans le desktop virtuel

    // 1) Position/taille HUD (physique globale → locale physique → logique)
    let hud_pos_phys_global = hud.outer_position().map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to get HUD position: {}", e))))?;
    let hud_pos_phys_local = tauri::PhysicalPosition::new(
        hud_pos_phys_global.x - mon_pos_phys.x,
        hud_pos_phys_global.y - mon_pos_phys.y,
    );
    let hud_pos_log: tauri::LogicalPosition<f64> = hud_pos_phys_local.to_logical(scale);
    let hud_size_log: tauri::LogicalSize<f64> = hud.outer_size().map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to get HUD size: {}", e))))?.to_logical(scale);

    // 2) Taille panel en logique (constante connue)
    let panel_size_log = tauri::LogicalSize::new(PANEL_WIDTH as f64, PANEL_HEIGHT as f64);

    // 3) Offset manuel par écran selon scale factor
    let x_manual_points = match scale {
        s if (s - 2.0).abs() < 0.01 => 0.0,   // Retina (scale=2.0): parfait
        s if (s - 1.0).abs() < 0.01 => -20.0, // HDMI (scale=1.0): décaler vers la gauche
        _ => -10.0, // Autres scales: ajustement moyen
    };

    // 4) Calculs en logique (espace visuel cohérent)
    let gap_y_points = 20.0;
    let target_x_log = hud_pos_log.x + (hud_size_log.width - panel_size_log.width) / 2.0 + x_manual_points;
    let target_y_log = hud_pos_log.y + hud_size_log.height + gap_y_points;

    // 5) Retour en physique avec arrondi + coordonnées globales
    let target_x_phys_global = (target_x_log * scale).round() as i32 + mon_pos_phys.x;
    let target_y_phys_global = (target_y_log * scale).round() as i32 + mon_pos_phys.y;

    let panel_x = target_x_phys_global;
    let panel_y = target_y_phys_global;

    println!("🎯 Scale: {}, HUD logique: ({:.1}, {:.1}), Panel logique: ({:.1}, {:.1})", scale, hud_pos_log.x, hud_pos_log.y, target_x_log, target_y_log);
    println!("🎯 Position finale physique: Panel=({}, {})", panel_x, panel_y);

    // 🔑 CHANGEMENT CRUCIAL : Utiliser PhysicalPosition au lieu de LogicalPosition
    panel.set_position(tauri::PhysicalPosition::new(panel_x, panel_y)).map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to set panel position: {}", e))))?;

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

// 🔧 Commandes de debug pour les positions (comme suggéré par l'IA)
#[tauri::command]
fn debug_get_positions(app: AppHandle) -> Result<String, String> {
    let mut debug_info = String::new();

    if let Some(hud) = app.get_webview_window("hud") {
        match (hud.outer_position(), hud.outer_size()) {
            (Ok(pos), Ok(size)) => {
                debug_info.push_str(&format!("📍 HUD: position=({}, {}), size={}x{}\n", pos.x, pos.y, size.width, size.height));
            }
            _ => debug_info.push_str("❌ Impossible de récupérer les infos HUD\n"),
        }
    }

    if let Some(panel) = app.get_webview_window("panel") {
        match (panel.outer_position(), panel.outer_size()) {
            (Ok(pos), Ok(size)) => {
                debug_info.push_str(&format!("📍 Panel: position=({}, {}), size={}x{}\n", pos.x, pos.y, size.width, size.height));
            }
            _ => debug_info.push_str("❌ Impossible de récupérer les infos Panel\n"),
        }
    } else {
        debug_info.push_str("❌ Panel n'existe pas encore\n");
    }

    Ok(debug_info)
}

#[tauri::command]
fn debug_force_reposition(app: AppHandle) -> Result<String, String> {
    let hud = app.get_webview_window("hud").ok_or("HUD window not found")?;
    let panel = app.get_webview_window("panel").ok_or("Panel window not found")?;

    let scale = hud.scale_factor().map_err(|e| format!("Failed to get scale factor: {}", e))?;

    // Même logique : tout en logique puis reconvertir
    let hud_pos_phys = hud.outer_position().map_err(|e| format!("Failed to get HUD position: {}", e))?;
    let hud_pos_log: tauri::LogicalPosition<f64> = tauri::LogicalPosition::from_physical(hud_pos_phys, scale);

    let hud_size_phys = hud.outer_size().map_err(|e| format!("Failed to get HUD size: {}", e))?;
    let hud_size_log: tauri::LogicalSize<f64> = tauri::LogicalSize::from_physical(hud_size_phys, scale);
    let panel_size_log = tauri::LogicalSize::new(PANEL_WIDTH as f64, PANEL_HEIGHT as f64);

    let gap_y_points = 20.0;
    let gap_x_points = 225.0;

    let target_x_log = hud_pos_log.x + (hud_size_log.width - panel_size_log.width) / 2.0 - gap_x_points;
    let target_y_log = hud_pos_log.y + hud_size_log.height + gap_y_points;

    let target_pos_log = tauri::LogicalPosition::new(target_x_log, target_y_log);
    let target_pos_phys = target_pos_log.to_physical::<i32>(scale);

    panel.set_position(tauri::PhysicalPosition::new(target_pos_phys.x, target_pos_phys.y))
        .map_err(|e| format!("Failed to set panel position: {}", e))?;

    Ok(format!("🔧 Panel repositionné à ({}, {}) [LOGIQUE→PHYSIQUE] Scale: {:.1}", target_pos_phys.x, target_pos_phys.y, scale))
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
    let hud = app.get_webview_window("hud").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "HUD window not found")))?;
    let response = app.get_webview_window("response").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "Response window not found")))?;

    // 🎯 POSITIONNEMENT DYNAMIQUE ResponsePage : Même logique que le panel

    // 0) Écran du HUD et ses caractéristiques
    let monitor = hud.current_monitor().map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to get monitor: {}", e))))?.ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "No monitor found")))?;
    let scale = monitor.scale_factor();
    let mon_pos_phys = monitor.position(); // Origine physique de l'écran dans le desktop virtuel

    // 1) Position/taille HUD (physique globale → locale physique → logique)
    let hud_pos_phys_global = hud.outer_position().map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to get HUD position: {}", e))))?;
    let hud_pos_phys_local = tauri::PhysicalPosition::new(
        hud_pos_phys_global.x - mon_pos_phys.x,
        hud_pos_phys_global.y - mon_pos_phys.y,
    );
    let hud_pos_log: tauri::LogicalPosition<f64> = hud_pos_phys_local.to_logical(scale);
    let hud_size_log: tauri::LogicalSize<f64> = hud.outer_size().map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to get HUD size: {}", e))))?.to_logical(scale);

    // 2) Taille response en logique (constante connue)
    let response_size_log = tauri::LogicalSize::new(RESPONSE_WIDTH as f64, RESPONSE_HEIGHT as f64);

    // 3) Offset manuel par écran selon scale factor (même logique que panel)
    let x_manual_points = match scale {
        s if (s - 2.0).abs() < 0.01 => 0.0,   // Retina (scale=2.0): parfait
        s if (s - 1.0).abs() < 0.01 => -20.0, // HDMI (scale=1.0): décaler vers la gauche
        _ => -10.0, // Autres scales: ajustement moyen
    };

    // 4) Calculs en logique (espace visuel cohérent)
    let gap_y_points = 20.0;
    let target_x_log = hud_pos_log.x + (hud_size_log.width - response_size_log.width) / 2.0 + x_manual_points;
    let target_y_log = hud_pos_log.y + hud_size_log.height + gap_y_points;

    // 5) Retour en physique avec arrondi + coordonnées globales
    let target_x_phys_global = (target_x_log * scale).round() as i32 + mon_pos_phys.x;
    let target_y_phys_global = (target_y_log * scale).round() as i32 + mon_pos_phys.y;

    let response_x = target_x_phys_global;
    let response_y = target_y_phys_global;

    println!("🎯 ResponsePage Scale: {}, HUD logique: ({:.1}, {:.1}), Response logique: ({:.1}, {:.1})", scale, hud_pos_log.x, hud_pos_log.y, target_x_log, target_y_log);
    println!("🎯 ResponsePage Position finale physique: Response=({}, {})", response_x, response_y);

    // 🔑 CHANGEMENT CRUCIAL : Utiliser PhysicalPosition au lieu de LogicalPosition
    response.set_position(tauri::PhysicalPosition::new(response_x, response_y)).map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to set response position: {}", e))))?;

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

/// Affiche ResponsePage positionnée en dessous de l'InputPage
fn response_show_below_input(app: &AppHandle) -> tauri::Result<()> {
    ensure_response(app)?;
    let hud = app.get_webview_window("hud").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "HUD window not found")))?;
    let response = app.get_webview_window("response").ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "Response window not found")))?;

    // 🎯 POSITIONNEMENT EN DESSOUS DE L'INPUT : Même logique mais avec gap additionnel

    // 0) Écran du HUD et ses caractéristiques
    let monitor = hud.current_monitor().map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to get monitor: {}", e))))?.ok_or_else(|| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::NotFound, "No monitor found")))?;
    let scale = monitor.scale_factor();
    let mon_pos_phys = monitor.position(); // Origine physique de l'écran dans le desktop virtuel

    // 1) Position/taille HUD (physique globale → locale physique → logique)
    let hud_pos_phys_global = hud.outer_position().map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to get HUD position: {}", e))))?;
    let hud_pos_phys_local = tauri::PhysicalPosition::new(
        hud_pos_phys_global.x - mon_pos_phys.x,
        hud_pos_phys_global.y - mon_pos_phys.y,
    );
    let hud_pos_log: tauri::LogicalPosition<f64> = hud_pos_phys_local.to_logical(scale);
    let hud_size_log: tauri::LogicalSize<f64> = hud.outer_size().map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to get HUD size: {}", e))))?.to_logical(scale);

    // 2) Tailles en logique
    let response_size_log = tauri::LogicalSize::new(RESPONSE_WIDTH as f64, RESPONSE_HEIGHT as f64);
    let input_size_log = tauri::LogicalSize::new(INPUT_WIDTH as f64, INPUT_HEIGHT as f64);

    // 3) Offset manuel par écran selon scale factor (même logique que panel)
    let x_manual_points = match scale {
        s if (s - 2.0).abs() < 0.01 => 0.0,   // Retina (scale=2.0): parfait
        s if (s - 1.0).abs() < 0.01 => -20.0, // HDMI (scale=1.0): décaler vers la gauche
        _ => -10.0, // Autres scales: ajustement moyen
    };

    // 4) Calculs en logique : Position EN DESSOUS de l'InputPage
    let gap_y_points = 20.0;
    let input_gap = 10.0; // Gap entre InputPage et ResponsePage

    let target_x_log = hud_pos_log.x + (hud_size_log.width - response_size_log.width) / 2.0 + x_manual_points;
    let target_y_log = hud_pos_log.y + hud_size_log.height + gap_y_points + input_size_log.height + input_gap;

    // 5) Retour en physique avec arrondi + coordonnées globales
    let target_x_phys_global = (target_x_log * scale).round() as i32 + mon_pos_phys.x;
    let target_y_phys_global = (target_y_log * scale).round() as i32 + mon_pos_phys.y;

    let response_x = target_x_phys_global;
    let response_y = target_y_phys_global;

    println!("🎯 ResponsePage (en dessous InputPage) Scale: {}, HUD logique: ({:.1}, {:.1}), Response logique: ({:.1}, {:.1})", scale, hud_pos_log.x, hud_pos_log.y, target_x_log, target_y_log);
    println!("🎯 ResponsePage Position finale physique: Response=({}, {})", response_x, response_y);

    // 🔑 CHANGEMENT CRUCIAL : Utiliser PhysicalPosition au lieu de LogicalPosition
    response.set_position(tauri::PhysicalPosition::new(response_x, response_y)).map_err(|e| tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to set response position: {}", e))))?;

    // Rendre visible
    #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
    unsafe {
        use objc::{msg_send, sel, sel_impl};
        let win = response.ns_window()? as *mut objc::runtime::Object;
        let _: () = msg_send![win, setAlphaValue: 1.0];
        let _: () = msg_send![win, setIgnoresMouseEvents: false];
    }

    // Appliquer l'état furtif actuel
    apply_current_stealth(app, &response)?;

    response.show()?;
    Ok(())
}

#[tauri::command]
fn start_chat(app: AppHandle, message: String) -> tauri::Result<()> {
    println!("🚀 start_chat called with message: {}", message);

    // 🎯 NOUVEAU : Ne plus afficher ResponsePage, l'InputPage gère tout maintenant
    println!("🚀 Envoi direct vers InputPage (pas de ResponsePage)");

    // 🎯 NOUVEAU : Envoi direct vers InputPage (pas besoin d'attendre response:ready)
    println!("✅ Émission chat:start vers InputPage");
    let _ = app.emit_to(
        "input",
        "chat:start",
        serde_json::json!({ "message": message.clone() }),
    );

    // 🎯 NOUVEAU : Chat OpenAI en async, et on **cible** la fenêtre "input"
    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        match openai::chat_with_openai(openai::ChatRequest {
            message: message.clone(),
            conversation_id: None,
            context: None,
        }).await {
            Ok(chat_response) => {
                println!("🤖 OpenAI response: {}", chat_response.message);
                println!("🚀 Emitting chat:response to input window");
                let _ = app_clone.emit_to("input", "chat:response", serde_json::json!({
                    "message": chat_response.message,
                    "conversation_id": chat_response.conversation_id,
                    "tokens_used": chat_response.tokens_used,
                    "model": chat_response.model,
                }));
                println!("✅ chat:response emitted");
            }
            Err(e) => {
                println!("❌ OpenAI error: {}", e);
                let _ = app_clone.emit_to("input", "chat:error", serde_json::json!({
                    "error": e.to_string(),
                }));
            }
        }
    });

    Ok(())
}

// === INPUT WINDOW MANAGEMENT ===

#[tauri::command]
fn input_show(app: AppHandle) -> tauri::Result<()> {
    show_draggable_window(&app, "input", DraggableWindowConfig::for_input())
}

#[tauri::command]
fn input_hide(app: AppHandle) -> tauri::Result<()> {
    if let Some(input) = app.get_webview_window("input") {
        #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = input.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, setAlphaValue: 0.0];
            let _: () = msg_send![win, setIgnoresMouseEvents: true];
        }
        apply_current_stealth(&app, &input)?;
    }
    Ok(())
}

#[tauri::command]
fn input_resize(app: AppHandle, width: f64, height: f64) -> tauri::Result<()> {
    if let Some(input) = app.get_webview_window("input") {
        // 🎯 AGRANDISSEMENT VERS LE BAS : Garder la position Y fixe
        let current_pos = input.outer_position()?;
        let new_size = tauri::LogicalSize::new(width, height);

        // Redimensionner la fenêtre
        input.set_size(new_size)?;

        // Repositionner pour garder le haut fixe (la fenêtre ne doit que s'étendre vers le bas)
        input.set_position(current_pos)?;

        // Réorganiser le layout si la taille a changé
        let _ = arrange_hud_children(&app);

        // Force redraw sur macOS pour éviter les artefacts visuels
        #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = input.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, display];
        }
    }
    Ok(())
}

#[tauri::command]
fn input_undock(app: AppHandle) -> tauri::Result<()> {
    undock_draggable_window(&app, "input")
}

#[tauri::command]
fn get_hud_position_and_size(app: AppHandle) -> tauri::Result<serde_json::Value> {
    if let Some(hud) = app.get_webview_window("hud") {
        let position = hud.outer_position()?;
        let size = hud.outer_size()?;

        Ok(serde_json::json!({
            "x": position.x,
            "y": position.y,
            "width": size.width,
            "height": size.height
        }))
    } else {
        Err(tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, "HUD window not found")))
    }
}

#[tauri::command]
fn check_snap_distance(app: AppHandle) -> tauri::Result<serde_json::Value> {
    if let Some(hud) = app.get_webview_window("hud") {
        let hud_pos = hud.outer_position()?;
        let hud_size = hud.outer_size()?;

        // Rectangle HUD
        let hud_left = hud_pos.x as f64;
        let hud_right = hud_left + hud_size.width as f64;
        let hud_top = hud_pos.y as f64;
        let hud_bottom = hud_top + hud_size.height as f64;

        // Try input window first
        if let Some(input) = app.get_webview_window("input") {
            if input.is_visible()? {
                let input_pos = input.outer_position()?;
                let input_size = input.outer_size()?;

                // Rectangle input
                let in_left = input_pos.x as f64;
                let in_right = in_left + input_size.width as f64;
                let in_top = input_pos.y as f64;
                let in_bottom = in_top + input_size.height as f64;

                // Collision AABB
                let is_in_snap_zone =
                    in_right >= hud_left &&
                    in_left <= hud_right &&
                    in_bottom >= hud_top &&
                    in_top <= hud_bottom;

                println!("🎯 Input/HUD overlap: input=({}, {} -> {}, {}), hud=({}, {} -> {}, {}), should_snap={}",
                    in_left, in_top, in_right, in_bottom, hud_left, hud_top, hud_right, hud_bottom, is_in_snap_zone);

                return Ok(serde_json::json!({
                    "should_snap": is_in_snap_zone,
                    "window_type": "input",
                    "input_rect": {
                        "left": in_left,
                        "right": in_right,
                        "top": in_top,
                        "bottom": in_bottom
                    },
                    "hud_rect": {
                        "left": hud_left,
                        "right": hud_right,
                        "top": hud_top,
                        "bottom": hud_bottom
                    }
                }));
            }
        }

        // Try context window
        if let Some(context) = app.get_webview_window("context") {
            if context.is_visible()? {
                let context_pos = context.outer_position()?;
                let context_size = context.outer_size()?;

                // Rectangle context
                let ctx_left = context_pos.x as f64;
                let ctx_right = ctx_left + context_size.width as f64;
                let ctx_top = context_pos.y as f64;
                let ctx_bottom = ctx_top + context_size.height as f64;

                // Collision AABB
                let is_in_snap_zone =
                    ctx_right >= hud_left &&
                    ctx_left <= hud_right &&
                    ctx_bottom >= hud_top &&
                    ctx_top <= hud_bottom;

                println!("🎯 Context/HUD overlap: context=({}, {} -> {}, {}), hud=({}, {} -> {}, {}), should_snap={}",
                    ctx_left, ctx_top, ctx_right, ctx_bottom, hud_left, hud_top, hud_right, hud_bottom, is_in_snap_zone);

                return Ok(serde_json::json!({
                    "should_snap": is_in_snap_zone,
                    "window_type": "context",
                    "context_rect": {
                        "left": ctx_left,
                        "right": ctx_right,
                        "top": ctx_top,
                        "bottom": ctx_bottom
                    },
                    "hud_rect": {
                        "left": hud_left,
                        "right": hud_right,
                        "top": hud_top,
                        "bottom": hud_bottom
                    }
                }));
            }
        }

        Err(tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, "No draggable window found")))
    } else {
        Err(tauri::Error::from(std::io::Error::new(std::io::ErrorKind::Other, "HUD window not found")))
    }
}

#[tauri::command]
fn input_dock(app: AppHandle) -> tauri::Result<()> {
    dock_draggable_window(&app, "input", DraggableWindowConfig::for_input())
}

#[tauri::command]
fn start_input_dragging(app: AppHandle) -> tauri::Result<()> {
    start_dragging_window(&app, "input")
}


// ======================== CONTEXT PAGE COMMANDS =============================

#[tauri::command]
fn context_show(app: AppHandle) -> tauri::Result<()> {
    show_draggable_window(&app, "context", DraggableWindowConfig::for_context())
}

#[tauri::command]
fn context_hide(app: AppHandle) -> tauri::Result<()> {
    if let Some(context) = app.get_webview_window("context") {
        context.hide()?;
    }
    Ok(())
}

#[tauri::command]
fn context_undock(app: AppHandle) -> tauri::Result<()> {
    undock_draggable_window(&app, "context")
}

#[tauri::command]
fn context_dock(app: AppHandle) -> tauri::Result<()> {
    dock_draggable_window(&app, "context", DraggableWindowConfig::for_context())
}

#[tauri::command]
fn check_context_snap_distance(app: AppHandle) -> tauri::Result<serde_json::Value> {
    check_snap_distance_for_window(&app, "context")
}

#[tauri::command]
fn start_context_dragging(app: AppHandle) -> tauri::Result<()> {
    start_dragging_window(&app, "context")
}

#[tauri::command]
fn context_resize(app: AppHandle, width: f64, height: f64) -> tauri::Result<()> {
    if let Some(context) = app.get_webview_window("context") {
        let current_pos = context.outer_position()?;
        let new_size = tauri::LogicalSize::new(width, height);

        // Redimensionner la fenêtre
        context.set_size(new_size)?;
        context.set_position(current_pos)?;

        // Réorganiser le layout si la taille a changé
        let _ = arrange_hud_children(&app);

        // Force redraw sur macOS
        #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let win = context.ns_window()? as *mut objc::runtime::Object;
            let _: () = msg_send![win, display];
        }
    }
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
        .manage(ns_panel::State::default())
        .invoke_handler(tauri::generate_handler![
            capture_and_analyze,
            capture_screen,
            get_image_as_base64,
            close_all_windows,
            start_window_dragging,
            force_hud_redraw,
            resize_window,
            panel_show,
            panel_hide,
            debug_get_positions,
            debug_force_reposition,
            response_show,
            response_hide,
            test_response_window,
            input_show,
            input_hide,
            input_resize,
            input_undock,
            input_dock,
            get_hud_position_and_size,
            check_snap_distance,
            start_input_dragging,
            context_show,
            context_hide,
            context_undock,
            context_dock,
            check_context_snap_distance,
            start_context_dragging,
            context_resize,
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
            openai::get_chat_config,
            ns_panel::init_ns_panel,
            ns_panel::show_app,
            ns_panel::hide_app
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
                
                // 🎛️ Initialize NSPanel with MoveToActiveSpace functionality
                #[cfg(all(target_os = "macos", feature = "stealth_macos"))]
                {
                    info!("🎛️ Initializing NSPanel for cross-space functionality...");
                    ns_panel::init_ns_panel(app.handle().clone(), hud_win, "cmd+space");
                    info!("✅ NSPanel initialized - window can now move across macOS spaces");
                }
                
                #[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
                {
                    info!("🎛️ NSPanel not available on this platform");
                }
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
