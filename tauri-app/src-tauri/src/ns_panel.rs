use std::sync::{Mutex, Once};

use objc_id::{Id, ShareId};
use tauri::{
    AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewWindow, Wry,
};

use cocoa::{
    appkit::{CGFloat, NSMainMenuWindowLevel, NSWindow, NSWindowCollectionBehavior},
    base::{id, nil, BOOL, NO, YES},
    foundation::{NSPoint, NSRect},
};
use objc::{
    class,
    declare::ClassDecl,
    msg_send,
    runtime::{self, Class, Object, Protocol, Sel},
    sel, sel_impl, Message,
};
use objc_foundation::INSObject;

#[link(name = "Foundation", kind = "framework")]
extern "C" {
    pub fn NSMouseInRect(aPoint: NSPoint, aRect: NSRect, flipped: BOOL) -> BOOL;
}

#[derive(Default)]
pub struct Store {
    panel: Option<ShareId<RawNSPanel>>,
    context_panel: Option<ShareId<RawNSPanel>>,
    input_panel: Option<ShareId<RawNSPanel>>,
}

impl Store {
    pub fn get_panel_ptr(&self) -> Option<*mut std::ffi::c_void> {
        self.panel.as_ref().map(|panel| {
            use objc::runtime::Object;
            unsafe {
                std::mem::transmute::<&RawNSPanel, *const Object>(panel) as *mut std::ffi::c_void
            }
        })
    }
}

#[derive(Default)]
pub struct State(pub Mutex<Store>);

#[macro_export]
macro_rules! set_state {
    ($app_handle:expr, $field:ident, $value:expr) => {{
        let handle = $app_handle.app_handle();
        handle
            .state::<$crate::ns_panel::State>()
            .0
            .lock()
            .unwrap()
            .$field = $value;
    }};
}

#[macro_export]
macro_rules! get_state {
    ($app_handle:expr, $field:ident) => {{
        let handle = $app_handle.app_handle();
        let value = handle
            .state::<$crate::ns_panel::State>()
            .0
            .lock()
            .unwrap()
            .$field;

        value
    }};
    ($app_handle:expr, $field:ident, $action:ident) => {{
        let handle = $app_handle.app_handle();
        let value = handle
            .state::<$crate::ns_panel::State>()
            .0
            .lock()
            .unwrap()
            .$field
            .$action();

        value
    }};
}

#[macro_export]
macro_rules! panel {
    ($app_handle:expr) => {{
        let handle = $app_handle.app_handle();
        let panel = handle
            .state::<$crate::ns_panel::State>()
            .0
            .lock()
            .unwrap()
            .panel
            .clone();

        panel.unwrap()
    }};
}

#[macro_export]
macro_rules! nsstring_to_string {
    ($ns_string:expr) => {{
        use objc::{sel, sel_impl};
        let utf8: id = unsafe { objc::msg_send![$ns_string, UTF8String] };
        let string = if !utf8.is_null() {
            Some(unsafe {
                {
                    std::ffi::CStr::from_ptr(utf8 as *const std::ffi::c_char)
                        .to_string_lossy()
                        .into_owned()
                }
            })
        } else {
            None
        };

        string
    }};
}

static INIT: Once = Once::new();
static PANEL_LABEL: &str = "hud";

#[tauri::command]
pub fn init_ns_panel(app_handle: AppHandle<Wry>, window: WebviewWindow<Wry>, shortcut: &str) {
    INIT.call_once(|| {
        set_state!(app_handle, panel, Some(create_ns_panel(&window)));
        register_shortcut(app_handle, shortcut);
    });
}

#[tauri::command]
pub fn init_context_ns_panel(app_handle: AppHandle<Wry>, window: WebviewWindow<Wry>) {
    set_state!(app_handle, context_panel, Some(create_context_ns_panel(&window)));
}

