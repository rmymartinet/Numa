//! Types d'erreurs pour l'application
//! Utilise thiserror pour une gestion d'erreurs typée et chaînée

use thiserror::Error;

/// Erreurs liées au mode furtif
#[derive(Error, Debug)]
pub enum StealthError {
    #[error("Window not found: {window_label}")]
    WindowNotFound { window_label: String },
    
    #[error("Failed to get NS window: {0}")]
    NSWindowError(#[from] tauri::Error),
    
    #[error("Stealth state error: {0}")]
    StateError(String),
    
    #[error("Platform not supported: {platform}")]
    PlatformNotSupported { platform: String },
}

/// Erreurs liées aux fenêtres
#[derive(Error, Debug)]
pub enum WindowError {
    #[error("Window not found: {label}")]
    NotFound { label: String },
    
    #[error("Failed to create window: {0}")]
    CreationFailed(#[from] tauri::Error),
    
    #[error("Failed to configure window: {0}")]
    ConfigurationFailed(String),
}

/// Erreurs liées aux captures d'écran
#[derive(Error, Debug)]
pub enum CaptureError {
    #[error("Screenshot failed: {0}")]
    ScreenshotFailed(String),
    
    #[error("Image processing failed: {0}")]
    ImageProcessingFailed(String),
    
    #[error("File I/O error: {0}")]
    IoError(#[from] std::io::Error),
}

/// Type d'erreur générique pour l'application
pub type AppResult<T> = Result<T, AppError>;

/// Erreur principale de l'application
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Stealth error: {0}")]
    Stealth(#[from] StealthError),
    
    #[error("Window error: {0}")]
    Window(#[from] WindowError),
    
    #[error("Capture error: {0}")]
    Capture(#[from] CaptureError),
    
    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),
    
    #[error("Unknown error: {0}")]
    Unknown(String),
}
