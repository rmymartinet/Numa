//! Module de séparation des plateformes
//! Isole le code unsafe et spécifique à chaque plateforme

// Module macOS - seulement si feature stealth_macos activée
#[cfg(all(target_os = "macos", feature = "stealth_macos"))]
pub mod macos;

// Module stub pour les autres plateformes ou si stealth_macos désactivé
#[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
pub mod stub;

// Re-export des fonctions selon la plateforme et les features
#[cfg(all(target_os = "macos", feature = "stealth_macos"))]
pub use macos::*;

#[cfg(not(all(target_os = "macos", feature = "stealth_macos")))]
pub use stub::*;