#[tauri::command]
pub fn init_input_ns_panel(app_handle: AppHandle<Wry>, window: WebviewWindow<Wry>) {
    set_state!(app_handle, input_panel, Some(create_input_ns_panel(&window)));
}

fn register_shortcut(app_handle: AppHandle<Wry>, shortcut: &str) {
    // For now, we'll handle shortcuts through the application's frontend
    // The global shortcut plugin in Tauri v2 needs special handling
    tracing::info!("🎹 NSPanel shortcut '{}' ready - will be handled by frontend", shortcut);
}

#[tauri::command]
pub fn show_app(app_handle: AppHandle<Wry>) {
    panel!(app_handle).show();
}

#[tauri::command]
pub fn hide_app(app_handle: AppHandle<Wry>) {
    panel!(app_handle).order_out(None);
}

#[tauri::command]
pub fn show_context_panel(app_handle: AppHandle<Wry>) {
    let handle = app_handle.app_handle();
    let state = handle.state::<State>();
    let guard = state.0.lock().unwrap();
    if let Some(context_panel) = &guard.context_panel {
        tracing::info!("🎛️ Affichage du Context NSPanel...");
        context_panel.show();
        tracing::info!("✅ Context NSPanel affiché");
    } else {
        tracing::warn!("❌ Context NSPanel non initialisé !");
    }
}

#[tauri::command]
pub fn hide_context_panel(app_handle: AppHandle<Wry>) {
    let handle = app_handle.app_handle();
    let state = handle.state::<State>();
    let guard = state.0.lock().unwrap();
    if let Some(context_panel) = &guard.context_panel {
        tracing::info!("🎛️ Masquage du Context NSPanel...");
        context_panel.order_out(None);
    } else {
        tracing::warn!("❌ Context NSPanel non initialisé pour masquage !");
    }
}

#[tauri::command]
pub fn show_input_panel(app_handle: AppHandle<Wry>) {
    let handle = app_handle.app_handle();
    let state = handle.state::<State>();
    let guard = state.0.lock().unwrap();
    if let Some(input_panel) = &guard.input_panel {
        tracing::info!("🎛️ Affichage du Input NSPanel...");
        input_panel.show();
        tracing::info!("✅ Input NSPanel affiché");
    } else {
        tracing::warn!("❌ Input NSPanel non initialisé !");
    }
}

#[tauri::command]
pub fn hide_input_panel(app_handle: AppHandle<Wry>) {
    let handle = app_handle.app_handle();
    let state = handle.state::<State>();
    let guard = state.0.lock().unwrap();
    if let Some(input_panel) = &guard.input_panel {
        tracing::info!("🎛️ Masquage du Input NSPanel...");
        input_panel.order_out(None);
    } else {
        tracing::warn!("❌ Input NSPanel non initialisé pour masquage !");
    }
}

/// Positions a given window at the center of the monitor with cursor
fn position_window_at_the_center_of_the_monitor_with_cursor(window: &WebviewWindow<Wry>) {
    if let Some(monitor) = get_monitor_with_cursor() {
        let display_size = monitor.size.to_logical::<f64>(monitor.scale_factor);
        let display_pos = monitor.position.to_logical::<f64>(monitor.scale_factor);

        let handle: id = window.ns_window().unwrap() as _;
        let win_frame: NSRect = unsafe { handle.frame() };
        let rect = NSRect {
            origin: NSPoint {
                x: (display_pos.x + (display_size.width / 2.0)) - (win_frame.size.width / 2.0),
                y: (display_pos.y + (display_size.height / 2.0)) - (win_frame.size.height / 2.0),
            },
            size: win_frame.size,
        };
        let _: () = unsafe { msg_send![handle, setFrame: rect display: YES] };
    }
}

struct Monitor {
    #[allow(dead_code)]
    pub name: Option<String>,
    pub size: PhysicalSize<u32>,
    pub position: PhysicalPosition<i32>,
    pub scale_factor: f64,
}

