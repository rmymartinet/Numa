//! Module de séparation des plateformes
//! Isole le code unsafe et spécifique à chaque plateforme

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(not(target_os = "macos"))]
pub mod stub;

// Re-export des fonctions selon la plateforme
#[cfg(target_os = "macos")]
pub use macos::*;

#[cfg(not(target_os = "macos"))]
pub use stub::*;
