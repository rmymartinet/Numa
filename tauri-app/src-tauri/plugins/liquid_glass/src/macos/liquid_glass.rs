use tauri::{Runtime, Window};
use crate::LiquidGlassConfig;
use std::sync::Mutex;
use std::collections::HashMap;
use cocoa::base::id;
use cocoa::foundation::{NSRect, NSPoint, NSSize};
use objc::runtime::Class;
use objc::{msg_send, sel, sel_impl};
use std::sync::LazyLock;

// Store visual effect views per window
static VISUAL_EFFECT_VIEWS: LazyLock<Mutex<HashMap<String, usize>>> = LazyLock::new(|| {
    Mutex::new(HashMap::new())
});

pub fn start_liquid_glass_impl<R: Runtime>(
    window: Window<R>,
    config: LiquidGlassConfig,
) -> Result<(), String> {
    unsafe {
        let window_id = window.label().to_string();

        // Get the NSWindow from Tauri window
        let ns_window = get_ns_window(&window)?;
        let content_view = get_content_view(ns_window)?;

        // Create NSVisualEffectView
        let visual_effect_view = create_visual_effect_view(&config.material)?;

        // Configure the visual effect view
        configure_visual_effect_view(visual_effect_view)?;

        // Set frame
        let frame = NSRect::new(
            NSPoint::new(config.x, config.y),
            NSSize::new(config.width, config.height)
        );
        let _: () = msg_send![visual_effect_view, setFrame: frame];

        // Add to content view
        let _: () = msg_send![content_view, addSubview: visual_effect_view];

        // Store reference
        let mut views = VISUAL_EFFECT_VIEWS.lock().map_err(|_| "Failed to lock views")?;
        views.insert(window_id, visual_effect_view as usize);

        Ok(())
    }
}

pub fn update_liquid_glass_frame_impl<R: Runtime>(
    window: Window<R>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    unsafe {
        let window_id = window.label().to_string();

        let views = VISUAL_EFFECT_VIEWS.lock().map_err(|_| "Failed to lock views")?;
        if let Some(&view_ptr) = views.get(&window_id) {
            let visual_effect_view = view_ptr as id;
            let frame = NSRect::new(
                NSPoint::new(x, y),
                NSSize::new(width, height)
            );
            let _: () = msg_send![visual_effect_view, setFrame: frame];
            Ok(())
        } else {
            Err("No visual effect view found for window".to_string())
        }
    }
}

pub fn stop_liquid_glass_impl<R: Runtime>(window: Window<R>) -> Result<(), String> {
    unsafe {
        let window_id = window.label().to_string();

        let mut views = VISUAL_EFFECT_VIEWS.lock().map_err(|_| "Failed to lock views")?;
        if let Some(view_ptr) = views.remove(&window_id) {
            let visual_effect_view = view_ptr as id;
            let _: () = msg_send![visual_effect_view, removeFromSuperview];
            let _: () = msg_send![visual_effect_view, release];
            Ok(())
        } else {
            Err("No visual effect view found for window".to_string())
        }
    }
}

unsafe fn get_ns_window<R: Runtime>(window: &Window<R>) -> Result<id, String> {
    // This is a simplified version - in a real implementation,
    // you'd need to get the actual NSWindow from Tauri's window handle
    let window_handle = window.ns_window().map_err(|_| "Failed to get window handle")?;
    Ok(window_handle as id)
}

unsafe fn get_content_view(ns_window: id) -> Result<id, String> {
    let content_view: id = msg_send![ns_window, contentView];
    if content_view.is_null() {
        return Err("Failed to get content view".to_string());
    }
    Ok(content_view)
}

unsafe fn create_visual_effect_view(material: &Option<String>) -> Result<id, String> {
    let visual_effect_class = Class::get("NSVisualEffectView")
        .ok_or("NSVisualEffectView class not found")?;

    let visual_effect_view: id = msg_send![visual_effect_class, alloc];
    let visual_effect_view: id = msg_send![visual_effect_view, init];

    if visual_effect_view.is_null() {
        return Err("Failed to create NSVisualEffectView".to_string());
    }

    // Set material based on parameter
    let material_value = match material.as_deref() {
        Some("liquid") => 3, // NSVisualEffectMaterial.liquid (if available)
        Some("glass") => 2,  // NSVisualEffectMaterial.glass
        _ => 1,              // NSVisualEffectMaterial.hudWindow (default)
    };

    let _: () = msg_send![visual_effect_view, setMaterial: material_value];

    Ok(visual_effect_view)
}

unsafe fn configure_visual_effect_view(visual_effect_view: id) -> Result<(), String> {
    // Set state to active
    let _: () = msg_send![visual_effect_view, setState: 1]; // NSVisualEffectState.active

    // Set blending mode to behind window
    let _: () = msg_send![visual_effect_view, setBlendingMode: 1]; // NSVisualEffectBlendingMode.behindWindow

    // Make it transparent outside the bounds
    let _: () = msg_send![visual_effect_view, setMaskImage: 0]; // No mask for now

    Ok(())
}