/// Gets the Monitor with cursor
fn get_monitor_with_cursor() -> Option<Monitor> {
    objc::rc::autoreleasepool(|| {
        let mouse_location: NSPoint = unsafe { msg_send![class!(NSEvent), mouseLocation] };
        let screens: id = unsafe { msg_send![class!(NSScreen), screens] };
        let screens_iter: id = unsafe { msg_send![screens, objectEnumerator] };
        let mut next_screen: id;

        let frame_with_cursor: Option<NSRect> = loop {
            next_screen = unsafe { msg_send![screens_iter, nextObject] };
            if next_screen == nil {
                break None;
            }

            let frame: NSRect = unsafe { msg_send![next_screen, frame] };
            let is_mouse_in_screen_frame: BOOL =
                unsafe { NSMouseInRect(mouse_location, frame, NO) };
            if is_mouse_in_screen_frame == YES {
                break Some(frame);
            }
        };

        if let Some(frame) = frame_with_cursor {
            let name: id = unsafe { msg_send![next_screen, localizedName] };
            let screen_name = nsstring_to_string!(name);
            let scale_factor: CGFloat = unsafe { msg_send![next_screen, backingScaleFactor] };
            let scale_factor: f64 = scale_factor;

            return Some(Monitor {
                name: screen_name,
                position: PhysicalPosition {
                    x: (frame.origin.x * scale_factor) as i32,
                    y: (frame.origin.y * scale_factor) as i32,
                },
                size: PhysicalSize {
                    width: (frame.size.width * scale_factor) as u32,
                    height: (frame.size.height * scale_factor) as u32,
                },
                scale_factor,
            });
        }

        None
    })
}

extern "C" {
    pub fn object_setClass(obj: id, cls: id) -> id;
}

#[allow(non_upper_case_globals)]
const NSWindowStyleMaskNonActivatingPanel: i32 = 1 << 7;

const CLS_NAME: &str = "RawNSPanel";

pub struct RawNSPanel;

impl RawNSPanel {
    fn get_class() -> &'static Class {
        Class::get(CLS_NAME).unwrap_or_else(Self::define_class)
    }

    fn define_class() -> &'static Class {
        let mut cls = ClassDecl::new(CLS_NAME, class!(NSPanel))
            .unwrap_or_else(|| panic!("Unable to register {} class", CLS_NAME));

        unsafe {
            cls.add_method(
                sel!(canBecomeKeyWindow),
                Self::can_become_key_window as extern "C" fn(&Object, Sel) -> BOOL,
            );
        }

        cls.register()
    }

    /// Returns YES to ensure that RawNSPanel can become a key window
    extern "C" fn can_become_key_window(_: &Object, _: Sel) -> BOOL {
        YES
    }
}
unsafe impl Message for RawNSPanel {}

impl RawNSPanel {
    fn show(&self) {
        // 🎛️ Debug info avant affichage
        self.log_debug_info("avant show");
        
        // 🎛️ Vérifier et corriger la position/taille si nécessaire
        self.ensure_visible_position();
        
        self.make_first_responder(Some(self.content_view()));
        self.order_front_regardless();
        self.make_key_window();
        
        // 🎛️ Debug info après affichage
        self.log_debug_info("après show");
    }
    
    fn log_debug_info(&self, moment: &str) {
        let frame = self.get_frame();
        let visible = self.is_visible();
        tracing::info!(
            "🎛️ NSPanel {} - Visible: {}, Position: ({:.1}, {:.1}), Taille: {:.1}x{:.1}",
            moment, visible, frame.origin.x, frame.origin.y, frame.size.width, frame.size.height
        );
    }
    
    fn get_frame(&self) -> NSRect {
        unsafe { msg_send![self, frame] }
    }

    fn is_visible(&self) -> bool {
        let flag: BOOL = unsafe { msg_send![self, isVisible] };
        flag == YES
    }

    fn make_key_window(&self) {
        let _: () = unsafe { msg_send![self, makeKeyWindow] };
    }

    fn order_front_regardless(&self) {
        let _: () = unsafe { msg_send![self, orderFrontRegardless] };
    }

    fn order_out(&self, sender: Option<id>) {
        let _: () = unsafe { msg_send![self, orderOut: sender.unwrap_or(nil)] };
    }

    fn content_view(&self) -> id {
        unsafe { msg_send![self, contentView] }
    }

    fn make_first_responder(&self, sender: Option<id>) {
        if let Some(responder) = sender {
            let _: () = unsafe { msg_send![self, makeFirstResponder: responder] };
        } else {
            let _: () = unsafe { msg_send![self, makeFirstResponder: self] };
        }
    }

    fn set_level(&self, level: i32) {
        let _: () = unsafe { msg_send![self, setLevel: level] };
    }

    fn set_style_mask(&self, style_mask: i32) {
        let _: () = unsafe { msg_send![self, setStyleMask: style_mask] };
    }

    fn set_collection_behaviour(&self, behaviour: NSWindowCollectionBehavior) {
        let _: () = unsafe { msg_send![self, setCollectionBehavior: behaviour] };
    }

    fn set_delegate(&self, delegate: Option<Id<RawNSPanelDelegate>>) {
        if let Some(del) = delegate {
            let _: () = unsafe { msg_send![self, setDelegate: del] };
        } else {
            let _: () = unsafe { msg_send![self, setDelegate: self] };
        }
    }
    
    fn set_frame(&self, frame: NSRect) {
        let _: () = unsafe { msg_send![self, setFrame: frame display: YES] };
    }
    
    fn ensure_visible_position(&self) {
        let frame = self.get_frame();
        
        // Si position ou taille semble problématique, corriger
        if frame.size.width < 10.0 || frame.size.height < 10.0 || 
           frame.origin.x < -1000.0 || frame.origin.y < -1000.0 ||
           frame.origin.x > 3000.0 || frame.origin.y > 3000.0 {
            
            tracing::warn!("🎛️ Position/taille problématique détectée, correction...");
            
            let new_frame = NSRect {
                origin: NSPoint { x: 100.0, y: 100.0 },
                size: cocoa::foundation::NSSize { width: 400.0, height: 300.0 },
            };
            
            self.set_frame(new_frame);
            tracing::info!("🎛️ Position corrigée: (100, 100) 400x300");
        }
    }

    /// Create an NSPanel from Tauri's NSWindow
    fn from(ns_window: id) -> Id<Self> {
        let ns_panel: id = unsafe { msg_send![Self::class(), class] };
        unsafe {
            object_setClass(ns_window, ns_panel);
            Id::from_retained_ptr(ns_window as *mut Self)
        }
    }
}

impl INSObject for RawNSPanel {
    fn class() -> &'static runtime::Class {
        RawNSPanel::get_class()
    }
}

#[allow(dead_code)]
const DELEGATE_CLS_NAME: &str = "RawNSPanelDelegate";

#[allow(dead_code)]
struct RawNSPanelDelegate {}

impl RawNSPanelDelegate {
    #[allow(dead_code)]
    fn get_class() -> &'static Class {
        Class::get(DELEGATE_CLS_NAME).unwrap_or_else(Self::define_class)
    }

    #[allow(dead_code)]
    fn define_class() -> &'static Class {
        let mut cls = ClassDecl::new(DELEGATE_CLS_NAME, class!(NSObject))
            .unwrap_or_else(|| panic!("Unable to register {} class", DELEGATE_CLS_NAME));

        cls.add_protocol(
            Protocol::get("NSWindowDelegate").expect("Failed to get NSWindowDelegate protocol"),
        );

        unsafe {
            cls.add_ivar::<id>("panel");

            cls.add_method(
                sel!(setPanel:),
                Self::set_panel as extern "C" fn(&mut Object, Sel, id),
            );

            cls.add_method(
                sel!(windowDidBecomeKey:),
                Self::window_did_become_key as extern "C" fn(&Object, Sel, id),
            );

            cls.add_method(
                sel!(windowDidResignKey:),
                Self::window_did_resign_key as extern "C" fn(&Object, Sel, id),
            );
        }

        cls.register()
    }

    extern "C" fn set_panel(this: &mut Object, _: Sel, panel: id) {
        unsafe { this.set_ivar("panel", panel) };
    }

    extern "C" fn window_did_become_key(_: &Object, _: Sel, _: id) {}

    /// Hide panel when it's no longer the key window
    /// 🎛️ DÉSACTIVÉ temporairement pour permettre coexistence avec Context
    extern "C" fn window_did_resign_key(_this: &Object, _: Sel, _: id) {
        // Ne plus cacher automatiquement le HUD pour permettre la coexistence
        // let panel: id = unsafe { *this.get_ivar("panel") };
        // let _: () = unsafe { msg_send![panel, orderOut: nil] };
        tracing::info!("🎛️ HUD resign key - pas de masquage automatique pour coexistence");
    }
}

unsafe impl Message for RawNSPanelDelegate {}

impl INSObject for RawNSPanelDelegate {
    fn class() -> &'static runtime::Class {
        Self::get_class()
    }
}

impl RawNSPanelDelegate {
    pub fn set_panel_(&self, panel: ShareId<RawNSPanel>) {
        let _: () = unsafe { msg_send![self, setPanel: panel] };
    }
}

fn create_ns_panel(window: &WebviewWindow<Wry>) -> ShareId<RawNSPanel> {
    create_ns_panel_with_delegate(window, true)
}

fn create_context_ns_panel(window: &WebviewWindow<Wry>) -> ShareId<RawNSPanel> {
    create_ns_panel_with_delegate(window, false)
}

fn create_input_ns_panel(window: &WebviewWindow<Wry>) -> ShareId<RawNSPanel> {
    create_ns_panel_with_delegate(window, false)
}

fn create_ns_panel_with_delegate(window: &WebviewWindow<Wry>, with_auto_hide: bool) -> ShareId<RawNSPanel> {
    // Convert NSWindow Object to NSPanel
    let handle: id = window.ns_window().unwrap() as _;
    let panel = RawNSPanel::from(handle);
    let panel = panel.share();

    // 🎛️ Niveaux élevés pour les deux pour garantir fullscreen
    if with_auto_hide {
        // HUD - niveau le plus élevé 
        panel.set_level(NSMainMenuWindowLevel + 3);
        tracing::info!("🎛️ HUD NSPanel créé - niveau: {}", NSMainMenuWindowLevel + 3);
    } else {
        // Context - niveau élevé aussi pour fullscreen (juste en dessous du HUD)
        panel.set_level(NSMainMenuWindowLevel + 2);
        tracing::info!("🎛️ Context NSPanel créé - niveau: {}", NSMainMenuWindowLevel + 2);
    }

    // Ensure that the panel can display over the top of fullscreen apps
    panel.set_collection_behaviour(
        NSWindowCollectionBehavior::NSWindowCollectionBehaviorTransient
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorMoveToActiveSpace
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
    );

    // 🎛️ EXPÉRIMENTATION : même style mask pour les deux pour MoveToActiveSpace
    // Utiliser NSWindowStyleMaskNonActivatingPanel pour les deux
    panel.set_style_mask(NSWindowStyleMaskNonActivatingPanel);
    
    if with_auto_hide {
        tracing::info!("🎛️ HUD avec NonActivatingPanel pour MoveToActiveSpace");
    } else {
        tracing::info!("🎛️ Context avec NonActivatingPanel pour MoveToActiveSpace");
    }

    // 🎛️ Setup delegate seulement pour HUD
    if with_auto_hide {
        let delegate = RawNSPanelDelegate::new();
        delegate.set_panel_(panel.clone());
        panel.set_delegate(Some(delegate));
    }

    panel
}
